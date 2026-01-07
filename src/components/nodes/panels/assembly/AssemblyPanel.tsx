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
  { id: 'visual', label: 'Visual' },
  { id: 'structure', label: 'Structure' },
  { id: 'captions', label: 'Captions' },
  { id: 'music', label: 'Music' },
  { id: 'output', label: 'Output' },
];

interface Props {
  className?: string;
}

export function AssemblyPanel({ className = '' }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('visual');
  const { assemblyConfig: config, updateAssemblyConfig, resetConfig } = useNodeConfigStore();

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

  return (
    <div className={`flex flex-col h-full bg-[var(--bg-surface)] ${className}`}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'var(--node-assembly)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg
            style={{ width: '16px', height: '16px', color: 'white' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path d="M23 7l-7 5 7 5V7z" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        </div>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Assembly
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            Configure video assembly
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        padding: '0 12px',
        overflowX: 'auto',
      }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            aria-selected={activeTab === tab.id}
            role="tab"
            style={{
              padding: '12px 14px',
              fontSize: '13px',
              fontWeight: 500,
              color: activeTab === tab.id ? 'var(--node-assembly)' : 'var(--text-muted)',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--node-assembly)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              marginBottom: '-1px',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div role="tabpanel" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {renderTabContent()}
      </div>

      {/* Footer */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-elevated)',
      }}>
        <button
          className="panel-btn panel-btn-secondary"
          style={{ width: '100%' }}
          onClick={() => resetConfig('assembly')}
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}
