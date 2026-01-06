import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/db/server';
import { runManager } from '@/lib/runs';

/**
 * SSE event types for run progress streaming
 */
type SSEEventType =
  | 'progress'
  | 'node_start'
  | 'node_complete'
  | 'node_error'
  | 'log'
  | 'intervention'
  | 'cost_update'
  | 'complete'
  | 'error';

interface SSEEvent {
  type: SSEEventType;
  [key: string]: unknown;
}

/**
 * Format an SSE message
 */
function formatSSE(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Create an SSE response with proper headers
 */
function createSSEResponse(stream: ReadableStream): Response {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

/**
 * GET /api/runs/[id]/stream
 *
 * Server-Sent Events endpoint for real-time run progress updates.
 *
 * Events emitted:
 * - progress: { nodeId, percent } - Node execution progress
 * - node_start: { nodeId } - Node started executing
 * - node_complete: { nodeId, output } - Node finished successfully
 * - node_error: { nodeId, error } - Node failed
 * - log: { level, message, nodeId? } - Activity log entry
 * - intervention: { interventionId, nodeType, content } - User intervention required
 * - cost_update: { totalCents } - Running cost updated
 * - complete: {} - Run completed successfully
 * - error: { error } - Run failed
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  const params = await context.params;
  const runId = params.id;

  if (!runId) {
    return new Response(JSON.stringify({ error: 'Run ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Authenticate user
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get the run and verify ownership
  const run = await runManager.getRun(runId);

  if (!run) {
    return new Response(JSON.stringify({ error: 'Run not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (run.user_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check if run is already completed
  if (['completed', 'failed', 'cancelled'].includes(run.status)) {
    // Return current state as a single event and close
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        if (run.status === 'completed') {
          controller.enqueue(encoder.encode(formatSSE({ type: 'complete' })));
        } else {
          controller.enqueue(encoder.encode(formatSSE({
            type: 'error',
            error: run.error || `Run ${run.status}`,
          })));
        }

        controller.close();
      },
    });

    return createSSEResponse(stream);
  }

  // Create the SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let isActive = true;
      let lastStatus: string = run.status;
      let lastCurrentNode: string | null = run.current_node;

      // Send initial state
      controller.enqueue(encoder.encode(formatSSE({
        type: 'log',
        level: 'info',
        message: `Connected to run stream (status: ${run.status})`,
      })));

      // If run is in progress, send current node status
      if (run.current_node) {
        controller.enqueue(encoder.encode(formatSSE({
          type: 'node_start',
          nodeId: run.current_node,
        })));
      }

      // Poll for updates (in production, this would use Supabase realtime or a message queue)
      const pollInterval = setInterval(async () => {
        if (!isActive) {
          clearInterval(pollInterval);
          return;
        }

        try {
          const currentRun = await runManager.getRun(runId);

          if (!currentRun) {
            controller.enqueue(encoder.encode(formatSSE({
              type: 'error',
              error: 'Run not found',
            })));
            clearInterval(pollInterval);
            controller.close();
            return;
          }

          // Check for node changes
          if (currentRun.current_node !== lastCurrentNode) {
            // Previous node completed
            if (lastCurrentNode) {
              const previousOutput = await runManager.getLatestNodeOutput(runId, lastCurrentNode);
              if (previousOutput) {
                if (previousOutput.status === 'completed') {
                  controller.enqueue(encoder.encode(formatSSE({
                    type: 'node_complete',
                    nodeId: lastCurrentNode,
                    output: previousOutput.output || {},
                  })));
                } else if (previousOutput.status === 'failed') {
                  controller.enqueue(encoder.encode(formatSSE({
                    type: 'node_error',
                    nodeId: lastCurrentNode,
                    error: previousOutput.error || 'Unknown error',
                  })));
                }
              }
            }

            // New node started
            if (currentRun.current_node) {
              controller.enqueue(encoder.encode(formatSSE({
                type: 'node_start',
                nodeId: currentRun.current_node,
              })));
            }

            lastCurrentNode = currentRun.current_node;
          }

          // Check for status changes
          if (currentRun.status !== lastStatus) {
            lastStatus = currentRun.status;

            if (currentRun.status === 'completed') {
              // Get total cost
              const outputs = await runManager.getNodeOutputs(runId);
              const totalCost = outputs.reduce((sum, o) => sum + (o.cost_cents || 0), 0);

              controller.enqueue(encoder.encode(formatSSE({
                type: 'cost_update',
                totalCents: totalCost,
              })));

              controller.enqueue(encoder.encode(formatSSE({ type: 'complete' })));
              clearInterval(pollInterval);
              controller.close();
              isActive = false;
              return;
            }

            if (currentRun.status === 'failed' || currentRun.status === 'cancelled') {
              controller.enqueue(encoder.encode(formatSSE({
                type: 'error',
                error: currentRun.error || `Run ${currentRun.status}`,
              })));
              clearInterval(pollInterval);
              controller.close();
              isActive = false;
              return;
            }

            if (currentRun.status === 'paused') {
              // Check for intervention
              controller.enqueue(encoder.encode(formatSSE({
                type: 'log',
                level: 'info',
                message: 'Run paused - intervention may be required',
              })));
            }
          }

          // Get current node progress if running
          if (currentRun.current_node && currentRun.status === 'running') {
            const currentOutput = await runManager.getLatestNodeOutput(runId, currentRun.current_node);
            if (currentOutput?.output && typeof (currentOutput.output as Record<string, unknown>).progress === 'number') {
              controller.enqueue(encoder.encode(formatSSE({
                type: 'progress',
                nodeId: currentRun.current_node,
                percent: (currentOutput.output as Record<string, unknown>).progress,
              })));
            }
          }

        } catch (pollError) {
          console.error('SSE poll error:', pollError);
          controller.enqueue(encoder.encode(formatSSE({
            type: 'log',
            level: 'error',
            message: 'Error polling run status',
          })));
        }
      }, 1000); // Poll every second

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        isActive = false;
        clearInterval(pollInterval);
        controller.close();
      });
    },
  });

  return createSSEResponse(stream);
}
