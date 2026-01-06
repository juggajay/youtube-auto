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
    <div className="publish-panel">
      <div className="panel-header">
        <h3>Publish Settings</h3>
        <p className="panel-description">Configure how your video will be published to YouTube</p>
      </div>

      <div className="panel-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`panel-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="panel-content">
        {renderTabContent()}
      </div>
    </div>
  );
}
