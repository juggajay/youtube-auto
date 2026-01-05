import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/auth/middleware';
import { runManager } from '@/lib/runs';

// GET /api/workflows/:id - Get a specific workflow
async function handleGet(
  request: NextRequest,
  user: AuthenticatedUser,
  context: { params: Promise<Record<string, string>> }
) {
  const params = await context.params;
  const workflowId = params.id;
  if (!workflowId) {
    return NextResponse.json({ error: 'Workflow ID required' }, { status: 400 });
  }

  const workflow = await runManager.getWorkflow(workflowId);

  if (!workflow) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
  }

  // Verify ownership
  if (workflow.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ workflow });
}

// PUT /api/workflows/:id - Update a workflow
async function handlePut(
  request: NextRequest,
  user: AuthenticatedUser,
  context: { params: Promise<Record<string, string>> }
) {
  const params = await context.params;
  const workflowId = params.id;
  if (!workflowId) {
    return NextResponse.json({ error: 'Workflow ID required' }, { status: 400 });
  }

  // Verify ownership first
  const existing = await runManager.getWorkflow(workflowId);
  if (!existing) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
  }
  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { name, description, nodes, edges, config } = body;

  const workflow = await runManager.updateWorkflow(workflowId, {
    name,
    description,
    nodes,
    edges,
    config,
  });

  if (!workflow) {
    return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 });
  }

  return NextResponse.json({ workflow });
}

// DELETE /api/workflows/:id - Delete a workflow
async function handleDelete(
  request: NextRequest,
  user: AuthenticatedUser,
  context: { params: Promise<Record<string, string>> }
) {
  const params = await context.params;
  const workflowId = params.id;
  if (!workflowId) {
    return NextResponse.json({ error: 'Workflow ID required' }, { status: 400 });
  }

  // Verify ownership first
  const existing = await runManager.getWorkflow(workflowId);
  if (!existing) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
  }
  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const success = await runManager.deleteWorkflow(workflowId);

  if (!success) {
    return NextResponse.json({ error: 'Failed to delete workflow' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export const GET = withAuth(handleGet);
export const PUT = withAuth(handlePut);
export const DELETE = withAuth(handleDelete);
