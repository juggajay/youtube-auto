'use client';

import { useState } from 'react';
import { useNodeConfigStore, type VoiceNodeConfig } from '@/stores/nodeConfigStore';
import { VoiceSelectionTab } from './VoiceSelectionTab';
import { SpeechSettingsTab } from './SpeechSettingsTab';
import { PronunciationTab } from './PronunciationTab';
import { OutputTab } from './OutputTab';

type TabId = 'voice' | 'speech' | 'pronunciation' | 'output';

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'voice', label: 'Voice Selection' },
  { id: 'speech', label: 'Speech Settings' },
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
      case 'speech':
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
    <div className="voice-panel">
      <div className="panel-header">
        <h3>Voice Configuration</h3>
        {config.voiceName && (
          <span className="selected-voice">Selected: {config.voiceName}</span>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="tab-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
}
