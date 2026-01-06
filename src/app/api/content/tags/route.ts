import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/auth/middleware';
import { createServerClient } from '@/lib/db/server';

// GET /api/content/tags - Get all unique tags for user's content
async function handleGet(
  request: NextRequest,
  user: AuthenticatedUser,
  _context: { params: Promise<Record<string, string>> }
) {
  const supabase = await createServerClient();

  try {
    // Query all content for the user to extract tags
    const { data: items, error } = await supabase
      .from('content_library')
      .select('tags')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching content tags:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tags' },
        { status: 500 }
      );
    }

    // Extract and deduplicate all tags
    const allTags = new Set<string>();

    for (const item of items || []) {
      if (Array.isArray(item.tags)) {
        for (const tag of item.tags) {
          if (typeof tag === 'string' && tag.trim()) {
            allTags.add(tag.trim());
          }
        }
      }
    }

    // Convert to sorted array
    const sortedTags = Array.from(allTags).sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    );

    return NextResponse.json({ tags: sortedTags });
  } catch (error) {
    console.error('Error getting content tags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGet);
