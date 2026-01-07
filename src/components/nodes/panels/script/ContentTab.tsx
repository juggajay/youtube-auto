'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { ScriptNodeConfig } from '@/stores/nodeConfigStore';
import { ContentPicker } from '@/components/content';
import type { ContentItem, ContentType } from '@/types/database';

interface Props {
  config: ScriptNodeConfig;
  onChange: (updates: Partial<ScriptNodeConfig>) => void;
}

type ContentSourceType = 'library' | 'generate';
type DescriptionSourceType = 'library' | 'template' | 'generate';

const DEFAULT_DESCRIPTION_TEMPLATE = `{intro}

Timestamps:
{timestamps}

Links:
{links}

{cta}`;

export function ContentTab({ config, onChange }: Props) {
  // Local state for content source modes
  const [hookSource, setHookSource] = useState<ContentSourceType>(config.hookSource);
  const [titleSource, setTitleSource] = useState<ContentSourceType>(config.titleSource);
  const [descriptionSource, setDescriptionSource] = useState<DescriptionSourceType>(config.descriptionSource);

  // Picker state
  const [pickerType, setPickerType] = useState<ContentType | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Selected content items (fetched)
  const [selectedHook, setSelectedHook] = useState<ContentItem | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<ContentItem | null>(null);
  const [selectedDescription, setSelectedDescription] = useState<ContentItem | null>(null);

  // Tag input state
  const [newTag, setNewTag] = useState('');

  // Template state
  const [descriptionTemplate, setDescriptionTemplate] = useState(
    config.descriptionTemplate || DEFAULT_DESCRIPTION_TEMPLATE
  );

  // Auto-generate tags toggle
  const [autoGenerateTags, setAutoGenerateTags] = useState(config.autoGenerateTags);

  // Fetch selected content by ID
  const fetchContentById = useCallback(async (id: string): Promise<ContentItem | null> => {
    if (!id) return null;
    try {
      const response = await fetch(`/api/content?ids=${id}`);
      if (response.ok) {
        const data = await response.json();
        return data.items?.[0] || null;
      }
    } catch (error) {
      console.error('Failed to fetch content:', error);
    }
    return null;
  }, []);

  // Load selected content on mount
  useEffect(() => {
    const loadSelectedContent = async () => {
      if (config.hookContentId) {
        const hook = await fetchContentById(config.hookContentId);
        setSelectedHook(hook);
      }

      if (config.titleContentId) {
        const title = await fetchContentById(config.titleContentId);
        setSelectedTitle(title);
      }

      if (config.descriptionContentId) {
        const desc = await fetchContentById(config.descriptionContentId);
        setSelectedDescription(desc);
      }
    };

    loadSelectedContent();
  }, [config.hookContentId, config.titleContentId, config.descriptionContentId, fetchContentById]);

  // Handle source changes
  const handleHookSourceChange = (source: ContentSourceType) => {
    setHookSource(source);
    onChange({ hookSource: source });
  };

  const handleTitleSourceChange = (source: ContentSourceType) => {
    setTitleSource(source);
    onChange({ titleSource: source });
  };

  const handleDescriptionSourceChange = (source: DescriptionSourceType) => {
    setDescriptionSource(source);
    onChange({ descriptionSource: source });
  };

  // Handle content selection
  const handleContentSelect = (content: ContentItem) => {
    switch (pickerType) {
      case 'hook':
        setSelectedHook(content);
        onChange({ hookContentId: content.id });
        break;
      case 'title':
        setSelectedTitle(content);
        onChange({ titleContentId: content.id });
        break;
      case 'description':
        setSelectedDescription(content);
        onChange({ descriptionContentId: content.id });
        break;
    }
    setPickerOpen(false);
  };

  // Handle content clear
  const handleClearContent = (type: 'hook' | 'title' | 'description') => {
    switch (type) {
      case 'hook':
        setSelectedHook(null);
        onChange({ hookContentId: undefined });
        break;
      case 'title':
        setSelectedTitle(null);
        onChange({ titleContentId: undefined });
        break;
      case 'description':
        setSelectedDescription(null);
        onChange({ descriptionContentId: undefined });
        break;
    }
  };

  // Handle template change
  const handleTemplateChange = (template: string) => {
    setDescriptionTemplate(template);
    onChange({ descriptionTemplate: template });
  };

  // Handle auto-generate tags toggle
  const handleAutoGenerateTagsChange = (enabled: boolean) => {
    setAutoGenerateTags(enabled);
    onChange({ autoGenerateTags: enabled });
  };

  // Handle adding required tag
  const handleAddTag = () => {
    const tag = newTag.trim();
    if (tag && !config.requiredTags.includes(tag)) {
      onChange({ requiredTags: [...config.requiredTags, tag] });
      setNewTag('');
    }
  };

  // Handle removing required tag
  const handleRemoveTag = (tagToRemove: string) => {
    onChange({ requiredTags: config.requiredTags.filter(t => t !== tagToRemove) });
  };

  // Open picker
  const openPicker = (type: ContentType) => {
    setPickerType(type);
    setPickerOpen(true);
  };

  // Truncate content for preview
  const truncateContent = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  return (
    <div className="content-tab space-y-6">
      <div>
        <h4 className="text-lg font-semibold text-white mb-1">Content Sources</h4>
        <p className="text-sm text-slate-400">Choose where each content piece comes from</p>
      </div>

      {/* Hook Section */}
      <div className="panel-section bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <h5 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Hook
        </h5>

        <div className="space-y-3">
          <label className="radio-option flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:border-slate-500"
            style={{ borderColor: hookSource === 'library' ? 'rgb(168, 85, 247)' : 'rgb(71, 85, 105)',
                     background: hookSource === 'library' ? 'rgba(168, 85, 247, 0.1)' : 'transparent' }}>
            <input
              type="radio"
              name="hookSource"
              checked={hookSource === 'library'}
              onChange={() => handleHookSourceChange('library')}
              className="w-4 h-4 text-purple-500 border-slate-600 bg-slate-700 focus:ring-purple-500"
            />
            <span className={`text-sm ${hookSource === 'library' ? 'text-white' : 'text-slate-300'}`}>
              Use from Content Library
            </span>
          </label>

          <label className="radio-option flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:border-slate-500"
            style={{ borderColor: hookSource === 'generate' ? 'rgb(168, 85, 247)' : 'rgb(71, 85, 105)',
                     background: hookSource === 'generate' ? 'rgba(168, 85, 247, 0.1)' : 'transparent' }}>
            <input
              type="radio"
              name="hookSource"
              checked={hookSource === 'generate'}
              onChange={() => handleHookSourceChange('generate')}
              className="w-4 h-4 text-purple-500 border-slate-600 bg-slate-700 focus:ring-purple-500"
            />
            <span className={`text-sm ${hookSource === 'generate' ? 'text-white' : 'text-slate-300'}`}>
              Generate at runtime
            </span>
          </label>

          {hookSource === 'library' && (
            <div className="mt-3">
              {selectedHook ? (
                <div className="selected-content flex items-start gap-3 p-3 bg-slate-800 rounded-lg border border-purple-500/30">
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-500 text-white uppercase">
                    Hook
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{selectedHook.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{truncateContent(selectedHook.content)}</p>
                  </div>
                  <button
                    className="text-slate-400 hover:text-red-400 transition-colors"
                    onClick={() => handleClearContent('hook')}
                    title="Remove"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  className="w-full px-4 py-3 text-sm rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 border border-dashed border-slate-600 transition-colors flex items-center justify-center gap-2"
                  onClick={() => openPicker('hook')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Select hook from library...
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Title Section */}
      <div className="panel-section bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <h5 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Title
        </h5>

        <div className="space-y-3">
          <label className="radio-option flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:border-slate-500"
            style={{ borderColor: titleSource === 'library' ? 'rgb(168, 85, 247)' : 'rgb(71, 85, 105)',
                     background: titleSource === 'library' ? 'rgba(168, 85, 247, 0.1)' : 'transparent' }}>
            <input
              type="radio"
              name="titleSource"
              checked={titleSource === 'library'}
              onChange={() => handleTitleSourceChange('library')}
              className="w-4 h-4 text-purple-500 border-slate-600 bg-slate-700 focus:ring-purple-500"
            />
            <span className={`text-sm ${titleSource === 'library' ? 'text-white' : 'text-slate-300'}`}>
              Use from Content Library
            </span>
          </label>

          <label className="radio-option flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:border-slate-500"
            style={{ borderColor: titleSource === 'generate' ? 'rgb(168, 85, 247)' : 'rgb(71, 85, 105)',
                     background: titleSource === 'generate' ? 'rgba(168, 85, 247, 0.1)' : 'transparent' }}>
            <input
              type="radio"
              name="titleSource"
              checked={titleSource === 'generate'}
              onChange={() => handleTitleSourceChange('generate')}
              className="w-4 h-4 text-purple-500 border-slate-600 bg-slate-700 focus:ring-purple-500"
            />
            <span className={`text-sm ${titleSource === 'generate' ? 'text-white' : 'text-slate-300'}`}>
              Generate at runtime
            </span>
          </label>

          {titleSource === 'library' && (
            <div className="mt-3">
              {selectedTitle ? (
                <div className="selected-content flex items-start gap-3 p-3 bg-slate-800 rounded-lg border border-purple-500/30">
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-500 text-white uppercase">
                    Title
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{selectedTitle.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{truncateContent(selectedTitle.content)}</p>
                  </div>
                  <button
                    className="text-slate-400 hover:text-red-400 transition-colors"
                    onClick={() => handleClearContent('title')}
                    title="Remove"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  className="w-full px-4 py-3 text-sm rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 border border-dashed border-slate-600 transition-colors flex items-center justify-center gap-2"
                  onClick={() => openPicker('title')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Select title from library...
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Description Section */}
      <div className="panel-section bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <h5 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Description
        </h5>

        <div className="space-y-3">
          <label className="radio-option flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:border-slate-500"
            style={{ borderColor: descriptionSource === 'library' ? 'rgb(168, 85, 247)' : 'rgb(71, 85, 105)',
                     background: descriptionSource === 'library' ? 'rgba(168, 85, 247, 0.1)' : 'transparent' }}>
            <input
              type="radio"
              name="descriptionSource"
              checked={descriptionSource === 'library'}
              onChange={() => handleDescriptionSourceChange('library')}
              className="w-4 h-4 text-purple-500 border-slate-600 bg-slate-700 focus:ring-purple-500"
            />
            <span className={`text-sm ${descriptionSource === 'library' ? 'text-white' : 'text-slate-300'}`}>
              Use from Content Library
            </span>
          </label>

          <label className="radio-option flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:border-slate-500"
            style={{ borderColor: descriptionSource === 'template' ? 'rgb(168, 85, 247)' : 'rgb(71, 85, 105)',
                     background: descriptionSource === 'template' ? 'rgba(168, 85, 247, 0.1)' : 'transparent' }}>
            <input
              type="radio"
              name="descriptionSource"
              checked={descriptionSource === 'template'}
              onChange={() => handleDescriptionSourceChange('template')}
              className="w-4 h-4 text-purple-500 border-slate-600 bg-slate-700 focus:ring-purple-500"
            />
            <span className={`text-sm ${descriptionSource === 'template' ? 'text-white' : 'text-slate-300'}`}>
              Use template
            </span>
          </label>

          <label className="radio-option flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:border-slate-500"
            style={{ borderColor: descriptionSource === 'generate' ? 'rgb(168, 85, 247)' : 'rgb(71, 85, 105)',
                     background: descriptionSource === 'generate' ? 'rgba(168, 85, 247, 0.1)' : 'transparent' }}>
            <input
              type="radio"
              name="descriptionSource"
              checked={descriptionSource === 'generate'}
              onChange={() => handleDescriptionSourceChange('generate')}
              className="w-4 h-4 text-purple-500 border-slate-600 bg-slate-700 focus:ring-purple-500"
            />
            <span className={`text-sm ${descriptionSource === 'generate' ? 'text-white' : 'text-slate-300'}`}>
              Generate at runtime
            </span>
          </label>

          {descriptionSource === 'library' && (
            <div className="mt-3">
              {selectedDescription ? (
                <div className="selected-content flex items-start gap-3 p-3 bg-slate-800 rounded-lg border border-purple-500/30">
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-teal-500 text-white uppercase">
                    Desc
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{selectedDescription.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{truncateContent(selectedDescription.content)}</p>
                  </div>
                  <button
                    className="text-slate-400 hover:text-red-400 transition-colors"
                    onClick={() => handleClearContent('description')}
                    title="Remove"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  className="w-full px-4 py-3 text-sm rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 border border-dashed border-slate-600 transition-colors flex items-center justify-center gap-2"
                  onClick={() => openPicker('description')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Select description from library...
                </button>
              )}
            </div>
          )}

          {descriptionSource === 'template' && (
            <div className="mt-3">
              <textarea
                className="w-full h-40 bg-slate-700 text-white font-mono text-sm rounded-lg px-3 py-2 border border-slate-600 focus:border-purple-500 focus:ring-0 resize-none"
                value={descriptionTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                placeholder="Enter description template..."
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-xs text-slate-500">Available variables:</span>
                {['{intro}', '{timestamps}', '{links}', '{cta}'].map((variable) => (
                  <button
                    key={variable}
                    className="px-2 py-0.5 text-xs rounded bg-slate-700 text-purple-400 hover:bg-slate-600 transition-colors"
                    onClick={() => handleTemplateChange(descriptionTemplate + '\n' + variable)}
                  >
                    {variable}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tags Section */}
      <div className="panel-section bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <h5 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Tags
        </h5>

        <div className="space-y-4">
          <label className="toggle-row flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoGenerateTags}
              onChange={(e) => handleAutoGenerateTagsChange(e.target.checked)}
              className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
            />
            <div>
              <span className="text-sm font-medium text-slate-200 block">Auto-generate from content</span>
              <span className="text-xs text-slate-500">AI will extract relevant tags from your video content</span>
            </div>
          </label>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Required tags (always included)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag..."
                className="flex-1 px-3 py-2 bg-slate-700 text-white text-sm rounded-lg border border-slate-600 focus:border-purple-500 focus:ring-0"
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2 text-sm rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors"
              >
                Add
              </button>
            </div>

            {config.requiredTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {config.requiredTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-slate-700 text-slate-200 text-sm rounded-full"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="panel-info-box bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <div>
            <p className="text-sm text-slate-300">
              No saved content? Create hooks, titles &amp; descriptions in Ideation Studio first.
            </p>
            <Link
              href="/ideation"
              className="inline-flex items-center gap-1 mt-2 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              Open Ideation Studio
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Content Picker Modal */}
      {pickerType && (
        <ContentPicker
          type={pickerType}
          isOpen={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={handleContentSelect}
        />
      )}
    </div>
  );
}
