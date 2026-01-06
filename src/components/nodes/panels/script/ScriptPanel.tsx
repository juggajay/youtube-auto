'use client';

import { useState } from 'react';
import { useNodeConfigStore, type ScriptNodeConfig } from '@/stores/nodeConfigStore';
import { ArchetypeTab } from './ArchetypeTab';
import { StructureTab } from './StructureTab';
import { HooksTab } from './HooksTab';
import { TitlesTab } from './TitlesTab';
import { DescriptionTab } from './DescriptionTab';
import { TagsTab } from './TagsTab';
import { AIModelTab } from './AIModelTab';
import { BibleOverrideTab } from './BibleOverrideTab';
import { AdvancedTab } from './AdvancedTab';

const TABS = [
  { id: 'archetype', label: 'Format', icon: 'format' },
  { id: 'structure', label: 'Structure', icon: 'structure' },
  { id: 'hooks', label: 'Hooks', icon: 'hook' },
  { id: 'titles', label: 'Titles', icon: 'title' },
  { id: 'description', label: 'Description', icon: 'description' },
  { id: 'tags', label: 'Tags', icon: 'tag' },
  { id: 'model', label: 'AI Model', icon: 'model' },
  { id: 'bible', label: 'Bible', icon: 'bible' },
  { id: 'advanced', label: 'Advanced', icon: 'advanced' },
] as const;

type TabId = typeof TABS[number]['id'];

interface ScriptPanelProps {
  className?: string;
}

export function ScriptPanel({ className = '' }: ScriptPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('archetype');
  const { scriptConfig, updateScriptConfig } = useNodeConfigStore();

  const updateConfig = (updates: Partial<ScriptNodeConfig>) => {
    updateScriptConfig(updates);
  };

  const getTabIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      format: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      structure: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
      hook: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      description: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      tag: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      model: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      bible: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      advanced: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    };
    return icons[iconName] || null;
  };

  return (
    <div className={`node-panel script-panel bg-slate-900 rounded-lg border border-slate-700 ${className}`}>
      {/* Panel Header */}
      <div className="panel-header flex items-center gap-3 p-4 border-b border-slate-700">
        <div className="panel-title flex items-center gap-2">
          <span className="node-icon w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </span>
          <h3 className="text-lg font-semibold text-white">Script Generator</h3>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="panel-tabs flex overflow-x-auto border-b border-slate-700 bg-slate-800/50">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`panel-tab flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors
              ${activeTab === tab.id
                ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-800'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
          >
            <span className="tab-icon">{getTabIcon(tab.icon)}</span>
            <span className="tab-label hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="panel-content p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
        {activeTab === 'archetype' && (
          <ArchetypeTab config={scriptConfig} onChange={updateConfig} />
        )}
        {activeTab === 'structure' && (
          <StructureTab config={scriptConfig} onChange={updateConfig} />
        )}
        {activeTab === 'hooks' && (
          <HooksTab config={scriptConfig} onChange={updateConfig} />
        )}
        {activeTab === 'titles' && (
          <TitlesTab config={scriptConfig} onChange={updateConfig} />
        )}
        {activeTab === 'description' && (
          <DescriptionTab config={scriptConfig} onChange={updateConfig} />
        )}
        {activeTab === 'tags' && (
          <TagsTab config={scriptConfig} onChange={updateConfig} />
        )}
        {activeTab === 'model' && (
          <AIModelTab config={scriptConfig} onChange={updateConfig} />
        )}
        {activeTab === 'bible' && (
          <BibleOverrideTab config={scriptConfig} onChange={updateConfig} />
        )}
        {activeTab === 'advanced' && (
          <AdvancedTab config={scriptConfig} onChange={updateConfig} />
        )}
      </div>
    </div>
  );
}
