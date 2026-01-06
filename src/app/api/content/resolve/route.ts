import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/auth/middleware';
import { createServerClient } from '@/lib/db/server';
import { ContentType, ContentItem, ResolvedContent } from '@/types/database';

const VALID_CONTENT_TYPES: ContentType[] = ['hook', 'title', 'description', 'intro', 'cta', 'outline', 'script'];

// POST /api/content/resolve - Resolve @tags to content
async function handlePost(
  request: NextRequest,
  user: AuthenticatedUser,
  _context: { params: Promise<Record<string, string>> }
) {
  const supabase = await createServerClient();

  try {
    const body = await request.json();
    const { tags, type } = body as { tags?: string[]; type?: ContentType };

    // Validate tags
    if (!tags || !Array.isArray(tags)) {
      return NextResponse.json({ error: 'tags must be an array of strings' }, { status: 400 });
    }

    if (tags.length === 0) {
      return NextResponse.json({ resolved: [], missing: [] });
    }

    // Validate type if provided
    if (type && !VALID_CONTENT_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_CONTENT_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Normalize tags (remove @ prefix if present, lowercase, trim)
    const normalizedTags = tags.map((t) => {
      const trimmed = t.trim();
      return trimmed.startsWith('@') ? trimmed.slice(1).toLowerCase() : trimmed.toLowerCase();
    });
    const uniqueTags = [...new Set(normalizedTags)];

    const resolved: ResolvedContent[] = [];
    const missing: string[] = [];
    const resolvedContentIds: string[] = [];

    // For each tag, find matching content
    for (const tag of uniqueTags) {
      // Build query
      let query = supabase
        .from('content_library')
        .select('*')
        .eq('user_id', user.id)
        .order('last_used_at', { ascending: false, nullsFirst: false })
        .order('used_count', { ascending: false });

      // Filter by type if specified
      if (type) {
        query = query.eq('type', type);
      }

      const { data: items, error } = await query;

      if (error) {
        console.error('Error querying content for tag:', tag, error);
        missing.push(tag);
        continue;
      }

      // Filter items that have a matching tag (case-insensitive)
      // Tags can be with or without @ prefix
      const matchingItems = (items || []).filter((item) =>
        item.tags?.some((t: string) => {
          const normalizedItemTag = t.startsWith('@') ? t.slice(1).toLowerCase() : t.toLowerCase();
          return normalizedItemTag === tag;
        })
      );

      if (matchingItems.length === 0) {
        missing.push(tag);
        continue;
      }

      // Use the first match (most recently used due to ordering)
      const item = matchingItems[0] as ContentItem;

      resolved.push({
        tag: `@${tag}`, // Return with @ prefix for consistency
        id: item.id,
        content: item.content,
        type: item.type,
      });

      resolvedContentIds.push(item.id);
    }

    // Update used_count and last_used_at for resolved content
    if (resolvedContentIds.length > 0) {
      const now = new Date().toISOString();

      for (const contentId of resolvedContentIds) {
        try {
          // First, get current count
          const { data: current } = await supabase
            .from('content_library')
            .select('used_count')
            .eq('id', contentId)
            .single();

          if (current) {
            await supabase
              .from('content_library')
              .update({
                used_count: (current.used_count || 0) + 1,
                last_used_at: now,
              })
              .eq('id', contentId);
          }
        } catch (updateError) {
          // Log but don't fail the request if usage tracking fails
          console.warn('Failed to update content usage:', contentId, updateError);
        }
      }
    }

    return NextResponse.json({
      resolved,
      missing,
    });
  } catch (error) {
    console.error('Error resolving content tags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handlePost);
