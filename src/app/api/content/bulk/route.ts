import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/auth/middleware';
import { createServerClient } from '@/lib/db/server';
import { ContentType, ContentItem, ContentItemInsert } from '@/types/database';

const VALID_CONTENT_TYPES: ContentType[] = ['hook', 'title', 'description', 'intro', 'cta', 'outline', 'script'];
const MAX_BULK_ITEMS = 100;

interface BulkContentItem {
  name: string;
  type: ContentType;
  content: string;
  tags?: string[];
  topic?: string;
}

// POST /api/content/bulk - Bulk create content items
async function handlePost(
  request: NextRequest,
  user: AuthenticatedUser,
  _context: { params: Promise<Record<string, string>> }
) {
  const supabase = await createServerClient();

  try {
    const body = await request.json();
    const { items } = body as { items?: BulkContentItem[] };

    // Validate items array
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'items must be an array' }, { status: 400 });
    }

    if (items.length === 0) {
      return NextResponse.json({ error: 'items array cannot be empty' }, { status: 400 });
    }

    if (items.length > MAX_BULK_ITEMS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_BULK_ITEMS} items allowed per request` },
        { status: 400 }
      );
    }

    // Validate each item
    const validationErrors: string[] = [];
    const insertData: ContentItemInsert[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Validate name
      if (!item.name || typeof item.name !== 'string' || item.name.trim().length === 0) {
        validationErrors.push(`Item ${i}: name is required`);
        continue;
      }

      // Validate type
      if (!item.type) {
        validationErrors.push(`Item ${i}: type is required`);
        continue;
      }

      if (!VALID_CONTENT_TYPES.includes(item.type)) {
        validationErrors.push(`Item ${i}: invalid type. Must be one of: ${VALID_CONTENT_TYPES.join(', ')}`);
        continue;
      }

      // Validate content
      if (!item.content || typeof item.content !== 'string' || item.content.trim().length === 0) {
        validationErrors.push(`Item ${i}: content is required`);
        continue;
      }

      // Validate tags if provided
      if (item.tags !== undefined && (!Array.isArray(item.tags) || !item.tags.every((t) => typeof t === 'string'))) {
        validationErrors.push(`Item ${i}: tags must be an array of strings`);
        continue;
      }

      // Build insert object
      insertData.push({
        user_id: user.id,
        name: item.name.trim(),
        type: item.type,
        content: item.content.trim(),
        tags: item.tags ? item.tags.map((t) => t.trim()).filter((t) => t.length > 0) : [],
        topic: item.topic?.trim() || null,
      });
    }

    // Return validation errors if any
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // Insert all items
    const { data: createdItems, error } = await supabase
      .from('content_library')
      .insert(insertData)
      .select();

    if (error) {
      console.error('Error bulk creating content:', error);
      return NextResponse.json(
        { error: 'Failed to create content items' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        items: createdItems as ContentItem[],
        count: createdItems?.length || 0,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error bulk creating content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handlePost);
