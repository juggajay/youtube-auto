'use client';

import { useState } from 'react';
import type { ScriptNodeConfig } from '@/stores/nodeConfigStore';

interface Props {
  config: ScriptNodeConfig;
  onChange: (updates: Partial<ScriptNodeConfig>) => void;
}

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

  return (
    <div className="description-tab space-y-6">
      <div>
        <h4 className="text-lg font-semibold text-white mb-1">Description Template</h4>
        <p className="text-sm text-slate-400">Configure the video description format</p>
      </div>

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
    </div>
  );
}
