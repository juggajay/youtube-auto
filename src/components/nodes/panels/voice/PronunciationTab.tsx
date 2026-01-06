'use client';

import { useState } from 'react';
import type { VoiceNodeConfig } from '@/types/nodes/voice';

interface Props {
  config: VoiceNodeConfig;
  onChange: (updates: Partial<VoiceNodeConfig>) => void;
}

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

  return (
    <div className="pronunciation-tab">
      <h4>Pronunciation Dictionary</h4>
      <p className="hint">
        Define custom pronunciations for brand names, technical terms, or words the AI mispronounces.
      </p>

      {/* Existing Entries */}
      <div className="pronunciation-list">
        {config.pronunciationDict.length === 0 ? (
          <div className="empty-state">
            No custom pronunciations yet. Add words the AI might mispronounce.
          </div>
        ) : (
          <table className="pronunciation-table">
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
                  <td>{entry.word}</td>
                  <td className="pronunciation">{entry.pronunciation}</td>
                  <td>
                    <button className="btn-icon" onClick={() => removeEntry(i)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add New */}
      <div className="add-pronunciation">
        <h5>Add Entry</h5>
        <div className="add-form">
          <input
            type="text"
            placeholder="Word (e.g., GIF)"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
          />
          <input
            type="text"
            placeholder="Pronunciation (e.g., JIF or /dʒɪf/)"
            value={newPronunciation}
            onChange={(e) => setNewPronunciation(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addEntry()}
          />
          <button className="btn btn-primary btn-sm" onClick={addEntry}>Add</button>
        </div>
        <p className="hint">
          Use phonetic spelling or IPA notation. Examples: "gif - jif", "nginx - engine-x"
        </p>
      </div>

      {/* Common Suggestions */}
      <div className="suggestions">
        <h5>Common Tech Terms</h5>
        <div className="suggestion-chips">
          {[
            { word: 'API', pronunciation: 'A-P-I' },
            { word: 'SQL', pronunciation: 'sequel' },
            { word: 'OAuth', pronunciation: 'oh-auth' },
            { word: 'async', pronunciation: 'a-sink' },
          ].filter(s => !config.pronunciationDict.some(e => e.word === s.word)).map((suggestion) => (
            <button
              key={suggestion.word}
              className="suggestion-chip"
              onClick={() => onChange({
                pronunciationDict: [...config.pronunciationDict, suggestion],
              })}
            >
              + {suggestion.word}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
