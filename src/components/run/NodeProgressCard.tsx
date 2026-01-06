'use client';

import { NodeId, NodeProgress } from '@/stores/runStore';

interface Props {
  node: NodeProgress;
}

const NODE_INFO: Record<NodeId, { label: string; icon: string; color: string; colorHex: string }> = {
  trigger: {
    label: 'Trigger',
    icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    color: 'var(--node-trigger)',
    colorHex: '#06b6d4',
  },
  script: {
    label: 'Script Generator',
    icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
    color: 'var(--node-script)',
    colorHex: '#a855f7',
  },
  voice: {
    label: 'Voice Synthesis',
    icon: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z',
    color: 'var(--node-voice)',
    colorHex: '#f59e0b',
  },
  thumbnail: {
    label: 'Thumbnail Creator',
    icon: 'M3 3h18v18H3z M6 6h3v3H6z M15 6h3v3h-3z M6 15h3v3H6z M15 15h3v3h-3z',
    color: 'var(--node-thumbnail)',
    colorHex: '#ec4899',
  },
  assembly: {
    label: 'Video Assembly',
    icon: 'M23 7l-7 5 7 5V7z M14 5H3v14h11V5z',
    color: 'var(--node-assembly)',
    colorHex: '#10b981',
  },
  publish: {
    label: 'YouTube Publish',
    icon: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12',
    color: 'var(--node-publish)',
    colorHex: '#ff0000',
  },
};

