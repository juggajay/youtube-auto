import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/auth/middleware';
import { runManager } from '@/lib/runs';

// GET /api/runs - List all runs for user
async function handleGet(
  request: NextRequest,
  user: AuthenticatedUser,
  _context: { params: Promise<Record<string, string>> }
) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  const runs = await runManager.listRuns(user.id, limit);
  return NextResponse.json({ runs });
}

// POST /api/runs - Create a new run
async function handlePost(
  request: NextRequest,
  user: AuthenticatedUser,
  _context: { params: Promise<Record<string, string>> }
) {
  const body = await request.json();
  const { workflowId, config } = body;

  const run = await runManager.createRun({
    userId: user.id,
    workflowId,
    config,
  });

  if (!run) {
    return NextResponse.json(
      { error: 'Failed to create run' },
      { status: 500 }
    );
  }

  return NextResponse.json({ run }, { status: 201 });
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
