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

const TEMPLATE_VARIABLES = [
  { key: '{{title}}', desc: 'Video title' },
  { key: '{{summary}}', desc: 'Auto-generated summary' },
  { key: '{{timestamps}}', desc: 'Chapter timestamps' },
  { key: '{{links}}', desc: 'Resource links' },
  { key: '{{social}}', desc: 'Social media links' },
  { key: '{{cta}}', desc: 'Call to action' },
  { key: '{{channel}}', desc: 'Channel name' },
  { key: '{{date}}', desc: 'Publish date' },
];

const TEMPLATE_PRESETS = [
  {
    id: 'minimal',
    name: 'Minimal',
    template: `{{summary}}

{{timestamps}}

{{cta}}`,
  },
  {
    id: 'standard',
    name: 'Standard',
    template: `{{summary}}

{{timestamps}}

RESOURCES
{{links}}

FOLLOW ME
{{social}}

{{cta}}`,
  },
  {
    id: 'detailed',
    name: 'Detailed',
    template: `In this video: {{summary}}

TIMESTAMPS
{{timestamps}}

RESOURCES & LINKS
{{links}}

CONNECT WITH ME
{{social}}

ABOUT THIS CHANNEL
{{channel}}

{{cta}}

#youtube #video`,
  },
];

export function DescriptionTab({ config, onChange }: Props) {
  const [showVariables, setShowVariables] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // Fetch selected content item when ID changes
  const fetchSelectedContent = useCallback(async () => {
    if (!config.selectedDescriptionId) {
      setSelectedContent(null);
      return;
    }

    setIsLoadingContent(true);
    try {
      const response = await fetch(`/api/content?ids=${config.selectedDescriptionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          setSelectedContent(data.items[0]);
        } else {
          setSelectedContent(null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch selected description:', error);
    } finally {
      setIsLoadingContent(false);
    }
  }, [config.selectedDescriptionId]);

  useEffect(() => {
    fetchSelectedContent();
  }, [fetchSelectedContent]);

  const handleSelectDescription = (content: ContentItem) => {
    onChange({ selectedDescriptionId: content.id });
    setPickerOpen(false);
  };

  const removeSelectedDescription = () => {
    onChange({ selectedDescriptionId: null });
  };

  const insertVariable = (variable: string) => {
    const cursorPosition = document.getElementById('description-template') as HTMLTextAreaElement;
    if (cursorPosition) {
      const start = cursorPosition.selectionStart;
      const end = cursorPosition.selectionEnd;
      const text = config.descriptionTemplate;
      const newText = text.substring(0, start) + variable + text.substring(end);
      onChange({ descriptionTemplate: newText });
      // Reset cursor position after insert
      setTimeout(() => {
        cursorPosition.focus();
        cursorPosition.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else {
      onChange({ descriptionTemplate: config.descriptionTemplate + variable });
    }
  };

  const applyPreset = (presetId: string) => {
    const preset = TEMPLATE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      onChange({ descriptionTemplate: preset.template });
    }
  };

  const truncateContent = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  return (
    <div className="description-tab space-y-6">
      <div>
        <h4 className="text-lg font-semibold text-white mb-1">Description Template</h4>
        <p className="text-sm text-slate-400">Configure the video description format</p>
      </div>

      {/* Source Mode Selector */}
      <div className="form-group">
        <label className="block text-sm font-medium text-slate-300 mb-3">Source</label>
        <div className="source-mode-selector flex gap-2">
          {SOURCE_MODES.map((mode) => (
            <button
              key={mode.id}
              className={`source-mode-btn flex-1 flex flex-col items-center gap-1 px-3 py-3 rounded-lg border-2 transition-all text-center
                ${config.descriptionSourceMode === mode.id
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                }`}
              onClick={() => onChange({ descriptionSourceMode: mode.id })}
            >
              <span className={`font-medium text-sm ${config.descriptionSourceMode === mode.id ? 'text-white' : 'text-slate-300'}`}>
                {mode.label}
              </span>
              <span className="text-xs text-slate-500">{mode.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Use Saved Mode */}
      {config.descriptionSourceMode === 'saved' && (
        <div className="form-group space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300">Selected Description</label>
            {!selectedContent && (
              <button
                className="px-3 py-1.5 text-sm rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors flex items-center gap-2"
                onClick={() => setPickerOpen(true)}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Select from Library
              </button>
            )}
          </div>

          {isLoadingContent ? (
            <div className="text-sm text-slate-500 italic">Loading...</div>
          ) : !selectedContent ? (
            <div className="text-sm text-slate-500 italic p-4 border border-dashed border-slate-600 rounded-lg text-center">
              No description selected. Select a description from your content library.
            </div>
          ) : (
            <div className="selected-description-card p-4 rounded-lg bg-slate-800 border border-slate-700">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="description-badge px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500 text-white uppercase">
                    Description
                  </span>
                  <span className="text-sm font-medium text-white">{selectedContent.name}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="text-slate-400 hover:text-amber-400 transition-colors"
                    onClick={() => setPickerOpen(true)}
                    title="Change"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button
                    className="text-slate-400 hover:text-red-400 transition-colors"
                    onClick={removeSelectedDescription}
                    title="Remove"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-400 whitespace-pre-wrap">{truncateContent(selectedContent.content)}</p>
            </div>
          )}

          <p className="text-xs text-slate-500">
            This description will be used exactly as saved, with variables filled in during generation.
          </p>
        </div>
      )}

      {/* Generate with Examples Mode */}
      {config.descriptionSourceMode === 'examples' && (
        <>
          <div className="form-group space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-slate-300 block">Template Reference</label>
                <p className="text-xs text-slate-500 mt-1">Selected description will be used as a style template</p>
              </div>
              {!selectedContent && (
                <button
                  className="px-3 py-1.5 text-sm rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors flex items-center gap-2"
                  onClick={() => setPickerOpen(true)}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Select Template
                </button>
              )}
            </div>

            {isLoadingContent ? (
              <div className="text-sm text-slate-500 italic">Loading...</div>
            ) : !selectedContent ? (
              <div className="text-sm text-slate-500 italic p-4 border border-dashed border-slate-600 rounded-lg text-center">
                No template selected. Add a description to guide AI generation style.
              </div>
            ) : (
              <div className="selected-description-card p-4 rounded-lg bg-slate-800 border border-amber-500/30">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="example-badge px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Template
                    </span>
                    <span className="text-sm font-medium text-white">{selectedContent.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="text-slate-400 hover:text-amber-400 transition-colors"
                      onClick={() => setPickerOpen(true)}
                      title="Change"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <button
                      className="text-slate-400 hover:text-red-400 transition-colors"
                      onClick={removeSelectedDescription}
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-400 whitespace-pre-wrap">{truncateContent(selectedContent.content)}</p>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="form-group space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
                checked={config.includeTimestamps}
                onChange={(e) => onChange({ includeTimestamps: e.target.checked })}
              />
              <div>
                <span className="text-sm text-slate-300 block">Include Timestamps</span>
                <span className="text-xs text-slate-500">Auto-generate chapter timestamps from script sections</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
                checked={config.includeLinks}
                onChange={(e) => onChange({ includeLinks: e.target.checked })}
              />
              <div>
                <span className="text-sm text-slate-300 block">Include Resource Links</span>
                <span className="text-xs text-slate-500">Add links mentioned in the script</span>
              </div>
            </label>
          </div>

          {/* Custom Variables */}
          <div className="form-group">
            <label className="block text-sm font-medium text-slate-300 mb-2">Custom Variables</label>
            <p className="text-xs text-slate-500 mb-3">Define custom values for your template</p>

            <div className="space-y-2">
              {/* Social Links */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Social media links"
                  className="flex-1 bg-slate-700 text-white text-sm rounded-lg px-3 py-2 border border-slate-600 focus:border-amber-500 focus:ring-0"
                  value={config.descriptionVariables['social'] || ''}
                  onChange={(e) => onChange({
                    descriptionVariables: {
                      ...config.descriptionVariables,
                      social: e.target.value,
                    }
                  })}
                />
              </div>

              {/* CTA */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Call to action text"
                  className="flex-1 bg-slate-700 text-white text-sm rounded-lg px-3 py-2 border border-slate-600 focus:border-amber-500 focus:ring-0"
                  value={config.descriptionVariables['cta'] || ''}
                  onChange={(e) => onChange({
                    descriptionVariables: {
                      ...config.descriptionVariables,
                      cta: e.target.value,
                    }
                  })}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Generate Fresh Mode (Original UI) */}
      {config.descriptionSourceMode === 'fresh' && (
        <>
          {/* Template Presets */}
          <div className="form-group">
            <label className="block text-sm font-medium text-slate-300 mb-2">Quick Start Template</label>
            <div className="flex gap-2">
              {TEMPLATE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  className="px-3 py-1.5 text-sm rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
                  onClick={() => applyPreset(preset.id)}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Template Editor */}
          <div className="form-group">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">Template</label>
              <button
                className="text-xs text-amber-400 hover:text-amber-300"
                onClick={() => setShowVariables(!showVariables)}
              >
                {showVariables ? 'Hide' : 'Show'} Variables
              </button>
            </div>

            {/* Variables Panel */}
            {showVariables && (
              <div className="variables-panel bg-slate-800 rounded-lg p-3 mb-3 border border-slate-700">
                <p className="text-xs text-slate-400 mb-2">Click to insert variable:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TEMPLATE_VARIABLES.map((v) => (
                    <button
                      key={v.key}
                      className="text-left p-2 rounded bg-slate-700 hover:bg-slate-600 transition-colors"
                      onClick={() => insertVariable(v.key)}
                    >
                      <span className="block text-xs font-mono text-amber-400">{v.key}</span>
                      <span className="block text-xs text-slate-400">{v.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <textarea
              id="description-template"
              className="w-full h-48 bg-slate-700 text-white font-mono text-sm rounded-lg px-3 py-2 border border-slate-600 focus:border-amber-500 focus:ring-0 resize-none"
              value={config.descriptionTemplate}
              onChange={(e) => onChange({ descriptionTemplate: e.target.value })}
              placeholder="Enter your description template...

Use variables like {{title}}, {{summary}}, {{timestamps}} to auto-fill content."
            />
          </div>

          {/* Options */}
          <div className="form-group space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
                checked={config.includeTimestamps}
                onChange={(e) => onChange({ includeTimestamps: e.target.checked })}
              />
              <div>
                <span className="text-sm text-slate-300 block">Include Timestamps</span>
                <span className="text-xs text-slate-500">Auto-generate chapter timestamps from script sections</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
                checked={config.includeLinks}
                onChange={(e) => onChange({ includeLinks: e.target.checked })}
              />
              <div>
                <span className="text-sm text-slate-300 block">Include Resource Links</span>
                <span className="text-xs text-slate-500">Add links mentioned in the script</span>
              </div>
            </label>
          </div>

          {/* Custom Variables */}
          <div className="form-group">
            <label className="block text-sm font-medium text-slate-300 mb-2">Custom Variables</label>
            <p className="text-xs text-slate-500 mb-3">Define custom values for your template</p>

            <div className="space-y-2">
              {/* Social Links */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Social media links"
                  className="flex-1 bg-slate-700 text-white text-sm rounded-lg px-3 py-2 border border-slate-600 focus:border-amber-500 focus:ring-0"
                  value={config.descriptionVariables['social'] || ''}
                  onChange={(e) => onChange({
                    descriptionVariables: {
                      ...config.descriptionVariables,
                      social: e.target.value,
                    }
                  })}
                />
              </div>

              {/* CTA */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Call to action text"
                  className="flex-1 bg-slate-700 text-white text-sm rounded-lg px-3 py-2 border border-slate-600 focus:border-amber-500 focus:ring-0"
                  value={config.descriptionVariables['cta'] || ''}
                  onChange={(e) => onChange({
                    descriptionVariables: {
                      ...config.descriptionVariables,
                      cta: e.target.value,
                    }
                  })}
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="preview bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h5 className="text-sm font-semibold text-slate-300 mb-2">Preview</h5>
            <div className="text-sm text-slate-400 whitespace-pre-wrap font-mono">
              {config.descriptionTemplate
                .replace('{{title}}', 'Your Video Title Here')
                .replace('{{summary}}', 'This video covers the key points about the topic, including important details and actionable insights.')
                .replace('{{timestamps}}', '0:00 - Intro\n1:30 - Main Topic\n5:00 - Key Points\n8:00 - Conclusion')
                .replace('{{links}}', 'https://example.com/resource1\nhttps://example.com/resource2')
                .replace('{{social}}', config.descriptionVariables['social'] || 'Twitter: @channel\nInstagram: @channel')
                .replace('{{cta}}', config.descriptionVariables['cta'] || 'Subscribe for more content!')
                .replace('{{channel}}', 'Your Channel Name')
                .replace('{{date}}', new Date().toLocaleDateString())
                || 'No template defined. Add a template above to see preview.'}
            </div>
          </div>
        </>
      )}

      {/* Content Picker Modal */}
      <ContentPicker
        type="description"
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectDescription}
        multiple={false}
        excludeIds={config.selectedDescriptionId ? [config.selectedDescriptionId] : []}
      />
    </div>
  );
}
