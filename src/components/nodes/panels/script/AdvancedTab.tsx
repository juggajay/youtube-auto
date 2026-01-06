'use client';

import type { ScriptNodeConfig } from '@/stores/nodeConfigStore';

interface Props {
  config: ScriptNodeConfig;
  onChange: (updates: Partial<ScriptNodeConfig>) => void;
}

export function AdvancedTab({ config, onChange }: Props) {
  return (
    <div className="advanced-tab space-y-6">
      <div>
        <h4 className="text-lg font-semibold text-white mb-1">Advanced Settings</h4>
        <p className="text-sm text-slate-400">Fine-tune script generation with advanced options</p>
      </div>

      {/* Warning Banner */}
      <div className="warning-banner flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
        <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-xs text-amber-300">
          These settings are for advanced users. Incorrect configuration may result in unexpected script output.
        </p>
      </div>

      {/* System Prompt Addition */}
      <div className="form-group">
        <label className="block text-sm font-medium text-slate-300 mb-1">System Prompt Addition</label>
        <p className="text-xs text-slate-500 mb-3">
          Custom instructions appended to the AI&apos;s system prompt. Use this to add specific guidelines or constraints.
        </p>
        <textarea
          className="w-full h-40 bg-slate-700 text-white font-mono text-sm rounded-lg px-3 py-2 border border-slate-600 focus:border-amber-500 focus:ring-0 resize-none"
          value={config.systemPromptAddition}
          onChange={(e) => onChange({ systemPromptAddition: e.target.value })}
          placeholder={`Example instructions:
- Always include a personal anecdote in the intro
- Use British English spelling
- Reference the viewer as "you" not "viewers"
- Include exactly 3 rhetorical questions per script`}
        />
        <p className="text-xs text-slate-500 mt-2">
          Leave empty to use default system prompt only.
        </p>
      </div>

      {/* Debug Mode */}
      <div className="form-group">
        <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg bg-slate-800 border border-slate-700">
          <input
            type="checkbox"
            className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
            checked={config.debugMode}
            onChange={(e) => onChange({ debugMode: e.target.checked })}
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-white block">Debug Mode</span>
            <span className="text-xs text-slate-400">Show full prompts, token counts, and AI reasoning in output</span>
          </div>
          {config.debugMode && (
            <span className="px-2 py-1 text-xs bg-amber-500/20 text-amber-400 rounded-full">Enabled</span>
          )}
        </label>
      </div>

      {/* Raw Output */}
      <div className="form-group">
        <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg bg-slate-800 border border-slate-700">
          <input
            type="checkbox"
            className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
            checked={config.rawOutput}
            onChange={(e) => onChange({ rawOutput: e.target.checked })}
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-white block">Raw Output</span>
            <span className="text-xs text-slate-400">Return raw AI response without post-processing or formatting</span>
          </div>
          {config.rawOutput && (
            <span className="px-2 py-1 text-xs bg-amber-500/20 text-amber-400 rounded-full">Enabled</span>
          )}
        </label>
      </div>

      {/* Prompt Templates */}
      <div className="form-group">
        <label className="block text-sm font-medium text-slate-300 mb-3">Quick Additions</label>
        <p className="text-xs text-slate-500 mb-3">Click to append common instructions to your system prompt</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Use British English', value: '\n- Use British English spelling and grammar' },
            { label: 'Include stats', value: '\n- Include at least 2 statistics or data points with sources' },
            { label: 'Add humor', value: '\n- Include light humor and wit where appropriate' },
            { label: 'Be concise', value: '\n- Keep sentences short and punchy, avoid filler words' },
            { label: 'Personal stories', value: '\n- Include relevant personal anecdotes or examples' },
            { label: 'Contrarian angle', value: '\n- Take a contrarian or unexpected angle on the topic' },
            { label: 'Include analogies', value: '\n- Use vivid analogies and metaphors to explain concepts' },
            { label: 'Call out myths', value: '\n- Identify and debunk common misconceptions' },
          ].map((template) => (
            <button
              key={template.label}
              className="px-3 py-1.5 text-xs rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
              onClick={() => onChange({
                systemPromptAddition: config.systemPromptAddition + template.value
              })}
            >
              + {template.label}
            </button>
          ))}
        </div>
      </div>

      {/* Configuration Export */}
      <div className="form-group">
        <label className="block text-sm font-medium text-slate-300 mb-3">Configuration</label>
        <div className="flex gap-2">
          <button
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            onClick={() => {
              const configStr = JSON.stringify(config, null, 2);
              navigator.clipboard.writeText(configStr);
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Config
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  const text = await file.text();
                  try {
                    const imported = JSON.parse(text);
                    onChange(imported);
                  } catch (err) {
                    console.error('Failed to parse config:', err);
                    alert('Invalid configuration file');
                  }
                }
              };
              input.click();
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import Config
          </button>
        </div>
      </div>

      {/* Debug Info */}
      {config.debugMode && (
        <div className="debug-info bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h5 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Debug Information
          </h5>
          <pre className="text-xs text-slate-400 overflow-x-auto">
{`Model: ${config.model}
Temperature: ${config.temperature}
Max Tokens: ${config.maxTokens}
Archetype: ${config.archetypeId || 'None'}
Sections: ${config.sections.length}
Hooks to generate: ${config.hooksToGenerate}
Titles to generate: ${config.titlesToGenerate}
Use Bible: ${config.useBible}
Bible Overrides: ${Object.keys(config.bibleOverrides).filter(k => (config.bibleOverrides as Record<string, unknown>)[k]).length}`}
          </pre>
        </div>
      )}

      {/* Reset Button */}
      <div className="form-group pt-4 border-t border-slate-700">
        <button
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
          onClick={() => {
            if (confirm('Are you sure you want to reset advanced settings?')) {
              onChange({
                systemPromptAddition: '',
                debugMode: false,
                rawOutput: false,
              });
            }
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset Advanced Settings
        </button>
      </div>
    </div>
  );
}
