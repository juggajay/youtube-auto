'use client';

import { useState } from 'react';

export interface ExampleScript {
  id: string;
  title: string;
  script: string;
  notes?: string;
}

interface Props {
  scripts: ExampleScript[];
  onChange: (scripts: ExampleScript[]) => void;
}

export function ExampleScriptsSection({ scripts, onChange }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newScript, setNewScript] = useState({ title: '', script: '', notes: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  const addScript = () => {
    if (!newScript.title || !newScript.script) return;

    const script: ExampleScript = {
      id: crypto.randomUUID(),
      ...newScript,
    };
    onChange([...scripts, script]);
    setNewScript({ title: '', script: '', notes: '' });
    setShowAddForm(false);
  };

  const removeScript = (id: string) => {
    onChange(scripts.filter(s => s.id !== id));
  };

  const updateScript = (id: string, updates: Partial<ExampleScript>) => {
    onChange(scripts.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  return (
    <div className="example-scripts-section">
      <div className="section-header">
        <div>
          <h3>Example Scripts</h3>
          <p className="hint critical">
            CRITICAL: Paste 2-3 of your best scripts. The AI learns your voice from these examples, not descriptions.
          </p>
        </div>
        {scripts.length > 0 && !showAddForm && (
          <button className="btn btn-secondary" onClick={() => setShowAddForm(true)}>
            + Add Script
          </button>
        )}
      </div>

      {scripts.length === 0 && !showAddForm && (
        <div className="empty-state">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <p className="empty-title">No example scripts yet.</p>
          <p className="empty-desc">Adding your best scripts dramatically improves AI output quality.</p>
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            Add Your First Script
          </button>
        </div>
      )}

      {/* Script List */}
      <div className="scripts-list">
        {scripts.map((script) => (
          <div key={script.id} className="script-card">
            {editingId === script.id ? (
              // Edit Mode
              <div className="script-edit">
                <input
                  type="text"
                  value={script.title}
                  onChange={(e) => updateScript(script.id, { title: e.target.value })}
                  placeholder="Script title"
                  className="input"
                />
                <textarea
                  value={script.script}
                  onChange={(e) => updateScript(script.id, { script: e.target.value })}
                  rows={12}
                  placeholder="Paste your script here..."
                  className="textarea"
                />
                <input
                  type="text"
                  value={script.notes || ''}
                  onChange={(e) => updateScript(script.id, { notes: e.target.value })}
                  placeholder="Notes (e.g., 'This one went viral', 'Great hook')"
                  className="input"
                />
                <div className="edit-actions">
                  <button className="btn btn-primary" onClick={() => setEditingId(null)}>
                    Done Editing
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="script-view">
                <div className="script-header">
                  <h4>{script.title}</h4>
                  <div className="script-actions">
                    <button className="btn-icon" onClick={() => setEditingId(script.id)} title="Edit">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button className="btn-icon btn-icon-danger" onClick={() => removeScript(script.id)} title="Delete">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
                <pre className="script-preview">{script.script.slice(0, 500)}{script.script.length > 500 ? '...' : ''}</pre>
                {script.notes && <p className="script-notes">{script.notes}</p>}
                <span className="word-count">{getWordCount(script.script)} words</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="script-add-form">
          <h4>Add Example Script</h4>
          <input
            type="text"
            value={newScript.title}
            onChange={(e) => setNewScript({ ...newScript, title: e.target.value })}
            placeholder="Script title (e.g., 'Why I Quit My Job')"
            className="input"
          />
          <textarea
            value={newScript.script}
            onChange={(e) => setNewScript({ ...newScript, script: e.target.value })}
            rows={12}
            placeholder="Paste the full script here. Include hooks, transitions, CTAs - everything."
            className="textarea"
          />
          <input
            type="text"
            value={newScript.notes}
            onChange={(e) => setNewScript({ ...newScript, notes: e.target.value })}
            placeholder="Notes about this script (optional)"
            className="input"
          />
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={addScript}
              disabled={!newScript.title || !newScript.script}
            >
              Add Script
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .example-scripts-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }

        .section-header h3 {
          margin: 0;
          font-size: 18px;
          color: var(--text-primary, #fff);
        }

        .section-header .hint {
          margin: 4px 0 0 0;
          font-size: 14px;
          color: var(--text-secondary, #888);
        }

        .section-header .hint.critical {
          color: var(--accent, #ff0000);
          font-weight: 500;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          background: var(--bg-surface, #1a1a1a);
          border-radius: 12px;
          border: 2px dashed var(--border, #333);
          text-align: center;
        }

        .empty-icon {
          width: 64px;
          height: 64px;
          margin-bottom: 16px;
          color: var(--text-secondary, #888);
        }

        .empty-icon svg {
          width: 100%;
          height: 100%;
        }

        .empty-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary, #fff);
        }

        .empty-desc {
          margin: 8px 0 24px 0;
          font-size: 14px;
          color: var(--text-secondary, #888);
        }

        .scripts-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .script-card {
          background: var(--bg-surface, #1a1a1a);
          border-radius: 12px;
          border: 1px solid var(--border, #333);
          overflow: hidden;
        }

        .script-view,
        .script-edit {
          padding: 20px;
        }

        .script-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .script-header h4 {
          margin: 0;
          font-size: 16px;
          color: var(--text-primary, #fff);
        }

        .script-actions {
          display: flex;
          gap: 8px;
        }

        .btn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          padding: 0;
          background: var(--bg-hover, #2a2a2a);
          border: 1px solid var(--border, #333);
          border-radius: 6px;
          color: var(--text-secondary, #888);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-icon:hover {
          background: var(--bg-surface, #1a1a1a);
          color: var(--text-primary, #fff);
          border-color: var(--text-secondary, #888);
        }

        .btn-icon.btn-icon-danger:hover {
          color: #ff4444;
          border-color: #ff4444;
        }

        .btn-icon svg {
          width: 16px;
          height: 16px;
        }

        .script-preview {
          margin: 0;
          padding: 16px;
          background: var(--bg-hover, #2a2a2a);
          border-radius: 8px;
          font-family: 'Fira Code', 'Consolas', monospace;
          font-size: 13px;
          line-height: 1.6;
          color: var(--text-secondary, #888);
          white-space: pre-wrap;
          word-break: break-word;
          max-height: 200px;
          overflow-y: auto;
        }

        .script-notes {
          margin: 12px 0 0 0;
          padding: 8px 12px;
          background: var(--bg-hover, #2a2a2a);
          border-left: 3px solid var(--accent, #ff0000);
          border-radius: 0 6px 6px 0;
          font-size: 13px;
          color: var(--text-secondary, #888);
          font-style: italic;
        }

        .word-count {
          display: inline-block;
          margin-top: 12px;
          padding: 4px 10px;
          background: var(--bg-hover, #2a2a2a);
          border-radius: 12px;
          font-size: 12px;
          color: var(--text-secondary, #888);
        }

        .script-edit {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .script-add-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 20px;
          background: var(--bg-surface, #1a1a1a);
          border-radius: 12px;
          border: 1px solid var(--border, #333);
        }

        .script-add-form h4 {
          margin: 0 0 8px 0;
          font-size: 16px;
          color: var(--text-primary, #fff);
        }

        .input,
        .textarea {
          width: 100%;
          padding: 12px 14px;
          background: var(--bg-hover, #2a2a2a);
          border: 1px solid var(--border, #333);
          border-radius: 8px;
          font-size: 14px;
          color: var(--text-primary, #fff);
          transition: border-color 0.15s ease;
        }

        .input:focus,
        .textarea:focus {
          outline: none;
          border-color: var(--accent, #ff0000);
        }

        .input::placeholder,
        .textarea::placeholder {
          color: var(--text-secondary, #888);
        }

        .textarea {
          resize: vertical;
          min-height: 150px;
          font-family: 'Fira Code', 'Consolas', monospace;
          line-height: 1.6;
        }

        .edit-actions,
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 8px;
        }

        .btn {
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

        .btn-secondary {
          background: var(--bg-hover, #2a2a2a);
          border: 1px solid var(--border, #333);
          color: var(--text-primary, #fff);
        }

        .btn-secondary:hover {
          background: var(--bg-surface, #1a1a1a);
          border-color: var(--text-secondary, #888);
        }
      `}</style>
    </div>
  );
}
