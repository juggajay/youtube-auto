'use client';

import { NodeId, NodeProgress, NodeStatus } from '@/stores/runStore';

interface Props {
  nodeProgress: Record<NodeId, NodeProgress>;
}

const PIPELINE_ORDER: NodeId[] = ['trigger', 'script', 'voice', 'thumbnail', 'assembly', 'publish'];

const NODE_LABELS: Record<NodeId, string> = {
  trigger: 'Trigger',
  script: 'Script',
  voice: 'Voice',
  thumbnail: 'Thumbnail',
  assembly: 'Assembly',
  publish: 'Publish',
};

const NODE_ICONS: Record<NodeId, string> = {
  trigger: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  script: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
  voice: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z',
  thumbnail: 'M3 3h18v18H3z M6 6h3v3H6z M15 6h3v3h-3z M6 15h3v3H6z M15 15h3v3h-3z',
  assembly: 'M23 7l-7 5 7 5V7z M14 5H3v14h11V5z',
  publish: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12',
};

const NODE_COLORS: Record<NodeId, string> = {
  trigger: 'var(--node-trigger)',
  script: 'var(--node-script)',
  voice: 'var(--node-voice)',
  thumbnail: 'var(--node-thumbnail)',
  assembly: 'var(--node-assembly)',
  publish: 'var(--node-publish)',
};

function getStatusBadge(status: NodeStatus): { icon: string; bgClass: string; textClass: string } {
  switch (status) {
    case 'completed':
      return {
        icon: '\\u2713',
        bgClass: 'bg-[var(--status-success)]',
        textClass: 'text-white',
      };
    case 'running':
      return {
        icon: '\\u25D0',
        bgClass: 'bg-[var(--status-running)] animate-pulse',
        textClass: 'text-white',
      };
    case 'intervention':
      return {
        icon: '!',
        bgClass: 'bg-[var(--status-warning)]',
        textClass: 'text-zinc-900',
      };
    case 'failed':
      return {
        icon: '\\u2717',
        bgClass: 'bg-[var(--status-error)]',
        textClass: 'text-white',
      };
    case 'skipped':
      return {
        icon: '\\u2212',
        bgClass: 'bg-[var(--bg-elevated)]',
        textClass: 'text-[var(--text-muted)]',
      };
    default:
      return {
        icon: '\\u25CB',
        bgClass: 'bg-[var(--bg-elevated)]',
        textClass: 'text-[var(--text-muted)]',
      };
  }
}

export function PipelineProgress({ nodeProgress }: Props) {
  return (
    <div className="py-6 px-6 bg-[var(--bg-surface)] border-b border-[var(--border)]">
      <div className="flex items-start justify-center gap-0 max-w-[900px] mx-auto">
        {PIPELINE_ORDER.map((nodeId, index) => {
          const node = nodeProgress[nodeId];
          const status = node?.status || 'pending';
          const progress = node?.progress || 0;
          const isLast = index === PIPELINE_ORDER.length - 1;
          const badge = getStatusBadge(status);

          return (
            <div key={nodeId} className="flex flex-col items-center relative flex-1 max-w-[140px]">
              {/* Node */}
              <div className="relative w-12 h-12 flex items-center justify-center">
                {/* Progress Ring for Running State */}
                {status === 'running' && (
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 48 48">
                    <circle
                      cx="24"
                      cy="24"
                      r="22"
                      fill="none"
                      stroke="var(--border)"
                      strokeWidth="2"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="22"
                      fill="none"
                      stroke={NODE_COLORS[nodeId]}
                      strokeWidth="2"
                      strokeDasharray={`${progress * 1.38} 138`}
                      strokeLinecap="round"
                      transform="rotate(-90 24 24)"
                      className="transition-all duration-300"
                    />
                  </svg>
                )}

                {/* Node Icon */}
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    status === 'pending' ? 'opacity-40' : status === 'skipped' ? 'opacity-30' : ''
                  } ${status === 'running' ? 'animate-pulse' : ''}`}
                  style={{ background: NODE_COLORS[nodeId] }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                    <path d={NODE_ICONS[nodeId]} />
                  </svg>
                </div>

                {/* Status Badge */}
                <div
                  className={`absolute -bottom-1 -right-1 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-semibold border-2 border-[var(--bg-surface)] ${badge.bgClass} ${badge.textClass}`}
                >
                  {status === 'completed' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-2.5 h-2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {status === 'running' && (
                    <div className="w-2 h-2 rounded-full bg-current animate-ping" />
                  )}
                  {status === 'intervention' && '!'}
                  {status === 'failed' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-2.5 h-2.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  )}
                  {status === 'skipped' && '-'}
                  {status === 'pending' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-2.5 h-2.5">
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Label */}
              <span className="mt-2 text-xs font-medium text-[var(--text-secondary)]">
                {NODE_LABELS[nodeId]}
              </span>

              {/* Progress Text */}
              {status === 'running' && (
                <span className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">
                  {progress}%
                </span>
              )}

              {/* Connector Line */}
              {!isLast && (
                <div className="absolute top-6 left-[calc(50%+24px)] right-[calc(-50%+24px)] h-0.5 bg-[var(--border)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--status-success)] transition-all duration-300"
                    style={{
                      width: status === 'completed' ? '100%' : status === 'running' ? `${progress}%` : '0%',
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
