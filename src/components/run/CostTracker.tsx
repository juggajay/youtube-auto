'use client';

import { CostBreakdown } from '@/stores/runStore';

interface Props {
  estimatedCost: CostBreakdown;
  actualCost: CostBreakdown;
  showBreakdown?: boolean;
}

const NODE_LABELS: Record<keyof Omit<CostBreakdown, 'total'>, string> = {
  script: 'Script',
  voice: 'Voice',
  thumbnail: 'Thumbnail',
  assembly: 'Assembly',
  publish: 'Publish',
};

const NODE_COLORS: Record<keyof Omit<CostBreakdown, 'total'>, string> = {
  script: 'var(--node-script)',
  voice: 'var(--node-voice)',
  thumbnail: 'var(--node-thumbnail)',
  assembly: 'var(--node-assembly)',
  publish: 'var(--node-publish)',
};

function formatCost(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function CostTracker({
  estimatedCost,
  actualCost,
  showBreakdown = true,
}: Props) {
  const progressPercent = estimatedCost.total > 0
    ? Math.min((actualCost.total / estimatedCost.total) * 100, 100)
    : 0;

  const isOverBudget = actualCost.total > estimatedCost.total;

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-[var(--text-primary)] m-0 flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[var(--text-muted)]">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v12 M9 9h6 M9 15h6" />
          </svg>
          Cost
        </h4>
        <div className={`w-5 h-5 flex items-center justify-center ${isOverBudget ? 'text-[var(--status-warning)]' : 'text-[var(--status-success)]'}`}>
          {isOverBudget ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      </div>

      {/* Cost Display */}
      <div className="mb-3">
        <div className="flex items-center justify-center gap-3">
          <div className="flex flex-col items-center">
            <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Current</span>
            <span className={`text-xl font-semibold font-mono ${isOverBudget ? 'text-[var(--status-warning)]' : 'text-[var(--text-primary)]'}`}>
              {formatCost(actualCost.total)}
            </span>
          </div>
          <span className="text-lg text-[var(--text-muted)] mt-3">/</span>
          <div className="flex flex-col items-center">
            <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Estimated</span>
            <span className="text-xl font-semibold font-mono text-[var(--text-primary)]">
              {formatCost(estimatedCost.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isOverBudget ? 'bg-[var(--status-warning)]' : 'bg-[var(--status-success)]'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Breakdown */}
      {showBreakdown && (
        <div className="flex flex-col gap-2.5 pt-3 border-t border-[var(--border)]">
          {(Object.keys(NODE_LABELS) as Array<keyof Omit<CostBreakdown, 'total'>>).map((key) => {
            const estimated = estimatedCost[key];
            const actual = actualCost[key];
            if (estimated === 0 && actual === 0) return null;

            const nodeProgress = estimated > 0 ? (actual / estimated) * 100 : 0;
            const nodeOver = actual > estimated;

            return (
              <div key={key} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: NODE_COLORS[key] }}
                  />
                  <span className="text-xs text-[var(--text-secondary)] flex-1">
                    {NODE_LABELS[key]}
                  </span>
                  <span className={`text-xs font-mono ${nodeOver ? 'text-[var(--status-warning)]' : 'text-[var(--text-primary)]'}`}>
                    {formatCost(actual)}
                    {estimated > 0 && (
                      <span className="text-[var(--text-muted)]"> / {formatCost(estimated)}</span>
                    )}
                  </span>
                </div>
                {estimated > 0 && (
                  <div className="h-[3px] bg-[var(--bg-elevated)] rounded-full overflow-hidden ml-4">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${nodeOver ? 'opacity-80' : ''}`}
                      style={{
                        width: `${Math.min(nodeProgress, 100)}%`,
                        background: NODE_COLORS[key],
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
