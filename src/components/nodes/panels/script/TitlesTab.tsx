'use client';

import { useState } from 'react';
import type { ScriptNodeConfig } from '@/stores/nodeConfigStore';

interface Props {
  config: ScriptNodeConfig;
  onChange: (updates: Partial<ScriptNodeConfig>) => void;
}

const DEFAULT_POWER_WORDS = [
  'Secret', 'Shocking', 'Ultimate', 'Proven', 'Instantly',
  'Never', 'Always', 'Hidden', 'Exposed', 'Truth',
  'Amazing', 'Essential', 'Guaranteed', 'Revolutionary', 'Exclusive',
];

const TITLE_PATTERNS = [
  { id: 'how-to', label: 'How To X', example: 'How To 10x Your Productivity' },
  { id: 'number-list', label: 'X Things...', example: '7 Things Rich People Never Do' },
  { id: 'why', label: 'Why X...', example: 'Why Most Startups Fail' },
  { id: 'what', label: 'What X...', example: "What They Don't Tell You About..." },
  { id: 'versus', label: 'X vs Y', example: 'iPhone vs Android: The Truth' },
  { id: 'mistake', label: 'X Mistake...', example: 'The #1 Mistake Beginners Make' },
  { id: 'complete-guide', label: 'Complete Guide', example: 'The Complete Guide to...' },
  { id: 'stop-doing', label: 'Stop Doing X', example: 'Stop Doing This If You Want To...' },
];

export function TitlesTab({ config, onChange }: Props) {
  const [newPowerWord, setNewPowerWord] = useState('');

  const addPowerWord = () => {
    const word = newPowerWord.trim();
    if (word && !config.powerWords.includes(word)) {
      onChange({ powerWords: [...config.powerWords, word] });
      setNewPowerWord('');
    }
  };

  const removePowerWord = (word: string) => {
    onChange({ powerWords: config.powerWords.filter(w => w !== word) });
  };

  const togglePattern = (patternId: string) => {
    const patterns = config.titlePatterns.includes(patternId)
      ? config.titlePatterns.filter(p => p !== patternId)
      : [...config.titlePatterns, patternId];
    onChange({ titlePatterns: patterns });
  };

  return (
    <div className="titles-tab space-y-6">
      <div>
        <h4 className="text-lg font-semibold text-white mb-1">Title Generation</h4>
        <p className="text-sm text-slate-400">Configure how video titles are generated</p>
      </div>

      {/* Number of Titles */}
      <div className="form-group">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-300">Titles to Generate</label>
          <span className="text-sm font-mono text-amber-400">{config.titlesToGenerate}</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={config.titlesToGenerate}
          onChange={(e) => onChange({ titlesToGenerate: parseInt(e.target.value) })}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>1</span>
          <span>10</span>
        </div>
      </div>

      {/* Max Length */}
      <div className="form-group">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-300">Max Title Length</label>
          <span className="text-sm font-mono text-amber-400">{config.titleMaxLength} chars</span>
        </div>
        <input
          type="range"
          min={30}
          max={100}
          value={config.titleMaxLength}
          onChange={(e) => onChange({ titleMaxLength: parseInt(e.target.value) })}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>30</span>
          <span>60 (mobile cutoff)</span>
          <span>100</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">YouTube truncates titles at ~60 characters on mobile</p>
      </div>

      {/* Title Patterns */}
      <div className="form-group">
        <label className="block text-sm font-medium text-slate-300 mb-3">Preferred Patterns</label>
        <div className="patterns-grid grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TITLE_PATTERNS.map((pattern) => (
            <label
              key={pattern.id}
              className={`pattern-checkbox flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all
                ${config.titlePatterns.includes(pattern.id)
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                }`}
            >
              <input
                type="checkbox"
                className="w-4 h-4 mt-0.5 rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
                checked={config.titlePatterns.includes(pattern.id)}
                onChange={() => togglePattern(pattern.id)}
              />
              <div className="flex-1 min-w-0">
                <span className={`pattern-label block font-medium text-sm ${config.titlePatterns.includes(pattern.id) ? 'text-white' : 'text-slate-300'}`}>
                  {pattern.label}
                </span>
                <span className="pattern-example block text-xs text-slate-500 truncate">
                  {pattern.example}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Power Words */}
      <div className="form-group">
        <label className="block text-sm font-medium text-slate-300 mb-1">Power Words</label>
        <p className="text-xs text-slate-500 mb-3">High-impact words to include in titles</p>

        {/* Current Power Words */}
        <div className="power-words flex flex-wrap gap-2 mb-3">
          {config.powerWords.length === 0 ? (
            <span className="text-sm text-slate-500 italic">No power words added</span>
          ) : (
            config.powerWords.map((word) => (
              <span
                key={word}
                className="power-word inline-flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm"
              >
                {word}
                <button
                  onClick={() => removePowerWord(word)}
                  className="hover:text-amber-300"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))
          )}
        </div>

        {/* Add Power Word */}
        <div className="add-power-word flex gap-2">
          <input
            type="text"
            value={newPowerWord}
            onChange={(e) => setNewPowerWord(e.target.value)}
            placeholder="Add power word"
            className="flex-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:border-amber-500 focus:ring-0"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addPowerWord();
              }
            }}
          />
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors"
            onClick={addPowerWord}
          >
            Add
          </button>
        </div>

        {/* Suggestions */}
        <div className="suggestions mt-3">
          <span className="text-xs text-slate-500">Suggestions:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {DEFAULT_POWER_WORDS.filter(w => !config.powerWords.includes(w)).slice(0, 8).map((word) => (
              <button
                key={word}
                className="suggestion-chip px-2 py-0.5 text-xs rounded-full bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white transition-colors"
                onClick={() => onChange({ powerWords: [...config.powerWords, word] })}
              >
                + {word}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="preview bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h5 className="text-sm font-semibold text-slate-300 mb-2">Configuration Summary</h5>
        <div className="space-y-1 text-sm text-slate-400">
          <p>Will generate <span className="text-amber-400 font-medium">{config.titlesToGenerate}</span> title options</p>
          <p>Max length: <span className="text-amber-400 font-medium">{config.titleMaxLength}</span> characters</p>
          <p>Patterns: <span className="text-amber-400 font-medium">{config.titlePatterns.length > 0 ? config.titlePatterns.length : 'any'}</span> selected</p>
          <p>Power words: <span className="text-amber-400 font-medium">{config.powerWords.length}</span> available</p>
        </div>
      </div>
    </div>
  );
}
