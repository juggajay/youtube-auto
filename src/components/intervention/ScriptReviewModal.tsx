'use client';

import { useState } from 'react';
import type { InterventionModalProps } from './InterventionContainer';

interface ScriptGeneratedContent {
  script: string;
  titleOptions: string[];
  description: string;
  tags: string[];
  wordCount: number;
  estimatedDuration: string;
  hooks: string[];
}

type TabType = 'script' | 'titles' | 'description' | 'tags';

export function ScriptReviewModal({ intervention, onDismiss, onRespond }: InterventionModalProps) {
  // Type assertion for generated content specific to script node
  const content = intervention.generatedContent as ScriptGeneratedContent;

  const [editedScript, setEditedScript] = useState(content.script);
  const [selectedTitle, setSelectedTitle] = useState(0);
  const [editedDescription, setEditedDescription] = useState(content.description);
  const [editedTags, setEditedTags] = useState(content.tags);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('script');

  const wordCount = editedScript.split(/\s+/).filter(Boolean).length;
  const estimatedMinutes = Math.round(wordCount / 150); // ~150 words per minute

  const handleApprove = async () => {
    await onRespond({
      interventionId: intervention.id,
      action: 'approve',
      data: {
        script: editedScript,
        selectedTitleIndex: selectedTitle,
        description: editedDescription,
        tags: editedTags,
        notes,
      },
    });
  };

  const handleRegenerate = async () => {
    await onRespond({
      interventionId: intervention.id,
      action: 'retry',
      data: {
        feedback: notes,
      },
    });
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      setEditedTags([...editedTags, e.currentTarget.value.trim()]);
      e.currentTarget.value = '';
    }
  };

  const handleRemoveTag = (index: number) => {
    setEditedTags(editedTags.filter((_, j) => j !== index));
  };

  const handleHookSelect = (hook: string) => {
    // Replace first paragraph with selected hook
    const rest = editedScript.split('\n\n').slice(1).join('\n\n');
    setEditedScript(hook + '\n\n' + rest);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-700">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span className="text-2xl">&#x1F4DD;</span> Review Generated Script
          </h2>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            onClick={onDismiss}
          >
            <span className="text-xl">&times;</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-700 px-6">
          <button
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'script'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('script')}
          >
            Script
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'titles'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('titles')}
          >
            Titles ({content.titleOptions.length})
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'description'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('description')}
          >
            Description
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'tags'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('tags')}
          >
            Tags ({editedTags.length})
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Script Tab */}
          {activeTab === 'script' && (
            <div className="space-y-6">
              {/* Hook Options */}
              {content.hooks && content.hooks.length > 1 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-zinc-300">Choose Opening Hook</h4>
                  <div className="space-y-2">
                    {content.hooks.map((hook, i) => (
                      <label
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-lg border border-zinc-700 hover:border-zinc-600 cursor-pointer transition-colors"
                      >
                        <input
                          type="radio"
                          name="hook"
                          className="mt-1"
                          checked={editedScript.startsWith(hook)}
                          onChange={() => handleHookSelect(hook)}
                        />
                        <span className="text-sm text-zinc-300 leading-relaxed">{hook}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Script Editor */}
              <div className="space-y-2">
                <textarea
                  value={editedScript}
                  onChange={(e) => setEditedScript(e.target.value)}
                  rows={20}
                  className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none font-mono text-sm leading-relaxed"
                />
                <div className="flex gap-4 text-xs text-zinc-500">
                  <span>{wordCount} words</span>
                  <span>~{estimatedMinutes} min read</span>
                </div>
              </div>
            </div>
          )}

          {/* Titles Tab */}
          {activeTab === 'titles' && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-zinc-300">Select Video Title</h4>
              <div className="space-y-2">
                {content.titleOptions.map((title, i) => (
                  <label
                    key={i}
                    className={`flex items-center justify-between gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedTitle === i
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="title"
                        checked={selectedTitle === i}
                        onChange={() => setSelectedTitle(i)}
                        className="text-blue-500"
                      />
                      <span className="text-white font-medium">{title}</span>
                    </div>
                    <span className="text-xs text-zinc-500">{title.length} chars</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Description Tab */}
          {activeTab === 'description' && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-zinc-300">Video Description</h4>
              <div className="space-y-2">
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none text-sm leading-relaxed"
                />
                <span className="text-xs text-zinc-500">{editedDescription.length}/5000</span>
              </div>
            </div>
          )}

          {/* Tags Tab */}
          {activeTab === 'tags' && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-zinc-300">Video Tags</h4>
              <div className="flex flex-wrap gap-2">
                {editedTags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-sm text-zinc-300"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(i)}
                      className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-zinc-600 text-zinc-500 hover:text-white transition-colors"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add tag and press Enter"
                onKeyDown={handleAddTag}
                className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
          )}

          {/* Notes */}
          <div className="mt-6 space-y-2">
            <label className="text-sm font-medium text-zinc-300">Notes / Feedback</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any feedback for regeneration or notes for yourself..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none text-sm"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-700">
          <button
            className="px-4 py-2 rounded-lg border border-zinc-600 text-zinc-300 hover:bg-zinc-800 transition-colors font-medium text-sm flex items-center gap-2"
            onClick={handleRegenerate}
          >
            <span>&#x1F504;</span> Regenerate
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors font-medium text-sm flex items-center gap-2"
            onClick={handleApprove}
          >
            <span>&#x2705;</span> Approve & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
