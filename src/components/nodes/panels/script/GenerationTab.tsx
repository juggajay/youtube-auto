'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { ScriptNodeConfig, ScriptModel } from '@/stores/nodeConfigStore';

interface Props {
  config: ScriptNodeConfig;
  onChange: (updates: Partial<ScriptNodeConfig>) => void;
}

// Video format options
const VIDEO_FORMATS = [
  { id: 'tutorial', label: 'Tutorial', desc: 'Step-by-step instructional content' },
  { id: 'listicle', label: 'Listicle', desc: 'List-based content (Top 10, 5 Ways, etc.)' },
  { id: 'explainer', label: 'Explainer', desc: 'Deep dive into a concept or topic' },
  { id: 'news', label: 'News', desc: 'Current events or trending topics' },
  { id: 'review', label: 'Review', desc: 'Product or service evaluation' },
  { id: 'vs-battle', label: 'VS Battle', desc: 'Comparison between two subjects' },
  { id: 'story', label: 'Story', desc: 'Narrative-driven content' },
] as const;

// Duration options
const DURATION_OPTIONS = [
  { id: 'short', label: '3-5 min (Short)', minutes: { min: 3, max: 5 } },
  { id: 'standard', label: '8-12 min (Standard)', minutes: { min: 8, max: 12 } },
  { id: 'long', label: '15-20 min (Long)', minutes: { min: 15, max: 20 } },
  { id: 'custom', label: 'Custom', minutes: null },
] as const;

// AI model options
const AI_MODELS: { id: ScriptModel; label: string; recommended?: boolean; desc: string; cost: string; speed: string }[] = [
  {
    id: 'claude-sonnet-4',
    label: 'Claude Sonnet 4',
    recommended: true,
    desc: 'Fast, high quality, cost-effective',
    cost: '$',
    speed: 'Fast',
  },
  {
    id: 'claude-opus-4',
    label: 'Claude Opus 4',
    recommended: false,
    desc: 'Highest quality, slower, higher cost',
    cost: '$$$',
    speed: 'Slower',
  },
];

