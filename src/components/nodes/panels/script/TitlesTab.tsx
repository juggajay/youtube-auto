'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ScriptNodeConfig, ContentSourceMode } from '@/stores/nodeConfigStore';
import { ContentPicker } from '@/components/content';
import type { ContentItem } from '@/types/database';

interface Props {
  config: ScriptNodeConfig;
  onChange: (updates: Partial<ScriptNodeConfig>) => void;
}

const SOURCE_MODES: { id: ContentSourceMode; label: string; desc: string }[] = [
  { id: 'saved', label: 'Use Saved', desc: 'Select from library' },
  { id: 'examples', label: 'Generate with Examples', desc: 'AI learns from your style' },
  { id: 'fresh', label: 'Generate Fresh', desc: 'AI creates new content' },
];

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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedContents, setSelectedContents] = useState<ContentItem[]>([]);
  const [isLoadingContents, setIsLoadingContents] = useState(false);

  // Fetch selected content items when IDs change
  const fetchSelectedContents = useCallback(async () => {
    if (config.selectedTitleIds.length === 0) {
      setSelectedContents([]);
      return;
    }

    setIsLoadingContents(true);
    try {
      const response = await fetch(`/api/content?ids=${config.selectedTitleIds.join(',')}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedContents(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch selected titles:', error);
    } finally {
      setIsLoadingContents(false);
    }
  }, [config.selectedTitleIds]);

  useEffect(() => {
    fetchSelectedContents();
  }, [fetchSelectedContents]);

  const removeSelectedTitle = (id: string) => {
    onChange({ selectedTitleIds: config.selectedTitleIds.filter(titleId => titleId !== id) });
  };

  const handleSelectTitle = (content: ContentItem) => {
    if (!config.selectedTitleIds.includes(content.id)) {
      onChange({ selectedTitleIds: [...config.selectedTitleIds, content.id] });
    }
    setPickerOpen(false);
  };

  const handleMultiSelectTitles = (contents: ContentItem[]) => {
    onChange({ selectedTitleIds: contents.map(c => c.id) });
    setPickerOpen(false);
  };

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

  const truncateContent = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  return (
    <div className="titles-tab space-y-6">
      <div>
        <h4 className="text-lg font-semibold text-white mb-1">Title Generation</h4>
        <p className="text-sm text-slate-400">Configure how video titles are generated</p>
      </div>

      {/* Source Mode Selector */}
      <div className="form-group">
        <label className="block text-sm font-medium text-slate-300 mb-3">Source</label>
        <div className="source-mode-selector flex gap-2">
          {SOURCE_MODES.map((mode) => (
            <button
              key={mode.id}
              className={`source-mode-btn flex-1 flex flex-col items-center gap-1 px-3 py-3 rounded-lg border-2 transition-all text-center
                ${config.titleSourceMode === mode.id
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                }`}
              onClick={() => onChange({ titleSourceMode: mode.id })}
            >
              <span className={`font-medium text-sm ${config.titleSourceMode === mode.id ? 'text-white' : 'text-slate-300'}`}>
                {mode.label}
              </span>
              <span className="text-xs text-slate-500">{mode.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Use Saved Mode */}
      {config.titleSourceMode === 'saved' && (
        <div className="form-group space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300">Selected Titles</label>
            <button
              className="px-3 py-1.5 text-sm rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors flex items-center gap-2"
              onClick={() => setPickerOpen(true)}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add from Library
            </button>
          </div>

          {isLoadingContents ? (
            <div className="text-sm text-slate-500 italic">Loading...</div>
          ) : selectedContents.length === 0 ? (
            <div className="text-sm text-slate-500 italic p-4 border border-dashed border-slate-600 rounded-lg text-center">
              No titles selected. Add titles from your content library.
            </div>
          ) : (
            <div className="selected-titles space-y-2">
              {selectedContents.map((content) => (
                <div
                  key={content.id}
                  className="selected-title-card flex items-start gap-3 p-3 rounded-lg bg-slate-800 border border-slate-700"
                >
                  <span className="title-badge px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-500 text-white uppercase">
                    Title
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{content.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{truncateContent(content.content)}</p>
                  </div>
                  <button
                    className="text-slate-400 hover:text-red-400 transition-colors"
                    onClick={() => removeSelectedTitle(content.id)}
                    title="Remove"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-slate-500">
            These titles will be used exactly as saved. You&apos;ll choose one during the review step.
          </p>
        </div>
      )}

      {/* Generate with Examples Mode */}
      {config.titleSourceMode === 'examples' && (
        <>
          <div className="form-group space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-slate-300 block">Example Titles</label>
                <p className="text-xs text-slate-500 mt-1">Selected titles will inform the generation style</p>
              </div>
              <button
                className="px-3 py-1.5 text-sm rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors flex items-center gap-2"
                onClick={() => setPickerOpen(true)}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Select Examples
              </button>
            </div>

            {isLoadingContents ? (
              <div className="text-sm text-slate-500 italic">Loading...</div>
            ) : selectedContents.length === 0 ? (
              <div className="text-sm text-slate-500 italic p-4 border border-dashed border-slate-600 rounded-lg text-center">
                No examples selected. Add titles to guide AI generation style.
              </div>
            ) : (
              <div className="selected-titles space-y-2">
                {selectedContents.map((content) => (
                  <div
                    key={content.id}
                    className="selected-title-card flex items-start gap-3 p-3 rounded-lg bg-slate-800 border border-cyan-500/30"
                  >
                    <span className="example-badge px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      Example
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{content.name}</p>
                      <p className="text-xs text-slate-400 mt-1">{truncateContent(content.content)}</p>
                    </div>
                    <button
                      className="text-slate-400 hover:text-red-400 transition-colors"
                      onClick={() => removeSelectedTitle(content.id)}
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Number of Titles */}
          <div className="form-group">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">Titles to Generate</label>
              <span className="text-sm font-mono text-cyan-400">{config.titlesToGenerate}</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={config.titlesToGenerate}
              onChange={(e) => onChange({ titlesToGenerate: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>1</span>
              <span>10</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">AI will generate titles inspired by your examples</p>
          </div>

          {/* Max Length */}
          <div className="form-group">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">Max Title Length</label>
              <span className="text-sm font-mono text-cyan-400">{config.titleMaxLength} chars</span>
            </div>
            <input
              type="range"
              min={30}
              max={100}
              value={config.titleMaxLength}
              onChange={(e) => onChange({ titleMaxLength: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>30</span>
              <span>60 (mobile cutoff)</span>
              <span>100</span>
            </div>
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
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                    }`}
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 mt-0.5 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
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
        </>
      )}

      {/* Generate Fresh Mode (Original UI) */}
      {config.titleSourceMode === 'fresh' && (
        <>
          {/* Number of Titles */}
          <div className="form-group">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">Titles to Generate</label>
              <span className="text-sm font-mono text-cyan-400">{config.titlesToGenerate}</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={config.titlesToGenerate}
              onChange={(e) => onChange({ titlesToGenerate: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
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
              <span className="text-sm font-mono text-cyan-400">{config.titleMaxLength} chars</span>
            </div>
            <input
              type="range"
              min={30}
              max={100}
              value={config.titleMaxLength}
              onChange={(e) => onChange({ titleMaxLength: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
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
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                    }`}
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 mt-0.5 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
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
                    className="power-word inline-flex items-center gap-1 px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm"
                  >
                    {word}
                    <button
                      onClick={() => removePowerWord(word)}
                      className="hover:text-cyan-300"
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
                className="flex-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:border-cyan-500 focus:ring-0"
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
              <p>Will generate <span className="text-cyan-400 font-medium">{config.titlesToGenerate}</span> title options</p>
              <p>Max length: <span className="text-cyan-400 font-medium">{config.titleMaxLength}</span> characters</p>
              <p>Patterns: <span className="text-cyan-400 font-medium">{config.titlePatterns.length > 0 ? config.titlePatterns.length : 'any'}</span> selected</p>
              <p>Power words: <span className="text-cyan-400 font-medium">{config.powerWords.length}</span> available</p>
            </div>
          </div>
        </>
      )}

      {/* Content Picker Modal */}
      <ContentPicker
        type="title"
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectTitle}
        onMultiSelect={handleMultiSelectTitles}
        multiple={true}
        excludeIds={config.selectedTitleIds}
      />
    </div>
  );
}
