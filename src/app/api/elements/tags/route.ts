import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/auth/middleware';
import { createServerClient } from '@/lib/db/server';

// GET /api/elements/tags - Get all unique tags for user's elements
async function handleGet(
  request: NextRequest,
  user: AuthenticatedUser,
  _context: { params: Promise<Record<string, string>> }
) {
  const supabase = await createServerClient();

  try {
    // Query all elements for the user to extract tags
    const { data: elements, error } = await supabase
      .from('elements')
      .select('tags')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching element tags:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tags' },
        { status: 500 }
      );
    }

    // Extract and deduplicate all tags
    const allTags = new Set<string>();

    for (const element of elements || []) {
      if (Array.isArray(element.tags)) {
        for (const tag of element.tags) {
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
    console.error('Error getting tags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGet);
