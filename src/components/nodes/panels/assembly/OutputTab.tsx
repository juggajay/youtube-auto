'use client';

import type { AssemblyNodeConfig } from '@/types/nodes/assembly';

interface Props {
  config: AssemblyNodeConfig;
  onChange: (updates: Partial<AssemblyNodeConfig>) => void;
}

const RESOLUTIONS = [
  { id: '720p', label: '720p', desc: '1280x720', badge: 'HD' },
  { id: '1080p', label: '1080p', desc: '1920x1080', badge: 'Full HD' },
  { id: '4k', label: '4K', desc: '3840x2160', badge: 'Ultra HD' },
] as const;

const FRAME_RATES = [
  { id: 24, label: '24 fps', desc: 'Cinematic' },
  { id: 30, label: '30 fps', desc: 'Standard' },
  { id: 60, label: '60 fps', desc: 'Smooth' },
] as const;

const FORMATS = [
  { value: 'mp4', label: 'MP4 (H.264)', desc: 'Best compatibility' },
  { value: 'mov', label: 'MOV (ProRes)', desc: 'Best quality' },
  { value: 'webm', label: 'WebM (VP9)', desc: 'Web optimized' },
] as const;

const QUALITY_PRESETS = [
  { id: 'draft', label: 'Draft', desc: 'Fast preview, lower quality', icon: '⚡' },
  { id: 'standard', label: 'Standard', desc: 'Balanced quality/speed', icon: '⚖️' },
  { id: 'high', label: 'High', desc: 'Best quality, slower', icon: '✨' },
] as const;

// Estimate file size based on settings
function estimateFileSize(config: AssemblyNodeConfig, durationMinutes: number = 10): string {
  const resolutionMultiplier = { '720p': 1, '1080p': 2.5, '4k': 8 };
  const qualityMultiplier = { draft: 0.5, standard: 1, high: 1.5 };
  const fpsMultiplier = config.frameRate / 30;
  const formatMultiplier = { mp4: 1, mov: 2, webm: 0.8 };

  const baseMBPerMinute = 50; // Base estimate for 1080p standard quality
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

  const baseMinutesPerMinute = 0.5; // Base estimate for 1080p standard
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
  return (
    <div className="output-tab">
      <h4 className="tab-title">Output Settings</h4>
      <p className="tab-hint">Configure the final video output</p>

      {/* Resolution */}
      <div className="form-group">
        <label className="form-label">Resolution</label>
        <div className="resolution-options">
          {RESOLUTIONS.map((res) => (
            <button
              key={res.id}
              className={`resolution-btn ${config.resolution === res.id ? 'selected' : ''}`}
              onClick={() => onChange({ resolution: res.id as AssemblyNodeConfig['resolution'] })}
            >
              <span className="res-badge">{res.badge}</span>
              <span className="res-label">{res.label}</span>
              <span className="res-desc">{res.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Frame Rate */}
      <div className="form-group">
        <label className="form-label">Frame Rate</label>
        <div className="fps-options">
          {FRAME_RATES.map((fps) => (
            <button
              key={fps.id}
              className={`fps-btn ${config.frameRate === fps.id ? 'selected' : ''}`}
              onClick={() => onChange({ frameRate: fps.id as AssemblyNodeConfig['frameRate'] })}
            >
              <span className="fps-label">{fps.label}</span>
              <span className="fps-desc">{fps.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Format */}
      <div className="form-group">
        <label className="form-label">Format</label>
        <div className="format-options">
          {FORMATS.map((format) => (
            <label key={format.value} className="format-option">
              <input
                type="radio"
                name="format"
                checked={config.format === format.value}
                onChange={() => onChange({ format: format.value as AssemblyNodeConfig['format'] })}
              />
              <div className="format-content">
                <span className="format-label">{format.label}</span>
                <span className="format-desc">{format.desc}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Quality */}
      <div className="form-group">
        <label className="form-label">Quality Preset</label>
        <div className="quality-options">
          {QUALITY_PRESETS.map((q) => (
            <button
              key={q.id}
              className={`quality-btn ${config.quality === q.id ? 'selected' : ''}`}
              onClick={() => onChange({ quality: q.id as AssemblyNodeConfig['quality'] })}
            >
              <span className="quality-icon">{q.icon}</span>
              <span className="quality-label">{q.label}</span>
              <span className="quality-desc">{q.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Estimates */}
      <div className="output-estimates">
        <h5 className="estimates-title">Estimates (for 10 min video)</h5>
        <div className="estimates-grid">
          <div className="estimate-item">
            <span className="estimate-label">File Size</span>
            <span className="estimate-value">{estimateFileSize(config)}</span>
          </div>
          <div className="estimate-item">
            <span className="estimate-label">Render Time</span>
            <span className="estimate-value">{estimateRenderTime(config)}</span>
          </div>
        </div>
        <p className="estimates-hint">
          Actual results may vary based on video content and system resources
        </p>
      </div>

      {/* YouTube Recommendation */}
      {config.resolution === '1080p' && config.frameRate === 30 && config.format === 'mp4' && (
        <div className="recommendation-badge">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          <span>Recommended settings for YouTube</span>
        </div>
      )}
    </div>
  );
}