export function GenerationTab({ config, onChange }: Props) {
  // Local state
  const [archetype, setArchetype] = useState(config.archetype);
  const [targetDuration, setTargetDuration] = useState(config.targetDuration);
  const [customMin, setCustomMin] = useState(config.customDurationMin || 10);
  const [customMax, setCustomMax] = useState(config.customDurationMax || 15);
  const [useChannelBible, setUseChannelBible] = useState(config.useChannelBible);
  const [channelBibleExists, setChannelBibleExists] = useState<boolean | null>(null);

  // Check if channel bible exists
  useEffect(() => {
    const checkChannelBible = async () => {
      try {
        const response = await fetch('/api/channel-bible');
        if (response.ok) {
          const data = await response.json();
          setChannelBibleExists(!!data?.id);
        } else {
          setChannelBibleExists(false);
        }
      } catch {
        setChannelBibleExists(false);
      }
    };
    checkChannelBible();
  }, []);

  // Handle archetype change
  const handleArchetypeChange = (value: string) => {
    setArchetype(value as typeof config.archetype);
    onChange({ archetype: value as typeof config.archetype });
  };

  // Handle duration change
  const handleDurationChange = (value: string) => {
    setTargetDuration(value as typeof config.targetDuration);

    const selected = DURATION_OPTIONS.find(d => d.id === value);
    if (selected && selected.minutes) {
      onChange({
        targetDuration: value as typeof config.targetDuration,
        customDurationMin: selected.minutes.min,
        customDurationMax: selected.minutes.max,
      });
    } else {
      onChange({
        targetDuration: value as typeof config.targetDuration,
      });
    }
  };

  // Handle custom duration change
  const handleCustomDurationChange = (min: number, max: number) => {
    setCustomMin(min);
    setCustomMax(max);
    onChange({
      customDurationMin: min,
      customDurationMax: max,
    });
  };

  // Handle model change
  const handleModelChange = (model: ScriptModel) => {
    onChange({ model });
  };

  // Handle temperature change
  const handleTemperatureChange = (value: number) => {
    onChange({ temperature: value });
  };

  // Handle channel bible toggle
  const handleChannelBibleChange = (enabled: boolean) => {
    setUseChannelBible(enabled);
    onChange({ useChannelBible: enabled });
  };

  // Get temperature label
  const getTemperatureLabel = (temp: number) => {
    if (temp <= 0.4) return 'Focused';
    if (temp <= 0.6) return 'Balanced';
    if (temp <= 0.8) return 'Creative';
    return 'Very Creative';
  };

  return (
    <div className="generation-tab space-y-6">
      <div>
        <h4 className="text-lg font-semibold text-white mb-1">Generation Settings</h4>
        <p className="text-sm text-slate-400">Configure how content is generated at runtime</p>
      </div>

      {/* Video Format */}
      <div className="panel-section">
        <label className="block text-sm font-medium text-slate-300 mb-2">Video Format</label>
        <div className="relative">
          <select
            value={archetype}
            onChange={(e) => handleArchetypeChange(e.target.value)}
            className="panel-select w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-amber-500 focus:ring-0 appearance-none cursor-pointer pr-10"
          >
            {VIDEO_FORMATS.map((format) => (
              <option key={format.id} value={format.id}>
                {format.label}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {VIDEO_FORMATS.find(f => f.id === archetype)?.desc}
        </p>
      </div>

      {/* Target Duration */}
      <div className="panel-section">
        <label className="block text-sm font-medium text-slate-300 mb-2">Target Duration</label>
        <div className="relative">
          <select
            value={targetDuration}
            onChange={(e) => handleDurationChange(e.target.value)}
            className="panel-select w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-amber-500 focus:ring-0 appearance-none cursor-pointer pr-10"
          >
            {DURATION_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {targetDuration === 'custom' && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Min (minutes)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={customMin}
                onChange={(e) => handleCustomDurationChange(parseInt(e.target.value) || 1, customMax)}
                className="w-full px-3 py-2 bg-slate-700 text-white text-sm rounded-lg border border-slate-600 focus:border-amber-500 focus:ring-0"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Max (minutes)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={customMax}
                onChange={(e) => handleCustomDurationChange(customMin, parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-slate-700 text-white text-sm rounded-lg border border-slate-600 focus:border-amber-500 focus:ring-0"
              />
            </div>
          </div>
        )}
      </div>

      {/* AI Model Selection */}
      <div className="panel-section">
        <label className="block text-sm font-medium text-slate-300 mb-3">AI Model</label>
        <div className="space-y-3">
          {AI_MODELS.map((model) => (
            <label
              key={model.id}
              className={`radio-option flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                ${config.model === model.id
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                }`}
            >
              <input
                type="radio"
                name="aiModel"
                checked={config.model === model.id}
                onChange={() => handleModelChange(model.id)}
                className="mt-1 w-4 h-4 text-amber-500 border-slate-600 bg-slate-700 focus:ring-amber-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${config.model === model.id ? 'text-white' : 'text-slate-300'}`}>
                    {model.label}
                  </span>
                  {model.recommended && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400 font-medium">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">{model.desc}</p>
                <div className="flex gap-4 mt-2 text-xs">
                  <span className="text-slate-400">
                    Cost: <span className={`font-medium ${model.cost === '$' ? 'text-green-400' : 'text-amber-400'}`}>{model.cost}</span>
                  </span>
                  <span className="text-slate-400">
                    Speed: <span className="text-slate-300">{model.speed}</span>
                  </span>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Creativity Slider */}
      <div className="panel-section">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-300">Creativity</label>
          <span className="text-sm">
            <span className="font-mono text-amber-400">{config.temperature.toFixed(1)}</span>
            <span className="text-slate-500 ml-2">({getTemperatureLabel(config.temperature)})</span>
          </span>
        </div>
        <div className="relative py-2">
          <input
            type="range"
            min={0.3}
            max={1.0}
            step={0.1}
            value={config.temperature}
            onChange={(e) => handleTemperatureChange(parseFloat(e.target.value))}
            className="refined-slider w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            style={{
              background: `linear-gradient(to right, rgb(245, 158, 11) 0%, rgb(245, 158, 11) ${((config.temperature - 0.3) / 0.7) * 100}%, rgb(51, 65, 85) ${((config.temperature - 0.3) / 0.7) * 100}%, rgb(51, 65, 85) 100%)`
            }}
          />
          <div className="flex justify-between text-xs mt-2">
            <span className="text-slate-500">Focused</span>
            <span className="text-slate-500">Creative</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Lower = more consistent, Higher = more varied
        </p>
      </div>

      {/* Channel Bible Toggle */}
      <div className="panel-section bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <div className="toggle-row flex items-start gap-3">
          <input
            type="checkbox"
            checked={useChannelBible}
            onChange={(e) => handleChannelBibleChange(e.target.checked)}
            disabled={channelBibleExists === false}
            className="mt-0.5 w-5 h-5 rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 disabled:opacity-50"
          />
          <div className="flex-1">
            <span className={`text-sm font-medium block ${useChannelBible && channelBibleExists !== false ? 'text-white' : 'text-slate-400'}`}>
              Use Channel Bible for tone and style
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Apply your channel&apos;s voice, vocabulary, and style preferences to generated content
            </p>

            {channelBibleExists === false && (
              <Link
                href="/settings#channel-bible"
                className="inline-flex items-center gap-1 mt-2 text-xs text-amber-400 hover:text-amber-300 transition-colors"
              >
                Channel Bible not configured? Set it up
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            )}

            {channelBibleExists === true && useChannelBible && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-green-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Channel Bible connected
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cost Estimate */}
      <div className="cost-estimate bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h5 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Estimated Cost per Run
        </h5>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-slate-500 block">Script Generation</span>
            <span className="text-lg font-semibold text-white">
              {config.model === 'claude-opus-4' ? '~$0.15' : '~$0.05'}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Est. Duration</span>
            <span className="text-lg font-semibold text-white">
              {targetDuration === 'custom'
                ? `${customMin}-${customMax} min`
                : DURATION_OPTIONS.find(d => d.id === targetDuration)?.label.split(' ')[0]
              }
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Actual costs vary based on input length and generated output.
        </p>
      </div>
    </div>
  );
}
