import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/auth/middleware';
import { runManager } from '@/lib/runs';

// GET /api/runs/:id - Get a specific run with outputs
async function handleGet(
  request: NextRequest,
  user: AuthenticatedUser,
  context: { params: Promise<Record<string, string>> }
) {
  const params = await context.params;
  const runId = params.id;
  if (!runId) {
    return NextResponse.json({ error: 'Run ID required' }, { status: 400 });
  }

  const run = await runManager.getRun(runId);

  if (!run) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 });
  }

  // Verify ownership
  if (run.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const outputs = await runManager.getNodeOutputs(runId);

  return NextResponse.json({ run, outputs });
}

// PUT /api/runs/:id - Update a run (status, etc.)
async function handlePut(
  request: NextRequest,
  user: AuthenticatedUser,
  context: { params: Promise<Record<string, string>> }
) {
  const params = await context.params;
  const runId = params.id;
  if (!runId) {
    return NextResponse.json({ error: 'Run ID required' }, { status: 400 });
  }

  // Verify ownership first
  const existing = await runManager.getRun(runId);
  if (!existing) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 });
  }
  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { status, currentNode, error, config } = body;

  const run = await runManager.updateRun(runId, {
    status,
    currentNode,
    error,
    config,
  });

  if (!run) {
    return NextResponse.json({ error: 'Failed to update run' }, { status: 500 });
  }

  return NextResponse.json({ run });
}

// DELETE /api/runs/:id - Delete a run
async function handleDelete(
  request: NextRequest,
  user: AuthenticatedUser,
  context: { params: Promise<Record<string, string>> }
) {
  const params = await context.params;
  const runId = params.id;
  if (!runId) {
    return NextResponse.json({ error: 'Run ID required' }, { status: 400 });
  }

  // Verify ownership first
  const existing = await runManager.getRun(runId);
  if (!existing) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 });
  }
  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const success = await runManager.deleteRun(runId);

  if (!success) {
    return NextResponse.json({ error: 'Failed to delete run' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export const GET = withAuth(handleGet);
export const PUT = withAuth(handlePut);
export const DELETE = withAuth(handleDelete);
