import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/auth/middleware';
import { createServerClient } from '@/lib/db/server';
import { ElementWithUrl, Element, ResolvedElement } from '@/types/database';

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

// POST /api/elements/resolve - Resolve @tags to elements
async function handlePost(
  request: NextRequest,
  user: AuthenticatedUser,
  _context: { params: Promise<Record<string, string>> }
) {
  const supabase = await createServerClient();

  try {
    const body = await request.json();
    const { tags } = body as { tags?: string[] };

    // Validate input
    if (!tags || !Array.isArray(tags)) {
      return NextResponse.json({ error: 'tags must be an array of strings' }, { status: 400 });
    }

    if (tags.length === 0) {
      return NextResponse.json({ resolved: [], missing: [] });
    }

    // Normalize tags (lowercase, trimmed)
    const normalizedTags = tags.map((t) => t.trim().toLowerCase());
    const uniqueTags = [...new Set(normalizedTags)];

    const resolved: ResolvedElement[] = [];
    const missing: string[] = [];
    const resolvedElementIds: string[] = [];

    // For each tag, find matching elements
    for (const tag of uniqueTags) {
      // Query elements where tags array contains the tag (case-insensitive via lowercase)
      // We need to handle case-insensitivity by checking if any tag matches
      const { data: elements, error } = await supabase
        .from('elements')
        .select('*')
        .eq('user_id', user.id)
        .order('last_used_at', { ascending: false, nullsFirst: false })
        .order('used_count', { ascending: false });

      if (error) {
        console.error('Error querying elements for tag:', tag, error);
        missing.push(tag);
        continue;
      }

      // Filter elements that have a matching tag (case-insensitive)
      const matchingElements = (elements || []).filter((el) =>
        el.tags?.some((t: string) => t.toLowerCase() === tag)
      );

      if (matchingElements.length === 0) {
        missing.push(tag);
        continue;
      }

      // Use the first match (most recently used due to ordering)
      const element = matchingElements[0] as Element;
      const elementWithUrl = await addUrlsToElement(supabase, element);

      resolved.push({
        tag,
        element: elementWithUrl,
      });

      resolvedElementIds.push(element.id);
    }

    // Update used_count and last_used_at for resolved elements
    if (resolvedElementIds.length > 0) {
      const now = new Date().toISOString();

      // Update each resolved element - fetch current count and increment
      for (const elementId of resolvedElementIds) {
        try {
          // First, try to get current count
          const { data: current } = await supabase
            .from('elements')
            .select('used_count')
            .eq('id', elementId)
            .single();

          if (current) {
            await supabase
              .from('elements')
              .update({
                used_count: (current.used_count || 0) + 1,
                last_used_at: now,
              })
              .eq('id', elementId);
          }
        } catch (updateError) {
          // Log but don't fail the request if usage tracking fails
          console.warn('Failed to update element usage:', elementId, updateError);
        }
      }
    }

    return NextResponse.json({
      resolved,
      missing,
    });
  } catch (error) {
    console.error('Error resolving tags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handlePost);
