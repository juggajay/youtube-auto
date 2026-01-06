'use client';

import { useState } from 'react';
import type { ScriptNodeConfig } from '@/stores/nodeConfigStore';

interface Props {
  config: ScriptNodeConfig;
  onChange: (updates: Partial<ScriptNodeConfig>) => void;
}

export function TagsTab({ config, onChange }: Props) {
  const [newRequiredTag, setNewRequiredTag] = useState('');
  const [newBannedTag, setNewBannedTag] = useState('');

  const addRequiredTag = () => {
    const tag = newRequiredTag.trim().toLowerCase();
    if (tag && !config.requiredTags.includes(tag)) {
      onChange({ requiredTags: [...config.requiredTags, tag] });
      setNewRequiredTag('');
    }
  };

  const removeRequiredTag = (tag: string) => {
    onChange({ requiredTags: config.requiredTags.filter(t => t !== tag) });
  };

  const addBannedTag = () => {
    const tag = newBannedTag.trim().toLowerCase();
    if (tag && !config.bannedTags.includes(tag)) {
      onChange({ bannedTags: [...config.bannedTags, tag] });
      setNewBannedTag('');
    }
  };

  const removeBannedTag = (tag: string) => {
    onChange({ bannedTags: config.bannedTags.filter(t => t !== tag) });
  };

  return (
    <div className="tags-tab space-y-6">
      <div>
        <h4 className="text-lg font-semibold text-white mb-1">Tag Configuration</h4>
        <p className="text-sm text-slate-400">Configure how tags are generated for your videos</p>
      </div>

      {/* Auto Extract Toggle */}
      <div className="form-group">
        <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg bg-slate-800 border border-slate-700">
          <input
            type="checkbox"
            className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
            checked={config.autoExtractTags}
            onChange={(e) => onChange({ autoExtractTags: e.target.checked })}
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-white block">Auto-Extract Tags</span>
            <span className="text-xs text-slate-400">Automatically generate tags from script content using AI</span>
          </div>
          {config.autoExtractTags && (
            <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">Enabled</span>
          )}
        </label>
      </div>

      {/* Max Tags */}
      <div className="form-group">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-300">Maximum Tags</label>
          <span className="text-sm font-mono text-amber-400">{config.maxTags}</span>
        </div>
        <input
          type="range"
          min={5}
          max={30}
          value={config.maxTags}
          onChange={(e) => onChange({ maxTags: parseInt(e.target.value) })}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>5 (minimal)</span>
          <span>15 (recommended)</span>
          <span>30 (max)</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">YouTube allows up to 500 characters total for tags</p>
      </div>

      {/* Required Tags */}
      <div className="form-group">
        <label className="block text-sm font-medium text-slate-300 mb-1">Required Tags</label>
        <p className="text-xs text-slate-500 mb-3">These tags will always be included in every video</p>

        <div className="tags-list flex flex-wrap gap-2 mb-3 min-h-[40px] p-2 rounded-lg bg-slate-800 border border-slate-700">
          {config.requiredTags.length === 0 ? (
            <span className="text-sm text-slate-500 italic">No required tags</span>
          ) : (
            config.requiredTags.map((tag) => (
              <span
                key={tag}
                className="tag inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-sm"
              >
                #{tag}
                <button
                  onClick={() => removeRequiredTag(tag)}
                  className="hover:text-green-300"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newRequiredTag}
            onChange={(e) => setNewRequiredTag(e.target.value)}
            placeholder="Add required tag"
            className="flex-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:border-amber-500 focus:ring-0"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addRequiredTag();
              }
            }}
          />
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
            onClick={addRequiredTag}
          >
            Add
          </button>
        </div>
      </div>

      {/* Banned Tags */}
      <div className="form-group">
        <label className="block text-sm font-medium text-slate-300 mb-1">Banned Tags</label>
        <p className="text-xs text-slate-500 mb-3">These tags will never be included, even if auto-generated</p>

        <div className="tags-list flex flex-wrap gap-2 mb-3 min-h-[40px] p-2 rounded-lg bg-slate-800 border border-slate-700">
          {config.bannedTags.length === 0 ? (
            <span className="text-sm text-slate-500 italic">No banned tags</span>
          ) : (
            config.bannedTags.map((tag) => (
              <span
                key={tag}
                className="tag inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-sm"
              >
                #{tag}
                <button
                  onClick={() => removeBannedTag(tag)}
                  className="hover:text-red-300"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newBannedTag}
            onChange={(e) => setNewBannedTag(e.target.value)}
            placeholder="Add banned tag"
            className="flex-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:border-amber-500 focus:ring-0"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addBannedTag();
              }
            }}
          />
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
            onClick={addBannedTag}
          >
            Ban
          </button>
        </div>
      </div>

      {/* Tag Strategy Info */}
      <div className="info-box bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h5 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Tag Best Practices
        </h5>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>- Use a mix of broad and specific tags</li>
          <li>- Include your channel name as a tag</li>
          <li>- Add variations of keywords (singular/plural)</li>
          <li>- First 3-5 tags are most important for discovery</li>
          <li>- Avoid irrelevant tags (can hurt rankings)</li>
        </ul>
      </div>

      {/* Summary */}
      <div className="summary bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h5 className="text-sm font-semibold text-slate-300 mb-2">Configuration Summary</h5>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Auto-extract:</span>
            <span className={`ml-2 ${config.autoExtractTags ? 'text-green-400' : 'text-slate-400'}`}>
              {config.autoExtractTags ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Max tags:</span>
            <span className="ml-2 text-amber-400">{config.maxTags}</span>
          </div>
          <div>
            <span className="text-slate-500">Required:</span>
            <span className="ml-2 text-green-400">{config.requiredTags.length}</span>
          </div>
          <div>
            <span className="text-slate-500">Banned:</span>
            <span className="ml-2 text-red-400">{config.bannedTags.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
