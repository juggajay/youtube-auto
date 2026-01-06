'use client';

import { useState, useCallback } from 'react';
import { useNodeConfigStore, type AssemblyNodeConfig } from '@/stores/nodeConfigStore';
import { VisualSourceTab } from './VisualSourceTab';
import { StructureTab } from './StructureTab';
import { CaptionsTab } from './CaptionsTab';
import { MusicTab } from './MusicTab';
import { OutputTab } from './OutputTab';

type TabId = 'visual' | 'structure' | 'captions' | 'music' | 'output';

const TABS: { id: TabId; label: string }[] = [
  { id: 'visual', label: 'Visual Source' },
  { id: 'structure', label: 'Structure' },
  { id: 'captions', label: 'Captions' },
  { id: 'music', label: 'Music' },
  { id: 'output', label: 'Output' },
];

const TAB_ICONS: Record<TabId, React.ReactNode> = {
  visual: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="17" x2="22" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
    </svg>
  ),
  structure: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  captions: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <line x1="6" y1="12" x2="18" y2="12" />
      <line x1="6" y1="16" x2="14" y2="16" />
    </svg>
  ),
  music: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  output: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
};

interface Props {
  className?: string;
}

export function AssemblyPanel({ className = '' }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('visual');
  const { assemblyConfig: config, updateAssemblyConfig } = useNodeConfigStore();

  const handleChange = useCallback(
    (updates: Partial<AssemblyNodeConfig>) => {
      updateAssemblyConfig(updates);
    },
    [updateAssemblyConfig]
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'visual':
        return <VisualSourceTab config={config} onChange={handleChange} />;
      case 'structure':
        return <StructureTab config={config} onChange={handleChange} />;
      case 'captions':
        return <CaptionsTab config={config} onChange={handleChange} />;
      case 'music':
        return <MusicTab config={config} onChange={handleChange} />;
      case 'output':
        return <OutputTab config={config} onChange={handleChange} />;
      default:
        return null;
    }
  };

  const { resetConfig } = useNodeConfigStore();

  return (
    <div className="assembly-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="M23 7l-7 5 7 5V7z" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          <span>Assembly</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="panel-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`panel-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            {TAB_ICONS[tab.id]}
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="panel-content" role="tabpanel">
        {renderTabContent()}
      </div>

      {/* Panel Footer */}
      <div className="panel-footer">
        <button className="btn btn-secondary" onClick={() => resetConfig('assembly')}>
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}
