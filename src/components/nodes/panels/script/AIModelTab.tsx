'use client';

import type { ScriptNodeConfig, ScriptModel } from '@/stores/nodeConfigStore';

interface Props {
  config: ScriptNodeConfig;
  onChange: (updates: Partial<ScriptNodeConfig>) => void;
}

const MODELS: { id: ScriptModel; label: string; desc: string; cost: string; speed: string; quality: string }[] = [
  {
    id: 'claude-sonnet',
    label: 'Claude Sonnet',
    desc: 'Fast and efficient, great for most scripts',
    cost: '$',
    speed: 'Fast',
    quality: 'High',
  },
  {
    id: 'claude-opus',
    label: 'Claude Opus',
    desc: 'Best quality, ideal for complex narratives',
    cost: '$$$',
    speed: 'Slower',
    quality: 'Highest',
  },
  {
    id: 'gpt-4',
    label: 'GPT-4',
    desc: 'OpenAI flagship model',
    cost: '$$',
    speed: 'Medium',
    quality: 'High',
  },
  {
    id: 'gpt-4-turbo',
    label: 'GPT-4 Turbo',
    desc: 'Faster GPT-4 variant',
    cost: '$$',
    speed: 'Fast',
    quality: 'High',
  },
];

const TOKEN_PRESETS = [
  { value: 2000, label: '2K', desc: '~1,500 words' },
  { value: 4000, label: '4K', desc: '~3,000 words' },
  { value: 8000, label: '8K', desc: '~6,000 words' },
  { value: 16000, label: '16K', desc: '~12,000 words' },
];

export function AIModelTab({ config, onChange }: Props) {
  const getTemperatureLabel = (temp: number) => {
    if (temp <= 0.3) return 'Very Focused';
    if (temp <= 0.5) return 'Focused';
    if (temp <= 0.7) return 'Balanced';
    if (temp <= 0.9) return 'Creative';
    return 'Very Creative';
  };

  return (
    <div className="ai-model-tab space-y-6">
      <div>
        <h4 className="text-lg font-semibold text-white mb-1">AI Model Settings</h4>
        <p className="text-sm text-slate-400">Configure the AI model for script generation</p>
      </div>

      {/* Model Selection */}
      <div className="form-group">
        <label className="block text-sm font-medium text-slate-300 mb-3">Model</label>
        <div className="model-grid grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MODELS.map((model) => (
            <button
              key={model.id}
              className={`model-card flex flex-col p-4 rounded-lg border-2 transition-all text-left
                ${config.model === model.id
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                }`}
              onClick={() => onChange({ model: model.id })}
            >
              <div className="flex items-start justify-between mb-2">
                <span className={`model-name font-semibold ${config.model === model.id ? 'text-white' : 'text-slate-300'}`}>
                  {model.label}
                </span>
                <span className={`model-cost text-xs px-2 py-0.5 rounded-full
                  ${model.cost === '$' ? 'bg-green-500/20 text-green-400' : ''}
                  ${model.cost === '$$' ? 'bg-amber-500/20 text-amber-400' : ''}
                  ${model.cost === '$$$' ? 'bg-purple-500/20 text-purple-400' : ''}
                `}>
                  {model.cost}
                </span>
              </div>
              <span className="model-desc text-xs text-slate-500 mb-3">
                {model.desc}
              </span>
              <div className="flex gap-4 text-xs">
                <span className="text-slate-400">
                  Speed: <span className="text-slate-300">{model.speed}</span>
                </span>
                <span className="text-slate-400">
                  Quality: <span className="text-slate-300">{model.quality}</span>
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Temperature */}
      <div className="form-group">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-300">Temperature</label>
          <span className="text-sm">
            <span className="font-mono text-amber-400">{config.temperature.toFixed(2)}</span>
            <span className="text-slate-500 ml-2">({getTemperatureLabel(config.temperature)})</span>
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={config.temperature}
          onChange={(e) => onChange({ temperature: parseFloat(e.target.value) })}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
        <div className="flex justify-between text-xs mt-2">
          <div className="text-center">
            <span className="text-slate-400 block">0.0</span>
            <span className="text-slate-500">Focused</span>
          </div>
          <div className="text-center">
            <span className="text-slate-400 block">0.5</span>
            <span className="text-slate-500">Balanced</span>
          </div>
          <div className="text-center">
            <span className="text-slate-400 block">1.0</span>
            <span className="text-slate-500">Creative</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Higher temperature = more creative and varied output.
          Lower = more consistent and predictable.
        </p>
      </div>

      {/* Max Tokens */}
      <div className="form-group">
        <label className="block text-sm font-medium text-slate-300 mb-3">Max Output Tokens</label>
        <div className="token-presets grid grid-cols-4 gap-2">
          {TOKEN_PRESETS.map((preset) => (
            <button
              key={preset.value}
              className={`token-btn flex flex-col items-center p-3 rounded-lg border-2 transition-all
                ${config.maxTokens === preset.value
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                }`}
              onClick={() => onChange({ maxTokens: preset.value })}
            >
              <span className={`text-lg font-semibold ${config.maxTokens === preset.value ? 'text-white' : 'text-slate-300'}`}>
                {preset.label}
              </span>
              <span className="text-xs text-slate-500">{preset.desc}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Longer scripts require more tokens. A 10-minute script typically needs 4-8K tokens.
        </p>
      </div>

      {/* Cost Estimate */}
      <div className="cost-estimate bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h5 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Estimated Cost
        </h5>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-slate-500 block">Per Script</span>
            <span className="text-lg font-semibold text-white">
              {config.model === 'claude-opus' ? '~$0.15' : '~$0.05'}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Estimated Tokens</span>
            <span className="text-lg font-semibold text-white">
              ~{Math.round(config.maxTokens * 0.8).toLocaleString()}
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Actual costs vary based on input length and generated output.
        </p>
      </div>

      {/* Model Comparison */}
      <div className="comparison bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <h5 className="text-sm font-semibold text-slate-300 mb-2">When to use each model:</h5>
        <ul className="text-xs text-slate-400 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-green-400 font-semibold min-w-[100px]">Sonnet:</span>
            <span>Quick drafts, listicles, simple tutorials, high volume</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400 font-semibold min-w-[100px]">Opus:</span>
            <span>Complex narratives, documentary-style, important videos</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 font-semibold min-w-[100px]">GPT-4:</span>
            <span>Technical content, coding tutorials, varied styles</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 font-semibold min-w-[100px]">GPT-4 Turbo:</span>
            <span>Same as GPT-4 but faster, good for iteration</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
