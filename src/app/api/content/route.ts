import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/auth/middleware';
import { createServerClient } from '@/lib/db/server';
import { ContentType, ContentItem, ContentItemInsert } from '@/types/database';

const VALID_CONTENT_TYPES: ContentType[] = ['hook', 'title', 'description', 'intro', 'cta', 'outline', 'script'];

// GET /api/content - List content with filtering
async function handleGet(
  request: NextRequest,
  user: AuthenticatedUser,
  _context: { params: Promise<Record<string, string>> }
) {
  const supabase = await createServerClient();
  const { searchParams } = new URL(request.url);

  // Parse query parameters
  const type = searchParams.get('type') as ContentType | null;
  const tagsParam = searchParams.get('tags');
  const tags = tagsParam ? tagsParam.split(',').map((t) => t.trim()) : null;
  const search = searchParams.get('search');
  const topic = searchParams.get('topic');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  // Build query
  let query = supabase
    .from('content_library')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Filter by type
  if (type) {
    if (!VALID_CONTENT_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_CONTENT_TYPES.join(', ')}` },
        { status: 400 }
      );
    }
    query = query.eq('type', type);
  }

  // Filter by tags (any tag matches)
  if (tags && tags.length > 0) {
    query = query.overlaps('tags', tags);
  }

  // Filter by topic
  if (topic) {
    query = query.ilike('topic', `%${topic}%`);
  }

  // Search by name or content
  if (search) {
    query = query.or(`name.ilike.%${search}%,content.ilike.%${search}%`);
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data: items, error, count } = await query;

  if (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }

  const total = count || 0;
  const hasMore = offset + (items?.length || 0) < total;

  return NextResponse.json({
    items: items as ContentItem[],
    total,
    hasMore,
  });
}

// POST /api/content - Create new content item
async function handlePost(
  request: NextRequest,
  user: AuthenticatedUser,
  _context: { params: Promise<Record<string, string>> }
) {
  const supabase = await createServerClient();

  try {
    const body = await request.json();
    const { name, type, content, tags, topic, archetype, metadata } = body as {
      name?: string;
      type?: ContentType;
      content?: string;
      tags?: string[];
      topic?: string;
      archetype?: string;
      metadata?: Record<string, unknown>;
    };

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ error: 'Type is required' }, { status: 400 });
    }

    if (!VALID_CONTENT_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_CONTENT_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Validate optional fields
    if (tags !== undefined && (!Array.isArray(tags) || !tags.every((t) => typeof t === 'string'))) {
      return NextResponse.json({ error: 'Tags must be an array of strings' }, { status: 400 });
    }

    // Build insert object
    const insertData: ContentItemInsert = {
      user_id: user.id,
      name: name.trim(),
      type,
      content: content.trim(),
      tags: tags ? tags.map((t) => t.trim()).filter((t) => t.length > 0) : [],
      topic: topic?.trim() || null,
      archetype: archetype?.trim() || null,
      metadata: metadata || {},
    };

    const { data: item, error } = await supabase
      .from('content_library')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating content:', error);
      return NextResponse.json(
        { error: 'Failed to create content' },
        { status: 500 }
      );
    }

    return NextResponse.json({ item: item as ContentItem }, { status: 201 });
  } catch (error) {
    console.error('Error creating content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
