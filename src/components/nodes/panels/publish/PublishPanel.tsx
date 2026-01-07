'use client';

import { useState, useCallback } from 'react';
import { useNodeConfigStore, type PublishNodeConfig } from '@/stores/nodeConfigStore';
import { PlatformTab } from './PlatformTab';
import { MetadataTab } from './MetadataTab';
import { ScheduleTab } from './ScheduleTab';
import { AdvancedTab } from './AdvancedTab';

interface Props {
  className?: string;
}

type TabId = 'platform' | 'metadata' | 'schedule' | 'advanced';

const TABS: { id: TabId; label: string }[] = [
  { id: 'platform', label: 'Platform' },
  { id: 'metadata', label: 'Metadata' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'advanced', label: 'Advanced' },
];

export function PublishPanel({ className = '' }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('platform');
  const { publishConfig: config, updatePublishConfig } = useNodeConfigStore();

  const handleChange = useCallback(
    (updates: Partial<PublishNodeConfig>) => {
      updatePublishConfig(updates);
    },
    [updatePublishConfig]
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'platform':
        return <PlatformTab config={config} onChange={handleChange} />;
      case 'metadata':
        return <MetadataTab config={config} onChange={handleChange} />;
      case 'schedule':
        return <ScheduleTab config={config} onChange={handleChange} />;
      case 'advanced':
        return <AdvancedTab config={config} onChange={handleChange} />;
      default:
        return null;
    }
  };

  return (
    <div className={`refined-panel ${className}`}>
      {/* Header */}
      <div className="panel-header-refined">
        <div className="panel-header-icon" style={{ background: 'rgba(255, 0, 0, 0.15)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--node-publish)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <div className="panel-header-text">
          <h3 className="panel-header-title">Publish Settings</h3>
          <p className="panel-header-subtitle">Configure how your video will be published to YouTube</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="panel-tabs-refined">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`panel-tab-refined ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{ '--accent-color': 'var(--node-publish)' } as React.CSSProperties}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="panel-tab-content">
        {renderTabContent()}
      </div>

      <style jsx>{`
        .panel-header-refined {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border);
        }

        .panel-header-icon {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .panel-header-text {
          flex: 1;
        }

        .panel-header-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 4px 0;
        }

        .panel-header-subtitle {
          font-size: 13px;
          color: var(--text-muted);
          margin: 0;
          line-height: 1.4;
        }

        .panel-tabs-refined {
          display: flex;
          gap: 4px;
          border-bottom: 1px solid var(--border);
          margin: 0 -24px;
          padding: 0 24px;
        }

        .panel-tab-refined {
          padding: 12px 16px;
          background: none;
          border: none;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-muted);
          cursor: pointer;
          position: relative;
          transition: color 0.15s ease;
        }

        .panel-tab-refined:hover {
          color: var(--text-secondary);
        }

        .panel-tab-refined.active {
          color: var(--text-primary);
        }

        .panel-tab-refined.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--accent-color, var(--node-publish));
          border-radius: 1px 1px 0 0;
        }

        .panel-tab-content {
          padding-top: 4px;
        }
      `}</style>
    </div>
  );
}
