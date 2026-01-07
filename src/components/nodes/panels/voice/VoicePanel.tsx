'use client';

import { useState } from 'react';
import { useNodeConfigStore } from '@/stores/nodeConfigStore';
import { VoiceSelectionTab } from './VoiceSelectionTab';
import { SpeechSettingsTab } from './SpeechSettingsTab';
import { PronunciationTab } from './PronunciationTab';
import { OutputTab } from './OutputTab';

type TabId = 'voice' | 'settings' | 'pronunciation' | 'output';

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'voice', label: 'Voice' },
  { id: 'settings', label: 'Settings' },
  { id: 'pronunciation', label: 'Pronunciation' },
  { id: 'output', label: 'Output' },
];

interface Props {
  className?: string;
}

export function VoicePanel({ className = '' }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('voice');
  const { voiceConfig: config, updateVoiceConfig: onChange } = useNodeConfigStore();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'voice':
        return <VoiceSelectionTab config={config} onChange={onChange} />;
      case 'settings':
        return <SpeechSettingsTab config={config} onChange={onChange} />;
      case 'pronunciation':
        return <PronunciationTab config={config} onChange={onChange} />;
      case 'output':
        return <OutputTab config={config} onChange={onChange} />;
      default:
        return null;
    }
  };

  return (
    <div className={`refined-panel refined-panel-flush ${className}`}>
      {/* Header */}
      <div className="panel-header-bar accent-voice">
        <div className="panel-header-content">
          <h3 className="panel-header-title">Voice Configuration</h3>
          {config.voiceName && (
            <span className="panel-header-badge accent-voice">{config.voiceName}</span>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="panel-tab-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`panel-tab-btn ${activeTab === tab.id ? 'active accent-voice' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="panel-tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
}
