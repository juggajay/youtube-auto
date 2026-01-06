import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/auth/middleware';
import { createServerClient } from '@/lib/db/server';
import { v4 as uuidv4 } from 'uuid';
import { ElementType, ElementWithUrl, Element, ElementInsert } from '@/types/database';
import sharp from 'sharp';

// Allowed image MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const THUMBNAIL_WIDTH = 300;

/**
 * Generate signed URLs for an element
 */
async function addUrlsToElement(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  element: Element
): Promise<ElementWithUrl> {
  // Generate signed URL for original file (1 hour expiry)
  const { data: urlData } = await supabase.storage
    .from('elements')
    .createSignedUrl(element.storage_path, 3600);

  let thumbnailUrl: string | null = null;
  if (element.thumbnail_path) {
    const { data: thumbData } = await supabase.storage
      .from('elements')
      .createSignedUrl(element.thumbnail_path, 3600);
    thumbnailUrl = thumbData?.signedUrl || null;
  }

  return {
    ...element,
    url: urlData?.signedUrl || '',
    thumbnail_url: thumbnailUrl,
  };
}

// GET /api/elements - List elements with filtering
async function handleGet(
  request: NextRequest,
  user: AuthenticatedUser,
  _context: { params: Promise<Record<string, string>> }
) {
  const supabase = await createServerClient();
  const { searchParams } = new URL(request.url);

  // Parse query parameters
  const type = searchParams.get('type') as ElementType | null;
  const tagsParam = searchParams.get('tags');
  const tags = tagsParam ? tagsParam.split(',').map((t) => t.trim()) : null;
  const search = searchParams.get('search');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  // Build query
  let query = supabase
    .from('elements')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Filter by type
  if (type) {
    query = query.eq('type', type);
  }

  // Filter by tags (any tag matches)
  if (tags && tags.length > 0) {
    query = query.overlaps('tags', tags);
  }

  // Search by name or tags
  if (search) {
    // Search in name OR check if any tag contains the search term
    query = query.or(`name.ilike.%${search}%,tags.cs.{${search}}`);
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data: elements, error, count } = await query;

  if (error) {
    console.error('Error fetching elements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch elements' },
      { status: 500 }
    );
  }

  // Generate signed URLs for all elements
  const elementsWithUrls: ElementWithUrl[] = await Promise.all(
    (elements || []).map((element) => addUrlsToElement(supabase, element as Element))
  );

  const total = count || 0;
  const hasMore = offset + (elements?.length || 0) < total;

  return NextResponse.json({
    elements: elementsWithUrls,
    total,
    hasMore,
  });
}

// POST /api/elements - Upload new element
async function handlePost(
  request: NextRequest,
  user: AuthenticatedUser,
  _context: { params: Promise<Record<string, string>> }
) {
  const supabase = await createServerClient();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const name = formData.get('name') as string | null;
    const type = formData.get('type') as ElementType | null;
    const tagsJson = formData.get('tags') as string | null;
    const metadataJson = formData.get('metadata') as string | null;

    // Validate required fields
    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!type) {
      return NextResponse.json({ error: 'Type is required' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Parse tags and metadata
    let tags: string[] = [];
    let metadata: Record<string, unknown> = {};

    if (tagsJson) {
      try {
        tags = JSON.parse(tagsJson);
        if (!Array.isArray(tags)) {
          tags = [];
        }
      } catch {
        return NextResponse.json({ error: 'Invalid tags JSON' }, { status: 400 });
      }
    }

    if (metadataJson) {
      try {
        metadata = JSON.parse(metadataJson);
      } catch {
        return NextResponse.json({ error: 'Invalid metadata JSON' }, { status: 400 });
      }
    }

    // Generate unique filename
    const uuid = uuidv4();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const storagePath = `${user.id}/${uuid}.${ext}`;
    const thumbnailPath = `${user.id}/thumbs/${uuid}.${ext}`;

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get image dimensions
    let width: number | null = null;
    let height: number | null = null;
    let thumbnailBuffer: Buffer | null = null;

    try {
      const imageMetadata = await sharp(buffer).metadata();
      width = imageMetadata.width || null;
      height = imageMetadata.height || null;

      // Generate thumbnail (300px width, maintain aspect ratio)
      if (file.type !== 'image/svg+xml') {
        thumbnailBuffer = await sharp(buffer)
          .resize(THUMBNAIL_WIDTH, null, { withoutEnlargement: true })
          .toBuffer();
      }
    } catch (imgError) {
      console.warn('Could not process image metadata:', imgError);
      // Continue without thumbnail for SVGs or problematic images
    }

    // Upload original file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('elements')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Upload thumbnail if generated
    let finalThumbnailPath: string | null = null;
    if (thumbnailBuffer) {
      const { error: thumbError } = await supabase.storage
        .from('elements')
        .upload(thumbnailPath, thumbnailBuffer, {
          contentType: file.type,
          upsert: false,
        });

      if (!thumbError) {
        finalThumbnailPath = thumbnailPath;
      } else {
        console.warn('Failed to upload thumbnail:', thumbError);
      }
    }

    // Insert database record
    const elementInsert: ElementInsert = {
      user_id: user.id,
      name,
      type,
      tags,
      storage_path: storagePath,
      thumbnail_path: finalThumbnailPath,
      metadata,
      file_size_bytes: file.size,
      mime_type: file.type,
      width,
      height,
    };

    const { data: element, error: dbError } = await supabase
      .from('elements')
      .insert(elementInsert)
      .select()
      .single();

    if (dbError) {
      console.error('Error inserting element:', dbError);
      // Try to clean up uploaded files
      await supabase.storage.from('elements').remove([storagePath]);
      if (finalThumbnailPath) {
        await supabase.storage.from('elements').remove([finalThumbnailPath]);
      }
      return NextResponse.json(
        { error: 'Failed to create element record' },
        { status: 500 }
      );
    }

    // Return element with URLs
    const elementWithUrl = await addUrlsToElement(supabase, element as Element);

    return NextResponse.json({ element: elementWithUrl }, { status: 201 });
  } catch (error) {
    console.error('Error creating element:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
