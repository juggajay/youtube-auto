'use client';

import { useState, useEffect, useCallback } from 'react';
import { ToneSliders, ToneValues } from './ToneSliders';
import { VocabularySection } from './VocabularySection';
import { ExampleScriptsSection, ExampleScript } from './ExampleScriptsSection';
import { ContentDefaultsSection } from './ContentDefaultsSection';
import { createClient } from '@/lib/db/client';
import { useAuth } from '@/components/providers/AuthProvider';

// Database shape for channel_bibles table
interface ChannelBibleDB {
  id: string;
  user_id: string;
  channel_name: string | null;
  niche: string | null;
  target_audience: string | null;
  tone_casual_professional: number;
  tone_humor_level: number;
  tone_energy_level: number;
  tone_educational_entertainment: number;
  preferred_terms: string[] | null;
  banned_words: string[] | null;
  signature_phrases: string[] | null;
  typical_length_minutes: number;
  hook_style: 'question' | 'statistic' | 'story' | 'controversy' | 'promise' | null;
  cta_approach: string | null;
  example_scripts: ExampleScript[] | null;
  primary_color: string | null;
  secondary_color: string | null;
  font_preference: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

type TabId = 'identity' | 'tone' | 'vocabulary' | 'defaults' | 'examples';

const TABS: { id: TabId; label: string; icon: string }[] = [
  {
    id: 'identity',
    label: 'Identity',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z',
  },
  {
    id: 'tone',
    label: 'Tone & Voice',
    icon: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z',
  },
  {
    id: 'vocabulary',
    label: 'Vocabulary',
    icon: 'M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z',
  },
  {
    id: 'defaults',
    label: 'Defaults',
    icon: 'M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
  },
  {
    id: 'examples',
    label: 'Example Scripts',
    icon: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
  },
];

const getDefaultBible = (userId: string): ChannelBibleDB => ({
  id: '',
  user_id: userId,
  channel_name: '',
  niche: '',
  target_audience: '',
  tone_casual_professional: 50,
  tone_humor_level: 50,
  tone_energy_level: 50,
  tone_educational_entertainment: 50,
  preferred_terms: [],
  banned_words: [],
  signature_phrases: [],
  typical_length_minutes: 10,
  hook_style: 'question',
  cta_approach: '',
  example_scripts: [],
  primary_color: '#FF0000',
  secondary_color: '#FFFFFF',
  font_preference: '',
  logo_url: '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export function ChannelBibleEditor() {
  const { user } = useAuth();
  const [bible, setBible] = useState<ChannelBibleDB | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('identity');
  const [hasChanges, setHasChanges] = useState(false);

  const loadBible = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('channel_bibles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading channel bible:', error);
    }

    if (data) {
      setBible(data as ChannelBibleDB);
    } else {
      // Initialize empty bible for new users
      setBible(getDefaultBible(user.id));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadBible();
  }, [loadBible]);

