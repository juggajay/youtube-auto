import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/auth/middleware';
import { createServerClient } from '@/lib/db/server';
import { ContentType, ContentItem, ContentItemUpdate } from '@/types/database';

const VALID_CONTENT_TYPES: ContentType[] = ['hook', 'title', 'description', 'intro', 'cta', 'outline', 'script'];

// GET /api/content/:id - Get a single content item
async function handleGet(
  request: NextRequest,
  user: AuthenticatedUser,
  context: { params: Promise<Record<string, string>> }
) {
  const supabase = await createServerClient();
  const params = await context.params;
  const contentId = params.id;

  if (!contentId) {
    return NextResponse.json({ error: 'Content ID required' }, { status: 400 });
  }

  const { data: item, error } = await supabase
    .from('content_library')
    .select('*')
    .eq('id', contentId)
    .single();

  if (error || !item) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 });
  }

  // Verify ownership
  if (item.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ item: item as ContentItem });
}

// PUT /api/content/:id - Update content item
async function handlePut(
  request: NextRequest,
  user: AuthenticatedUser,
  context: { params: Promise<Record<string, string>> }
) {
  const supabase = await createServerClient();
  const params = await context.params;
  const contentId = params.id;

  if (!contentId) {
    return NextResponse.json({ error: 'Content ID required' }, { status: 400 });
  }

  // Verify ownership first
  const { data: existing, error: fetchError } = await supabase
    .from('content_library')
    .select('*')
    .eq('id', contentId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 });
  }

  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Parse request body
  const body = await request.json();
  const { name, type, content, tags, topic, archetype, metadata } = body as {
    name?: string;
    type?: ContentType;
    content?: string;
    tags?: string[];
    topic?: string | null;
    archetype?: string | null;
    metadata?: Record<string, unknown>;
  };

  // Build update object
  const updates: ContentItemUpdate = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name must be a non-empty string' }, { status: 400 });
    }
    updates.name = name.trim();
  }

  if (type !== undefined) {
    if (!VALID_CONTENT_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_CONTENT_TYPES.join(', ')}` },
        { status: 400 }
      );
    }
    updates.type = type;
  }

  if (content !== undefined) {
    if (typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content must be a non-empty string' }, { status: 400 });
    }
    updates.content = content.trim();
  }

  if (tags !== undefined) {
    if (!Array.isArray(tags) || !tags.every((t) => typeof t === 'string')) {
      return NextResponse.json({ error: 'Tags must be an array of strings' }, { status: 400 });
    }
    updates.tags = tags.map((t) => t.trim()).filter((t) => t.length > 0);
  }

  if (topic !== undefined) {
    updates.topic = topic?.trim() || null;
  }

  if (archetype !== undefined) {
    updates.archetype = archetype?.trim() || null;
  }

  if (metadata !== undefined) {
    if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
      return NextResponse.json({ error: 'Metadata must be an object' }, { status: 400 });
    }
    updates.metadata = metadata;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
  }

  // Perform update
  const { data: item, error: updateError } = await supabase
    .from('content_library')
    .update(updates)
    .eq('id', contentId)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating content:', updateError);
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }

  return NextResponse.json({ item: item as ContentItem });
}

// DELETE /api/content/:id - Delete content item
async function handleDelete(
  request: NextRequest,
  user: AuthenticatedUser,
  context: { params: Promise<Record<string, string>> }
) {
  const supabase = await createServerClient();
  const params = await context.params;
  const contentId = params.id;

  if (!contentId) {
    return NextResponse.json({ error: 'Content ID required' }, { status: 400 });
  }

  // Verify ownership first
  const { data: existing, error: fetchError } = await supabase
    .from('content_library')
    .select('*')
    .eq('id', contentId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 });
  }

  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Delete record
  const { error: deleteError } = await supabase
    .from('content_library')
    .delete()
    .eq('id', contentId);

  if (deleteError) {
    console.error('Error deleting content:', deleteError);
    return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export const GET = withAuth(handleGet);
export const PUT = withAuth(handlePut);
export const DELETE = withAuth(handleDelete);
