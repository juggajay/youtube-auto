'use client';

export interface ToneValues {
  casualProfessional: number;
  humorLevel: number;
  energyLevel: number;
  educationalEntertainment: number;
}

interface Props {
  values: ToneValues;
  onChange: (values: ToneValues) => void;
}

const TONE_CONFIGS = [
  {
    key: 'casualProfessional',
    label: 'Tone',
    leftLabel: 'Casual',
    rightLabel: 'Professional',
    leftDesc: 'Conversational, friendly, like talking to a friend',
    rightDesc: 'Polished, authoritative, expert voice',
  },
  {
    key: 'humorLevel',
    label: 'Humor',
    leftLabel: 'Serious',
    rightLabel: 'Playful',
    leftDesc: 'Straightforward, no jokes',
    rightDesc: 'Witty, uses humor and memes',
  },
  {
    key: 'energyLevel',
    label: 'Energy',
    leftLabel: 'Calm',
    rightLabel: 'High Energy',
    leftDesc: 'Relaxed pace, thoughtful',
    rightDesc: 'Fast-paced, enthusiastic, excited',
  },
  {
    key: 'educationalEntertainment',
    label: 'Focus',
    leftLabel: 'Educational',
    rightLabel: 'Entertainment',
    leftDesc: 'Teaching, explaining, informing',
    rightDesc: 'Engaging, storytelling, captivating',
  },
] as const;

export function ToneSliders({ values, onChange }: Props) {
  const handleChange = (key: keyof ToneValues, value: number) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="tone-sliders">
      <h3>Voice & Tone</h3>
      <p className="hint">Set the personality dimensions for your channel's voice</p>

      {TONE_CONFIGS.map((config) => (
        <div key={config.key} className="tone-slider-row">
          <div className="slider-labels">
            <span className="label-left">
              <strong>{config.leftLabel}</strong>
              <small>{config.leftDesc}</small>
            </span>
            <span className="label-right">
              <strong>{config.rightLabel}</strong>
              <small>{config.rightDesc}</small>
            </span>
          </div>
          <div className="slider-container">
            <input
              type="range"
              min={0}
              max={100}
              value={values[config.key]}
              onChange={(e) => handleChange(config.key, parseInt(e.target.value))}
              className="tone-slider"
            />
            <div className="slider-track">
              <div
                className="slider-fill"
                style={{ width: `${values[config.key]}%` }}
              />
            </div>
          </div>
          <div className="slider-value">{values[config.key]}%</div>
        </div>
      ))}

      <style jsx>{`
        .tone-sliders {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .tone-sliders h3 {
          margin: 0;
          font-size: 18px;
          color: var(--text-primary, #fff);
        }

        .tone-sliders .hint {
          margin: -16px 0 0 0;
          font-size: 14px;
          color: var(--text-secondary, #888);
        }

        .tone-slider-row {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
          background: var(--bg-surface, #1a1a1a);
          border-radius: 12px;
          border: 1px solid var(--border, #333);
        }

        .slider-labels {
          display: flex;
          justify-content: space-between;
          gap: 16px;
        }

        .label-left,
        .label-right {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .label-left {
          text-align: left;
        }

        .label-right {
          text-align: right;
        }

        .label-left strong,
        .label-right strong {
          font-size: 14px;
          color: var(--text-primary, #fff);
        }

        .label-left small,
        .label-right small {
          font-size: 12px;
          color: var(--text-secondary, #888);
        }

        .slider-container {
          position: relative;
          height: 8px;
        }

        .tone-slider {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 8px;
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
          z-index: 2;
        }

        .tone-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--accent, #ff0000);
          border: 3px solid var(--bg-surface, #1a1a1a);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          cursor: pointer;
          transition: transform 0.15s ease;
        }

        .tone-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }

        .tone-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--accent, #ff0000);
          border: 3px solid var(--bg-surface, #1a1a1a);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          cursor: pointer;
        }

        .slider-track {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 8px;
          background: var(--bg-hover, #2a2a2a);
          border-radius: 4px;
          overflow: hidden;
          z-index: 1;
        }

        .slider-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent, #ff0000), var(--accent-light, #ff4444));
          border-radius: 4px;
          transition: width 0.1s ease;
        }

        .slider-value {
          text-align: center;
          font-size: 14px;
          font-weight: 600;
          color: var(--accent, #ff0000);
          padding: 4px 12px;
          background: var(--bg-hover, #2a2a2a);
          border-radius: 6px;
          width: fit-content;
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
}
