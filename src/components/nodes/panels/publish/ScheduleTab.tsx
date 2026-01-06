'use client';

import type { PublishPanelConfig } from '@/types/nodes/publish';

interface Props {
  config: PublishPanelConfig;
  onChange: (updates: Partial<PublishPanelConfig>) => void;
}

export function ScheduleTab({ config, onChange }: Props) {
  return (
    <div className="schedule-tab">
      <h4>Publish Schedule</h4>

      {/* Publish Mode */}
      <div className="form-group">
        <label>When to publish</label>
        <div className="mode-options">
          {[
            { id: 'immediate', label: 'Immediately', desc: 'Publish right after approval', icon: 'rocket' },
            { id: 'scheduled', label: 'Scheduled', desc: 'Publish at specific time', icon: 'calendar' },
            { id: 'premiere', label: 'Premiere', desc: 'Public countdown before release', icon: 'film' },
          ].map((mode) => (
            <button
              key={mode.id}
              className={`mode-btn ${config.publishMode === mode.id ? 'selected' : ''}`}
              onClick={() => onChange({ publishMode: mode.id as PublishPanelConfig['publishMode'] })}
            >
              <span className="mode-icon">{mode.icon}</span>
              <span className="mode-label">{mode.label}</span>
              <span className="mode-desc">{mode.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scheduled Time */}
      {config.publishMode === 'scheduled' && (
        <div className="form-group">
          <label>Schedule for</label>
          <input
            type="datetime-local"
            value={config.scheduledTime || ''}
            onChange={(e) => onChange({ scheduledTime: e.target.value })}
            min={new Date().toISOString().slice(0, 16)}
          />
          <p className="hint">Your timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
        </div>
      )}

      {/* Premiere Countdown */}
      {config.publishMode === 'premiere' && (
        <>
          <div className="form-group">
            <label>Premiere starts at</label>
            <input
              type="datetime-local"
              value={config.scheduledTime || ''}
              onChange={(e) => onChange({ scheduledTime: e.target.value })}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <div className="form-group">
            <label>Countdown duration (minutes)</label>
            <select
              value={config.premiereCountdown}
              onChange={(e) => onChange({ premiereCountdown: parseInt(e.target.value) })}
            >
              <option value={5}>5 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
            </select>
            <p className="hint">How long viewers can join before the premiere starts</p>
          </div>
        </>
      )}
    </div>
  );
}
