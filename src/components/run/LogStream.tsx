'use client';

import { useEffect, useRef, useState } from 'react';
import { LogEntry, LogLevel, NodeId } from '@/stores/runStore';

interface Props {
  logs: LogEntry[];
  maxHeight?: number;
  showNodeFilter?: boolean;
  showLevelFilter?: boolean;
}

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: 'var(--text-muted)',
  info: 'var(--status-running)',
  warn: 'var(--status-warning)',
  error: 'var(--status-error)',
};

const NODE_COLORS: Record<NodeId, string> = {
  trigger: 'var(--node-trigger)',
  script: 'var(--node-script)',
  voice: 'var(--node-voice)',
  thumbnail: 'var(--node-thumbnail)',
  assembly: 'var(--node-assembly)',
  publish: 'var(--node-publish)',
};

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function LogStream({
  logs,
  maxHeight = 300,
  showNodeFilter = false,
  showLevelFilter = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [nodeFilter, setNodeFilter] = useState<NodeId | 'all'>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (levelFilter !== 'all' && log.level !== levelFilter) return false;
    if (nodeFilter !== 'all' && log.nodeId !== nodeFilter) return false;
    return true;
  });

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (containerRef.current && autoScroll) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  // Detect manual scroll
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  // Get unique nodes for filter
  const uniqueNodes = Array.from(
    new Set(logs.filter((log) => log.nodeId).map((log) => log.nodeId as NodeId))
  );

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
        <h4 className="text-sm font-semibold text-[var(--text-primary)] m-0">Activity Log</h4>
        <div className="flex items-center gap-2">
          {filteredLogs.length > 0 && (
            <span className="text-xs text-[var(--text-muted)] font-mono">{filteredLogs.length} entries</span>
          )}
          <button
            className={`w-7 h-7 flex items-center justify-center bg-transparent border-none rounded cursor-pointer transition-all ${
              autoScroll ? 'text-[var(--status-running)]' : 'text-[var(--text-muted)]'
            } hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]`}
            onClick={() => {
              setAutoScroll(true);
              if (containerRef.current) {
                containerRef.current.scrollTop = containerRef.current.scrollHeight;
              }
            }}
            title={autoScroll ? 'Auto-scroll enabled' : 'Click to enable auto-scroll'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <button
            className="w-7 h-7 flex items-center justify-center bg-transparent border-none rounded text-[var(--text-muted)] cursor-pointer transition-all hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              {isExpanded ? (
                <path d="M8 3v3a2 2 0 0 1-2 2H3 M21 8h-3a2 2 0 0 1-2-2V3 M3 16h3a2 2 0 0 1 2 2v3 M16 21v-3a2 2 0 0 1 2-2h3" />
              ) : (
                <path d="M8 3H5a2 2 0 0 0-2 2v3 M21 8V5a2 2 0 0 0-2-2h-3 M3 16v3a2 2 0 0 0 2 2h3 M16 21h3a2 2 0 0 0 2-2v-3" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Filters */}
      {(showLevelFilter || showNodeFilter) && (
        <div className="flex gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-surface)]">
          {showLevelFilter && (
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as LogLevel | 'all')}
              className="px-2.5 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded text-[var(--text-secondary)] text-xs cursor-pointer focus:outline-none focus:border-[var(--border-bright)]"
            >
              <option value="all">All levels</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </select>
          )}
          {showNodeFilter && uniqueNodes.length > 0 && (
            <select
              value={nodeFilter}
              onChange={(e) => setNodeFilter(e.target.value as NodeId | 'all')}
              className="px-2.5 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded text-[var(--text-secondary)] text-xs cursor-pointer focus:outline-none focus:border-[var(--border-bright)]"
            >
              <option value="all">All nodes</option>
              {uniqueNodes.map((node) => (
                <option key={node} value={node}>
                  {node}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Log Container */}
      <div
        className="overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent transition-all duration-300"
        ref={containerRef}
        onScroll={handleScroll}
        style={{ maxHeight: isExpanded ? '500px' : `${maxHeight}px` }}
      >
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-[var(--text-muted)] gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 opacity-50">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span className="text-xs">No log entries yet</span>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`flex items-start gap-2 px-4 py-1.5 font-mono text-xs leading-relaxed transition-colors hover:bg-[var(--bg-hover)] ${
                log.level === 'error' ? 'bg-red-500/5' : log.level === 'warn' ? 'bg-amber-500/5' : ''
              }`}
            >
              <span className="text-[var(--text-muted)] flex-shrink-0 min-w-[65px]">
                {formatTime(log.timestamp)}
              </span>
              <span
                className="flex-shrink-0 w-4 h-4 flex items-center justify-center"
                style={{ color: LEVEL_COLORS[log.level] }}
                title={log.level}
              >
                <LevelIcon level={log.level} />
              </span>
              {log.nodeId && (
                <span
                  className="flex-shrink-0 font-medium"
                  style={{ color: NODE_COLORS[log.nodeId] }}
                >
                  [{log.nodeId}]
                </span>
              )}
              <span
                className={`break-words ${
                  log.level === 'error'
                    ? 'text-[var(--status-error)]'
                    : log.level === 'warn'
                    ? 'text-[var(--status-warning)]'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Level Icon Component
function LevelIcon({ level }: { level: LogLevel }) {
  switch (level) {
    case 'debug':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
          <path d="M12 2v4 M12 18v4 M4.93 4.93l2.83 2.83 M16.24 16.24l2.83 2.83 M2 12h4 M18 12h4 M4.93 19.07l2.83-2.83 M16.24 7.76l2.83-2.83" />
        </svg>
      );
    case 'info':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
    case 'warn':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case 'error':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
    default:
      return null;
  }
}
