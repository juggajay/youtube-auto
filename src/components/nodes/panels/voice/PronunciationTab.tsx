'use client';

import { useState } from 'react';
import type { VoiceNodeConfig } from '@/types/nodes/voice';

interface Props {
  config: VoiceNodeConfig;
  onChange: (updates: Partial<VoiceNodeConfig>) => void;
}

const COMMON_SUGGESTIONS = [
  { word: 'API', pronunciation: 'A-P-I' },
  { word: 'SQL', pronunciation: 'sequel' },
  { word: 'OAuth', pronunciation: 'oh-auth' },
  { word: 'async', pronunciation: 'a-sink' },
  { word: 'npm', pronunciation: 'N-P-M' },
  { word: 'AWS', pronunciation: 'A-W-S' },
  { word: 'CLI', pronunciation: 'C-L-I' },
  { word: 'GUI', pronunciation: 'goo-ee' },
];

export function PronunciationTab({ config, onChange }: Props) {
  const [newWord, setNewWord] = useState('');
  const [newPronunciation, setNewPronunciation] = useState('');

  const addEntry = () => {
    if (!newWord.trim() || !newPronunciation.trim()) return;

    const entry = {
      word: newWord.trim(),
      pronunciation: newPronunciation.trim(),
    };

    onChange({
      pronunciationDict: [...config.pronunciationDict, entry],
    });
    setNewWord('');
    setNewPronunciation('');
  };

  const removeEntry = (index: number) => {
    onChange({
      pronunciationDict: config.pronunciationDict.filter((_, i) => i !== index),
    });
  };

  const addSuggestion = (suggestion: { word: string; pronunciation: string }) => {
    if (config.pronunciationDict.some(e => e.word === suggestion.word)) return;
    onChange({
      pronunciationDict: [...config.pronunciationDict, suggestion],
    });
  };

  const availableSuggestions = COMMON_SUGGESTIONS.filter(
    s => !config.pronunciationDict.some(e => e.word === s.word)
  );

  return (
    <div className="panel-section">
      <p className="panel-section-subtitle">
        Define custom pronunciations for brand names, technical terms, or words the AI mispronounces.
      </p>

      {/* Pronunciation Table */}
      {config.pronunciationDict.length > 0 ? (
        <div className="panel-table-wrapper">
          <table className="panel-table">
            <thead>
              <tr>
                <th>Word</th>
                <th>Pronunciation</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {config.pronunciationDict.map((entry, i) => (
                <tr key={i}>
                  <td className="panel-table-cell-primary">{entry.word}</td>
                  <td className="panel-table-cell-mono">{entry.pronunciation}</td>
                  <td className="panel-table-cell-action">
                    <button
                      className="panel-btn-icon panel-btn-icon-danger"
                      onClick={() => removeEntry(i)}
                      title="Remove"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="panel-empty-state">
          No custom pronunciations yet. Add words the AI might mispronounce.
        </div>
      )}

      {/* Add New Entry */}
      <div className="panel-section">
        <h4 className="panel-section-title">Add Entry</h4>
        <div className="panel-form-row">
          <input
            type="text"
            className="panel-input panel-input-sm"
            placeholder="Word (e.g., GIF)"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
          />
          <input
            type="text"
            className="panel-input panel-input-sm"
            placeholder="Pronunciation (e.g., JIF)"
            value={newPronunciation}
            onChange={(e) => setNewPronunciation(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addEntry()}
          />
          <button
            className="panel-btn panel-btn-primary panel-btn-sm"
            onClick={addEntry}
            disabled={!newWord.trim() || !newPronunciation.trim()}
          >
            Add
          </button>
        </div>
        <p className="panel-hint">Use phonetic spelling or IPA notation. Examples: "gif - jif", "nginx - engine-x"</p>
      </div>

      {/* Common Suggestions */}
      {availableSuggestions.length > 0 && (
        <div className="panel-section">
          <h4 className="panel-section-title">Common Tech Terms</h4>
          <div className="panel-chip-group">
            {availableSuggestions.map((suggestion) => (
              <button
                key={suggestion.word}
                className="panel-chip panel-chip-clickable"
                onClick={() => addSuggestion(suggestion)}
              >
                <span className="panel-chip-add">+</span>
                {suggestion.word}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
