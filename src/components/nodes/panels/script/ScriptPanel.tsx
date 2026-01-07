'use client';

import { useState } from 'react';
import { useNodeConfigStore, type ScriptNodeConfig } from '@/stores/nodeConfigStore';
import { ContentTab } from './ContentTab';
import { GenerationTab } from './GenerationTab';
import { AdvancedTab } from './AdvancedTab';

const TABS = [
  { id: 'content', label: 'Content' },
  { id: 'generation', label: 'Generation' },
  { id: 'advanced', label: 'Advanced' },
] as const;

type TabId = typeof TABS[number]['id'];

interface ScriptPanelProps {
  className?: string;
}

export function ScriptPanel({ className = '' }: ScriptPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('content');
  const { scriptConfig, updateScriptConfig } = useNodeConfigStore();

  const updateConfig = (updates: Partial<ScriptNodeConfig>) => {
    updateScriptConfig(updates);
  };

  return (
    <div className={`node-panel script-panel bg-zinc-950 rounded-lg border border-zinc-800 ${className}`}>
      {/* Panel Header */}
      <div className="panel-header flex items-center gap-3 p-4 border-b border-zinc-800">
        <div className="panel-title flex items-center gap-2">
          <span className="node-icon w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </span>
          <h3 className="text-lg font-semibold text-white">Script Node</h3>
        </div>
      </div>

      {/* Tab Navigation - Text only, no icons */}
      <div className="panel-tabs flex border-b border-zinc-800 bg-zinc-900/50">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`panel-tab px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors
              ${activeTab === tab.id
                ? 'text-red-400 border-b-2 border-red-500 bg-zinc-900'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
              }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="panel-content p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
        {activeTab === 'content' && (
          <ContentTab config={scriptConfig} onChange={updateConfig} />
        )}
        {activeTab === 'generation' && (
          <GenerationTab config={scriptConfig} onChange={updateConfig} />
        )}
        {activeTab === 'advanced' && (
          <AdvancedTab config={scriptConfig} onChange={updateConfig} />
        )}
      </div>
    </div>
  );
}
