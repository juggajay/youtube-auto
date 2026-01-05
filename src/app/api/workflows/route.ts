import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/auth/middleware';
import { runManager } from '@/lib/runs';

// GET /api/workflows - List all workflows for user
async function handleGet(
  request: NextRequest,
  user: AuthenticatedUser,
  _context: { params: Promise<Record<string, string>> }
) {
  const workflows = await runManager.listWorkflows(user.id);
  return NextResponse.json({ workflows });
}

// POST /api/workflows - Create a new workflow
async function handlePost(
  request: NextRequest,
  user: AuthenticatedUser,
  _context: { params: Promise<Record<string, string>> }
) {
  const body = await request.json();
  const { name, description } = body;

  if (!name) {
    return NextResponse.json(
      { error: 'Name is required' },
      { status: 400 }
    );
  }

  const workflow = await runManager.createWorkflow(user.id, name, description);

  if (!workflow) {
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    );
  }

  return NextResponse.json({ workflow }, { status: 201 });
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
