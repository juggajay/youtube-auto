'use client';

import type { AssemblyNodeConfig } from '@/types/nodes/assembly';

interface Props {
  config: AssemblyNodeConfig;
  onChange: (updates: Partial<AssemblyNodeConfig>) => void;
}

const RESOLUTIONS = [
  { id: '720p', label: '720p', desc: 'HD' },
  { id: '1080p', label: '1080p', desc: 'Full HD' },
  { id: '4k', label: '4K', desc: 'Ultra HD' },
] as const;

const FRAME_RATES = [
  { id: 24, label: '24 fps' },
  { id: 30, label: '30 fps' },
  { id: 60, label: '60 fps' },
] as const;

const FORMATS = [
  { value: 'mp4', label: 'MP4 (H.264)', desc: 'Best compatibility' },
  { value: 'mov', label: 'MOV (ProRes)', desc: 'Best quality' },
  { value: 'webm', label: 'WebM (VP9)', desc: 'Web optimized' },
] as const;

const QUALITY_PRESETS = [
  { id: 'draft', label: 'Draft' },
  { id: 'standard', label: 'Standard' },
  { id: 'high', label: 'High' },
] as const;

// Estimate file size based on settings
function estimateFileSize(config: AssemblyNodeConfig, durationMinutes: number = 10): string {
  const resolutionMultiplier = { '720p': 1, '1080p': 2.5, '4k': 8 };
  const qualityMultiplier = { draft: 0.5, standard: 1, high: 1.5 };
  const fpsMultiplier = config.frameRate / 30;
  const formatMultiplier = { mp4: 1, mov: 2, webm: 0.8 };

  const baseMBPerMinute = 50;
  const estimatedMB =
    baseMBPerMinute *
    durationMinutes *
    (resolutionMultiplier[config.resolution] / 2.5) *
    qualityMultiplier[config.quality] *
    fpsMultiplier *
    formatMultiplier[config.format];

  if (estimatedMB >= 1000) {
    return `~${(estimatedMB / 1000).toFixed(1)} GB`;
  }
  return `~${Math.round(estimatedMB)} MB`;
}

// Estimate render time based on settings
function estimateRenderTime(config: AssemblyNodeConfig, durationMinutes: number = 10): string {
  const resolutionMultiplier = { '720p': 1, '1080p': 2, '4k': 6 };
  const qualityMultiplier = { draft: 0.5, standard: 1, high: 2 };
  const fpsMultiplier = config.frameRate / 30;

  const baseMinutesPerMinute = 0.5;
  const estimatedMinutes =
    baseMinutesPerMinute *
    durationMinutes *
    resolutionMultiplier[config.resolution] *
    qualityMultiplier[config.quality] *
    fpsMultiplier;

  if (estimatedMinutes >= 60) {
    return `~${(estimatedMinutes / 60).toFixed(1)} hours`;
  }
  if (estimatedMinutes >= 1) {
    return `~${Math.round(estimatedMinutes)} minutes`;
  }
  return `~${Math.round(estimatedMinutes * 60)} seconds`;
}

export function OutputTab({ config, onChange }: Props) {
  const isRecommended = config.resolution === '1080p' && config.frameRate === 30 && config.format === 'mp4';

  return (
    <div className="refined-panel">
      {/* Resolution */}
      <div className="panel-section">
        <div className="panel-section-title">Resolution</div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {RESOLUTIONS.map((res) => (
            <button
              key={res.id}
              className={`panel-btn ${config.resolution === res.id ? 'panel-btn-primary' : 'panel-btn-secondary'}`}
              style={{
                flex: 1,
                flexDirection: 'column',
                padding: '12px 8px',
                gap: '2px',
                background: config.resolution === res.id ? 'var(--node-assembly)' : undefined,
              }}
              onClick={() => onChange({ resolution: res.id as AssemblyNodeConfig['resolution'] })}
            >
              <span style={{ fontWeight: 600, fontSize: '14px' }}>{res.label}</span>
              <span style={{ fontSize: '10px', opacity: 0.7 }}>{res.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Frame Rate */}
      <div className="panel-section">
        <div className="panel-section-title">Frame Rate</div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {FRAME_RATES.map((fps) => (
            <button
              key={fps.id}
              className={`panel-btn panel-btn-sm ${config.frameRate === fps.id ? 'panel-btn-primary' : 'panel-btn-secondary'}`}
              style={{
                flex: 1,
                background: config.frameRate === fps.id ? 'var(--node-assembly)' : undefined,
              }}
              onClick={() => onChange({ frameRate: fps.id as AssemblyNodeConfig['frameRate'] })}
            >
              {fps.label}
            </button>
          ))}
        </div>
      </div>

      {/* Format */}
      <div className="panel-section">
        <div className="panel-section-title">Format</div>
        <select
          className="panel-select"
          value={config.format}
          onChange={(e) => onChange({ format: e.target.value as AssemblyNodeConfig['format'] })}
        >
          {FORMATS.map((format) => (
            <option key={format.value} value={format.value}>
              {format.label} - {format.desc}
            </option>
          ))}
        </select>
      </div>

      {/* Quality */}
      <div className="panel-section">
        <div className="panel-section-title">Quality Preset</div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {QUALITY_PRESETS.map((q) => (
            <button
              key={q.id}
              className={`panel-btn panel-btn-sm ${config.quality === q.id ? 'panel-btn-primary' : 'panel-btn-secondary'}`}
              style={{
                flex: 1,
                background: config.quality === q.id ? 'var(--node-assembly)' : undefined,
              }}
              onClick={() => onChange({ quality: q.id as AssemblyNodeConfig['quality'] })}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Estimates */}
      <div className="panel-section">
        <div className="panel-section-title">Estimates (10 min video)</div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
        }}>
          <div style={{
            padding: '14px 16px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>File Size</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {estimateFileSize(config)}
            </div>
          </div>
          <div style={{
            padding: '14px 16px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Render Time</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {estimateRenderTime(config)}
            </div>
          </div>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
          Actual results may vary based on video content and system resources
        </p>
      </div>

      {/* YouTube Recommendation */}
      {isRecommended && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: 'var(--radius-md)',
        }}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style={{ color: '#10b981', flexShrink: 0 }}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          <span style={{ fontSize: '13px', color: '#10b981' }}>
            Recommended settings for YouTube
          </span>
        </div>
      )}
    </div>
  );
}