  const saveBible = async () => {
    if (!bible || !user) return;

    setSaving(true);
    setSaveMessage(null);

    const supabase = createClient();
    const dataToSave = {
      ...bible,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    // Remove id if it's empty (for new records)
    if (!dataToSave.id) {
      delete (dataToSave as Partial<ChannelBibleDB>).id;
    }

    const { data, error } = await supabase
      .from('channel_bibles')
      .upsert(dataToSave, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Error saving channel bible:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save changes. Please try again.' });
    } else {
      setBible(data as ChannelBibleDB);
      setHasChanges(false);
      setSaveMessage({ type: 'success', text: 'Changes saved successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    }

    setSaving(false);
  };

  const updateBible = <K extends keyof ChannelBibleDB>(key: K, value: ChannelBibleDB[K]) => {
    if (!bible) return;
    setBible({ ...bible, [key]: value });
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <span>Loading channel bible...</span>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            padding: 48px;
            color: var(--text-secondary, #888);
          }
          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid var(--border, #333);
            border-top-color: var(--accent, #ff0000);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="no-user-container">
        <p>Please sign in to edit your channel bible.</p>
        <style jsx>{`
          .no-user-container {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 48px;
            color: var(--text-secondary, #888);
          }
        `}</style>
      </div>
    );
  }

  if (!bible) return null;

  return (
    <div className="channel-bible-editor">
      {/* Header */}
      <div className="editor-header">
        <div className="header-content">
          <h2>Channel Bible</h2>
          <p>Define your channel's identity, voice, and style. The AI uses this for every script.</p>
        </div>
        <div className="header-actions">
          {saveMessage && (
            <span className={`save-message ${saveMessage.type}`}>
              {saveMessage.text}
            </span>
          )}
          {hasChanges && !saving && (
            <span className="unsaved-indicator">Unsaved changes</span>
          )}
          <button
            className="btn btn-primary"
            onClick={saveBible}
            disabled={saving || !hasChanges}
          >
            {saving ? (
              <>
                <span className="btn-spinner" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="editor-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''} ${tab.id === 'examples' ? 'tab-critical' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d={tab.icon} />
            </svg>
            <span>{tab.label}</span>
            {tab.id === 'examples' && (!bible.example_scripts || bible.example_scripts.length === 0) && (
              <span className="tab-badge">!</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="editor-content">
        {activeTab === 'identity' && (
          <div className="tab-content">
            <div className="form-group">
              <label htmlFor="channel-name">
                <strong>Channel Name</strong>
              </label>
              <input
                id="channel-name"
                type="text"
                value={bible.channel_name || ''}
                onChange={(e) => updateBible('channel_name', e.target.value)}
                placeholder="Your channel name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="niche">
                <strong>Niche</strong>
                <span className="label-hint">What topics does your channel cover?</span>
              </label>
              <input
                id="niche"
                type="text"
                value={bible.niche || ''}
                onChange={(e) => updateBible('niche', e.target.value)}
                placeholder="e.g., Tech Reviews, Personal Finance, Fitness, Gaming"
              />
            </div>

            <div className="form-group">
              <label htmlFor="target-audience">
                <strong>Target Audience</strong>
                <span className="label-hint">Describe your ideal viewer in detail</span>
              </label>
              <textarea
                id="target-audience"
                value={bible.target_audience || ''}
                onChange={(e) => updateBible('target_audience', e.target.value)}
                placeholder="Describe your ideal viewer...

Example: Tech-savvy millennials (25-35) who want to stay up-to-date with the latest gadgets but don't have time for deep research. They prefer quick, honest reviews with practical advice over spec comparisons."
                rows={5}
              />
            </div>

            {/* Brand Colors */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="primary-color">
                  <strong>Primary Color</strong>
                  <span className="label-hint">Main brand color</span>
                </label>
                <div className="color-input-wrapper">
                  <input
                    id="primary-color"
                    type="color"
                    value={bible.primary_color || '#FF0000'}
                    onChange={(e) => updateBible('primary_color', e.target.value)}
                  />
                  <input
                    type="text"
                    value={bible.primary_color || '#FF0000'}
                    onChange={(e) => updateBible('primary_color', e.target.value)}
                    placeholder="#FF0000"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="secondary-color">
                  <strong>Secondary Color</strong>
                  <span className="label-hint">Accent color</span>
                </label>
                <div className="color-input-wrapper">
                  <input
                    id="secondary-color"
                    type="color"
                    value={bible.secondary_color || '#FFFFFF'}
                    onChange={(e) => updateBible('secondary_color', e.target.value)}
                  />
                  <input
                    type="text"
                    value={bible.secondary_color || '#FFFFFF'}
                    onChange={(e) => updateBible('secondary_color', e.target.value)}
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tone' && (
          <ToneSliders
            values={{
              casualProfessional: bible.tone_casual_professional,
              humorLevel: bible.tone_humor_level,
              energyLevel: bible.tone_energy_level,
              educationalEntertainment: bible.tone_educational_entertainment,
            }}
            onChange={(values: ToneValues) => {
              setBible({
                ...bible,
                tone_casual_professional: values.casualProfessional,
                tone_humor_level: values.humorLevel,
                tone_energy_level: values.energyLevel,
                tone_educational_entertainment: values.educationalEntertainment,
              });
              setHasChanges(true);
            }}
          />
        )}

        {activeTab === 'vocabulary' && (
          <VocabularySection
            preferredTerms={bible.preferred_terms || []}
            bannedWords={bible.banned_words || []}
            signaturePhrases={bible.signature_phrases || []}
            onChange={(field, values) => {
              const keyMap = {
                preferredTerms: 'preferred_terms',
                bannedWords: 'banned_words',
                signaturePhrases: 'signature_phrases',
              } as const;
              updateBible(keyMap[field], values);
            }}
          />
        )}

        {activeTab === 'defaults' && (
          <ContentDefaultsSection
            values={{
              typicalLengthMinutes: bible.typical_length_minutes,
              hookStyle: bible.hook_style || '',
              ctaApproach: bible.cta_approach || '',
            }}
            onChange={(values) => {
              setBible({
                ...bible,
                typical_length_minutes: values.typicalLengthMinutes,
                hook_style: values.hookStyle || null,
                cta_approach: values.ctaApproach,
              });
              setHasChanges(true);
            }}
          />
        )}

        {activeTab === 'examples' && (
          <ExampleScriptsSection
            scripts={bible.example_scripts || []}
            onChange={(scripts) => updateBible('example_scripts', scripts)}
          />
        )}
      </div>

      <style jsx>{`
        .channel-bible-editor {
          display: flex;
          flex-direction: column;
          gap: 24px;
          max-width: 900px;
          margin: 0 auto;
          padding: 24px;
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          flex-wrap: wrap;
        }

        .header-content h2 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          color: var(--text-primary, #fff);
        }

        .header-content p {
          margin: 8px 0 0 0;
          font-size: 14px;
          color: var(--text-secondary, #888);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .save-message {
          font-size: 14px;
          padding: 6px 12px;
          border-radius: 6px;
        }

        .save-message.success {
          color: #10b981;
          background: rgba(16, 185, 129, 0.1);
        }

        .save-message.error {
          color: #ff4444;
          background: rgba(255, 68, 68, 0.1);
        }

        .unsaved-indicator {
          font-size: 13px;
          color: var(--accent, #ff0000);
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-primary {
          background: var(--accent, #ff0000);
          border: none;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--accent-light, #ff3333);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .editor-tabs {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: var(--bg-surface, #1a1a1a);
          border-radius: 12px;
          border: 1px solid var(--border, #333);
          overflow-x: auto;
        }

        .tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: transparent;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          color: var(--text-secondary, #888);
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
          position: relative;
        }

        .tab:hover {
          color: var(--text-primary, #fff);
          background: var(--bg-hover, #2a2a2a);
        }

        .tab.active {
          color: var(--text-primary, #fff);
          background: var(--bg-hover, #2a2a2a);
        }

        .tab.tab-critical.active,
        .tab.tab-critical:hover {
          color: var(--accent, #ff0000);
        }

        .tab svg {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        .tab-badge {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent, #ff0000);
          color: white;
          font-size: 11px;
          font-weight: 700;
          border-radius: 50%;
        }

        .editor-content {
          background: var(--bg-secondary, #0f0f0f);
          border-radius: 16px;
          padding: 24px;
          min-height: 400px;
        }

        .tab-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .form-group label strong {
          font-size: 14px;
          color: var(--text-primary, #fff);
        }

        .label-hint {
          font-size: 12px;
          color: var(--text-secondary, #888);
          font-weight: normal;
        }

        .form-group input[type="text"],
        .form-group textarea {
          width: 100%;
          padding: 12px 14px;
          background: var(--bg-surface, #1a1a1a);
          border: 1px solid var(--border, #333);
          border-radius: 8px;
          font-size: 14px;
          color: var(--text-primary, #fff);
          transition: border-color 0.15s ease;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--accent, #ff0000);
        }

        .form-group input::placeholder,
        .form-group textarea::placeholder {
          color: var(--text-secondary, #888);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 100px;
          line-height: 1.6;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .color-input-wrapper {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .color-input-wrapper input[type="color"] {
          width: 44px;
          height: 44px;
          padding: 0;
          border: 2px solid var(--border, #333);
          border-radius: 8px;
          cursor: pointer;
          background: transparent;
        }

        .color-input-wrapper input[type="color"]::-webkit-color-swatch-wrapper {
          padding: 2px;
        }

        .color-input-wrapper input[type="color"]::-webkit-color-swatch {
          border-radius: 4px;
          border: none;
        }

        .color-input-wrapper input[type="text"] {
          flex: 1;
        }
      `}</style>
    </div>
  );
}
