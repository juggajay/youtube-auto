import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/auth/middleware';
import { createServerClient } from '@/lib/db/server';
import { ElementType, ElementWithUrl, Element, ElementUpdate } from '@/types/database';

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

// GET /api/elements/:id - Get a single element
async function handleGet(
  request: NextRequest,
  user: AuthenticatedUser,
  context: { params: Promise<Record<string, string>> }
) {
  const supabase = await createServerClient();
  const params = await context.params;
  const elementId = params.id;

  if (!elementId) {
    return NextResponse.json({ error: 'Element ID required' }, { status: 400 });
  }

  const { data: element, error } = await supabase
    .from('elements')
    .select('*')
    .eq('id', elementId)
    .single();

  if (error || !element) {
    return NextResponse.json({ error: 'Element not found' }, { status: 404 });
  }

  // Verify ownership
  if (element.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const elementWithUrl = await addUrlsToElement(supabase, element as Element);

  return NextResponse.json({ element: elementWithUrl });
}

// PUT /api/elements/:id - Update element metadata
async function handlePut(
  request: NextRequest,
  user: AuthenticatedUser,
  context: { params: Promise<Record<string, string>> }
) {
  const supabase = await createServerClient();
  const params = await context.params;
  const elementId = params.id;

  if (!elementId) {
    return NextResponse.json({ error: 'Element ID required' }, { status: 400 });
  }

  // Verify ownership first
  const { data: existing, error: fetchError } = await supabase
    .from('elements')
    .select('*')
    .eq('id', elementId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Element not found' }, { status: 404 });
  }

  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Parse request body
  const body = await request.json();
  const { name, type, tags } = body as {
    name?: string;
    type?: ElementType;
    tags?: string[];
  };

  // Build update object
  const updates: ElementUpdate = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name must be a non-empty string' }, { status: 400 });
    }
    updates.name = name.trim();
  }

  if (type !== undefined) {
    const validTypes: ElementType[] = ['logo', 'overlay', 'background', 'character', 'prop', 'other'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` }, { status: 400 });
    }
    updates.type = type;
  }

  if (tags !== undefined) {
    if (!Array.isArray(tags) || !tags.every((t) => typeof t === 'string')) {
      return NextResponse.json({ error: 'Tags must be an array of strings' }, { status: 400 });
    }
    updates.tags = tags.map((t) => t.trim()).filter((t) => t.length > 0);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
  }

  // Perform update
  const { data: element, error: updateError } = await supabase
    .from('elements')
    .update(updates)
    .eq('id', elementId)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating element:', updateError);
    return NextResponse.json({ error: 'Failed to update element' }, { status: 500 });
  }

  const elementWithUrl = await addUrlsToElement(supabase, element as Element);

  return NextResponse.json({ element: elementWithUrl });
}

// DELETE /api/elements/:id - Delete element and storage files
async function handleDelete(
  request: NextRequest,
  user: AuthenticatedUser,
  context: { params: Promise<Record<string, string>> }
) {
  const supabase = await createServerClient();
  const params = await context.params;
  const elementId = params.id;

  if (!elementId) {
    return NextResponse.json({ error: 'Element ID required' }, { status: 400 });
  }

  // Verify ownership and get storage paths
  const { data: existing, error: fetchError } = await supabase
    .from('elements')
    .select('*')
    .eq('id', elementId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Element not found' }, { status: 404 });
  }

  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Collect paths to delete
  const pathsToDelete: string[] = [existing.storage_path];
  if (existing.thumbnail_path) {
    pathsToDelete.push(existing.thumbnail_path);
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('elements')
    .remove(pathsToDelete);

  if (storageError) {
    console.error('Error deleting storage files:', storageError);
    // Continue to delete DB record even if storage deletion fails
    // The files will be orphaned but at least the user can re-upload
  }

  // Delete database record
  const { error: deleteError } = await supabase
    .from('elements')
    .delete()
    .eq('id', elementId);

  if (deleteError) {
    console.error('Error deleting element record:', deleteError);
    return NextResponse.json({ error: 'Failed to delete element' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export const GET = withAuth(handleGet);
export const PUT = withAuth(handlePut);
export const DELETE = withAuth(handleDelete);