function formatDuration(durationMs?: number): string | null {
  if (!durationMs) return null;
  const seconds = Math.floor(durationMs / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatElapsedTime(startedAt?: string, completedAt?: string): string | null {
  if (!startedAt) return null;
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const seconds = Math.floor((end - start) / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'running':
      return 'Running';
    case 'intervention':
      return 'Needs Review';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'skipped':
      return 'Skipped';
    default:
      return status;
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'running':
      return 'var(--status-running)';
    case 'intervention':
      return 'var(--status-warning)';
    case 'completed':
      return 'var(--status-success)';
    case 'failed':
      return 'var(--status-error)';
    default:
      return 'var(--text-muted)';
  }
}

function getCardClasses(status: string): string {
  const base = 'bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 transition-all duration-300';
  const hover = 'hover:border-[var(--border-bright)]';

  switch (status) {
    case 'running':
      return `${base} ${hover} border-[var(--status-running)] shadow-[0_0_20px_rgba(59,130,246,0.1)]`;
    case 'intervention':
      return `${base} ${hover} border-[var(--status-warning)] shadow-[0_0_20px_rgba(234,179,8,0.1)]`;
    case 'failed':
      return `${base} ${hover} border-[var(--status-error)]`;
    case 'pending':
      return `${base} ${hover} opacity-60`;
    case 'skipped':
      return `${base} ${hover} opacity-40`;
    default:
      return `${base} ${hover}`;
  }
}

export function NodeProgressCard({ node }: Props) {
  const info = NODE_INFO[node.nodeId] || {
    label: node.nodeId,
    icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    color: 'var(--text-muted)',
    colorHex: '#71717a',
  };

  const duration = node.durationMs
    ? formatDuration(node.durationMs)
    : formatElapsedTime(node.startedAt, node.completedAt);

  const statusColor = getStatusColor(node.status);

  return (
    <div className={getCardClasses(node.status)}>
      {/* Header */}
      <div
        className="flex items-center gap-3 -ml-4 pl-3"
        style={{ borderLeft: `3px solid ${info.color}` }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: info.color }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
            <path d={info.icon} />
          </svg>
        </div>
        <div className="flex-1 flex flex-col gap-0.5">
          <span className="text-sm font-medium text-[var(--text-primary)]">{info.label}</span>
          <span className="text-xs" style={{ color: statusColor }}>
            {getStatusLabel(node.status)}
          </span>
        </div>
        <div className="w-6 h-6 flex items-center justify-center flex-shrink-0" style={{ color: statusColor }}>
          <StatusIcon status={node.status} />
        </div>
      </div>

      {/* Progress Bar */}
      {node.status === 'running' && (
        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${node.progress}%`,
                background: info.color,
              }}
            />
          </div>
          <span className="text-xs font-mono text-[var(--text-muted)] min-w-[36px] text-right">
            {node.progress}%
          </span>
        </div>
      )}

      {/* Duration */}
      {duration && (node.status === 'running' || node.status === 'completed') && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--text-muted)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>{duration}</span>
        </div>
      )}

      {/* Cost */}
      {node.costCents !== undefined && node.costCents > 0 && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--text-muted)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v12 M9 9h6 M9 15h6" />
          </svg>
          <span>${(node.costCents / 100).toFixed(2)}</span>
        </div>
      )}

      {/* Error Message */}
      {node.status === 'failed' && node.error && (
        <div className="mt-3 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-[var(--status-error)] leading-relaxed m-0">{node.error}</p>
        </div>
      )}

      {/* Output Preview */}
      {node.status === 'completed' && node.output !== undefined && node.output !== null ? (
        <div className="mt-3 pt-3 border-t border-[var(--border)]">
          {node.nodeId === 'script' && (
            <OutputPreview label="Script" value={getScriptPreview(node.output)} />
          )}
          {node.nodeId === 'voice' && (
            <OutputPreview label="Audio" value={getVoicePreview(node.output)} />
          )}
          {node.nodeId === 'thumbnail' && (
            <ThumbnailPreview output={node.output} />
          )}
          {node.nodeId === 'assembly' && (
            <OutputPreview label="Video" value={getAssemblyPreview(node.output)} />
          )}
          {node.nodeId === 'publish' && (
            <OutputPreview label="Published" value={getPublishPreview(node.output)} />
          )}
        </div>
      ) : null}
    </div>
  );
}

// Status Icon Component
function StatusIcon({ status }: { status: string }) {
  const className = status === 'running' ? 'w-[18px] h-[18px] animate-spin' : 'w-[18px] h-[18px]';

  switch (status) {
    case 'pending':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
    case 'running':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <circle cx="12" cy="12" r="10" strokeDasharray="31 31" />
        </svg>
      );
    case 'intervention':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case 'completed':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case 'failed':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      );
    case 'skipped':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <polygon points="5 4 15 12 5 20 5 4" />
          <line x1="19" y1="5" x2="19" y2="19" />
        </svg>
      );
    default:
      return null;
  }
}

// Helper components for output preview
function OutputPreview({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="text-[var(--text-secondary)] font-mono">{value}</span>
    </div>
  );
}

function ThumbnailPreview({ output }: { output: unknown }) {
  const thumbnailUrl = (output as { thumbnailUrl?: string })?.thumbnailUrl;
  if (!thumbnailUrl) return null;

  return (
    <div className="mt-2">
      <img
        src={thumbnailUrl}
        alt="Generated thumbnail"
        className="w-full h-auto rounded-lg aspect-video object-cover"
      />
    </div>
  );
}

// Helper functions to extract preview data from outputs
function getScriptPreview(output: unknown): string {
  const data = output as { wordCount?: number; title?: string };
  if (data?.wordCount) {
    return `${data.wordCount} words`;
  }
  return 'Generated';
}

function getVoicePreview(output: unknown): string {
  const data = output as { duration?: string; durationSeconds?: number };
  if (data?.duration) {
    return data.duration;
  }
  if (data?.durationSeconds) {
    const mins = Math.floor(data.durationSeconds / 60);
    const secs = Math.floor(data.durationSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  return 'Generated';
}

function getAssemblyPreview(output: unknown): string {
  const data = output as { resolution?: string; format?: string };
  if (data?.resolution && data?.format) {
    return `${data.resolution} ${data.format}`;
  }
  return 'Assembled';
}

function getPublishPreview(output: unknown): string {
  const data = output as { videoUrl?: string; videoId?: string };
  if (data?.videoId) {
    return data.videoId;
  }
  return 'Published';
}
