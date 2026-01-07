'use client';

import type { ScriptNodeConfig } from '@/stores/nodeConfigStore';

interface Props {
  config: ScriptNodeConfig;
  onChange: (updates: Partial<ScriptNodeConfig>) => void;
}

const SECTION_OPTIONS = [
  { key: 'hook' as const, label: 'Hook', duration: '15-30 sec' },
  { key: 'introduction' as const, label: 'Introduction', duration: '30-60 sec' },
  { key: 'mainContent' as const, label: 'Main Content', duration: 'varies by duration' },
  { key: 'conclusion' as const, label: 'Conclusion', duration: '30-60 sec' },
  { key: 'callToAction' as const, label: 'Call to Action', duration: '15-30 sec' },
];

export function AdvancedTab({ config, onChange }: Props) {
  const handleSectionToggle = (key: keyof typeof config.sections) => {
    onChange({
      sections: {
        ...config.sections,
        [key]: !config.sections[key],
      },
    });
  };

  return (
    <div className="advanced-tab space-y-6">
      {/* Script Structure Section */}
      <div className="panel-section">
        <h4 className="panel-section-title text-sm font-medium text-zinc-300 mb-2">
          Script Structure
        </h4>
        <p className="text-xs text-zinc-500 mb-4">
          Select which sections to include in the generated script:
        </p>
        <div className="space-y-3">
          {SECTION_OPTIONS.map((section) => (
            <label
              key={section.key}
              className="toggle-row flex items-center gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-red-500 focus:ring-red-500 focus:ring-offset-0 focus:ring-offset-zinc-900"
                checked={config.sections[section.key]}
                onChange={() => handleSectionToggle(section.key)}
              />
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm text-zinc-200 group-hover:text-white transition-colors">
                  {section.label}
                </span>
                <span className="text-xs text-zinc-500">
                  {section.duration}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Custom Instructions Section */}
      <div className="panel-section">
        <h4 className="panel-section-title text-sm font-medium text-zinc-300 mb-2">
          Custom Instructions
        </h4>
        <p className="text-xs text-zinc-500 mb-3">
          Additional guidance for the AI:
        </p>
        <textarea
          className="w-full h-32 bg-zinc-800 text-zinc-100 text-sm rounded-lg px-3 py-2 border border-zinc-700 focus:border-red-500 focus:ring-0 focus:outline-none resize-none placeholder-zinc-600"
          value={config.customInstructions || ''}
          onChange={(e) => onChange({ customInstructions: e.target.value })}
          placeholder='e.g., "Include a controversial take in the middle section" or "Mention competitor X"'
        />
      </div>

      {/* Output Options Section */}
      <div className="panel-section">
        <h4 className="panel-section-title text-sm font-medium text-zinc-300 mb-2">
          Output Options
        </h4>
        <div className="space-y-3">
          <label className="toggle-row flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-red-500 focus:ring-red-500 focus:ring-offset-0 focus:ring-offset-zinc-900"
              checked={config.includeTimestamps}
              onChange={(e) => onChange({ includeTimestamps: e.target.checked })}
            />
            <span className="text-sm text-zinc-200 group-hover:text-white transition-colors">
              Include timestamps in script
            </span>
          </label>

          <label className="toggle-row flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-red-500 focus:ring-red-500 focus:ring-offset-0 focus:ring-offset-zinc-900"
              checked={config.includeSectionHeaders}
              onChange={(e) => onChange({ includeSectionHeaders: e.target.checked })}
            />
            <span className="text-sm text-zinc-200 group-hover:text-white transition-colors">
              Generate section headers
            </span>
          </label>

          <label className="toggle-row flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-red-500 focus:ring-red-500 focus:ring-offset-0 focus:ring-offset-zinc-900"
              checked={config.includeBrollSuggestions}
              onChange={(e) => onChange({ includeBrollSuggestions: e.target.checked })}
            />
            <span className="text-sm text-zinc-200 group-hover:text-white transition-colors">
              Include B-roll suggestions
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
