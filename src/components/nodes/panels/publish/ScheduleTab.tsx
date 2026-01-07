'use client';

import type { PublishNodeConfig } from '@/stores/nodeConfigStore';

interface Props {
  config: PublishNodeConfig;
  onChange: (updates: Partial<PublishNodeConfig>) => void;
}

const PUBLISH_MODES = [
  {
    id: 'immediate' as const,
    label: 'Immediately',
    description: 'Publish right after approval',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 2L11 13" />
        <path d="M22 2l-7 20-4-9-9-4 20-7z" />
      </svg>
    )
  },
  {
    id: 'scheduled' as const,
    label: 'Scheduled',
    description: 'Publish at a specific time',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    )
  },
  {
    id: 'premiere' as const,
    label: 'Premiere',
    description: 'Public countdown before release',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    )
  },
];

const COUNTDOWN_OPTIONS = [
  { value: 5, label: '5 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
];

export function ScheduleTab({ config, onChange }: Props) {
  const minDateTime = new Date().toISOString().slice(0, 16);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="schedule-tab">
      {/* Publish Mode */}
      <div className="panel-section">
        <div className="panel-section-title">When to Publish</div>
        <div className="radio-options">
          {PUBLISH_MODES.map((mode) => (
            <div
              key={mode.id}
              className={`radio-option accent-publish ${config.publishMode === mode.id ? 'selected' : ''}`}
              onClick={() => onChange({ publishMode: mode.id })}
            >
              <div className="radio-option-indicator" />
              <span className="radio-option-icon">{mode.icon}</span>
              <div className="radio-option-content">
                <div className="radio-option-label">{mode.label}</div>
                <div className="radio-option-description">{mode.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduled Time */}
      {config.publishMode === 'scheduled' && (
        <div className="panel-section">
          <div className="panel-section-title">Schedule For</div>
          <div className="panel-input-wrapper">
            <input
              type="datetime-local"
              className="panel-input"
              value={config.scheduledTime || ''}
              onChange={(e) => onChange({ scheduledTime: e.target.value })}
              min={minDateTime}
            />
            <span className="panel-input-hint">Timezone: {timezone}</span>
          </div>
        </div>
      )}

      {/* Premiere Settings */}
      {config.publishMode === 'premiere' && (
        <>
          <div className="panel-section">
            <div className="panel-section-title">Premiere Starts At</div>
            <div className="panel-input-wrapper">
              <input
                type="datetime-local"
                className="panel-input"
                value={config.scheduledTime || ''}
                onChange={(e) => onChange({ scheduledTime: e.target.value })}
                min={minDateTime}
              />
              <span className="panel-input-hint">Timezone: {timezone}</span>
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-section-title">Countdown Duration</div>
            <div className="panel-select-wrapper">
              <select
                className="panel-select"
                value={config.premiereCountdown}
                onChange={(e) => onChange({ premiereCountdown: parseInt(e.target.value) })}
              >
                {COUNTDOWN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="panel-input-hint">How long viewers can join before the premiere starts</span>
            </div>
          </div>
        </>
      )}

      {/* Summary */}
      {config.publishMode !== 'immediate' && config.scheduledTime && (
        <div className="schedule-summary">
          <div className="summary-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="summary-text">
            {config.publishMode === 'scheduled' ? 'Scheduled for' : 'Premiere starts'}{' '}
            <strong>
              {new Date(config.scheduledTime).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </strong>
          </div>
        </div>
      )}

      <style jsx>{`
        .schedule-tab {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .schedule-summary {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(255, 0, 0, 0.06);
          border: 1px solid rgba(255, 0, 0, 0.2);
          border-radius: var(--radius-md);
        }

        .summary-icon {
          color: var(--node-publish);
          flex-shrink: 0;
        }

        .summary-text {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .summary-text strong {
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}
