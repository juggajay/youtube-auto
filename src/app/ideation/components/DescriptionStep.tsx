'use client';

import { useIdeationStore } from '@/stores/ideationStore';
import { useCallback, useMemo, useRef } from 'react';

const YOUTUBE_DESCRIPTION_LIMIT = 5000;

interface FormatHint {
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
}

const FORMAT_HINTS: FormatHint[] = [
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: 'Timestamps',
    description: 'Chapter markers for easy navigation',
    color: 'text-emerald-400',
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    label: 'Links',
    description: 'Resources and references mentioned',
    color: 'text-blue-400',
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
    label: 'Call to Action',
    description: 'Subscribe, like, and engagement prompts',
    color: 'text-amber-400',
  },
];

export function DescriptionStep() {
  const {
    generatedDescription,
    editedDescription,
    isGeneratingDescription,
    generateDescription,
    setEditedDescription,
    selectedTitleIds,
    generatedTitles,
  } = useIdeationStore();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedTitle = useMemo(() => {
    return generatedTitles.find(t => selectedTitleIds.includes(t.id));
  }, [generatedTitles, selectedTitleIds]);

  const handleGenerate = useCallback(() => {
    generateDescription();
  }, [generateDescription]);

  const handleRegenerate = useCallback(() => {
    generateDescription();
  }, [generateDescription]);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedDescription(e.target.value);
  }, [setEditedDescription]);

  const charCount = editedDescription?.length || 0;
  const charPercentage = Math.min((charCount / YOUTUBE_DESCRIPTION_LIMIT) * 100, 100);

  const getCharCountColor = () => {
    if (charCount < 500) return 'text-slate-400';
    if (charCount < 2000) return 'text-emerald-400';
    if (charCount < 4000) return 'text-amber-400';
    if (charCount < YOUTUBE_DESCRIPTION_LIMIT) return 'text-orange-400';
    return 'text-red-400';
  };

  const getProgressColor = () => {
    if (charCount < 2000) return 'bg-emerald-500';
    if (charCount < 4000) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="description-step">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Generate Description</h2>
            <p className="text-sm text-slate-400">Create an optimized video description</p>
          </div>
        </div>
      </div>

      {/* Context Panel */}
      {selectedTitle && (
        <div className="mb-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <span className="text-sm font-medium text-slate-300">For your video:</span>
          </div>
          <p className="text-white font-medium pl-4 border-l-2 border-amber-500/30">
            {selectedTitle.content}
          </p>
        </div>
      )}

      {/* Generate Button (when no description yet) */}
      {!generatedDescription && !editedDescription && (
        <button
          onClick={handleGenerate}
          disabled={isGeneratingDescription}
          className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 p-px mb-8 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="relative flex items-center justify-center gap-3 px-6 py-4 bg-slate-900/90 rounded-[11px] group-hover:bg-slate-900/70 transition-colors">
            {isGeneratingDescription ? (
              <>
                <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-amber-400 font-semibold">Generating Description...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-amber-400 font-semibold">Generate Description</span>
              </>
            )}
          </div>
        </button>
      )}

      {/* Loading State */}
      {isGeneratingDescription && !editedDescription && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
            <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-amber-400/30 border-t-transparent animate-spin" style={{ animationDuration: '1.5s' }} />
          </div>
          <p className="text-slate-400 animate-pulse">Crafting your description...</p>
        </div>
      )}

      {/* Description Editor */}
      {(generatedDescription || editedDescription) && (
        <div className="space-y-4">
          {/* Format Hints */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {FORMAT_HINTS.map((hint) => (
              <div
                key={hint.label}
                className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50"
              >
                <div className={`flex items-center gap-2 mb-1 ${hint.color}`}>
                  {hint.icon}
                  <span className="text-sm font-medium">{hint.label}</span>
                </div>
                <p className="text-xs text-slate-500">{hint.description}</p>
              </div>
            ))}
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={editedDescription || ''}
              onChange={handleDescriptionChange}
              placeholder="Your video description will appear here..."
              className="w-full h-80 bg-slate-800/50 text-white font-mono text-sm rounded-xl px-4 py-4 border-2 border-slate-700/50 focus:border-amber-500/50 focus:ring-0 resize-none transition-colors placeholder:text-slate-600"
              style={{ lineHeight: '1.6' }}
            />

            {/* Character Count Overlay */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <span className={`text-xs font-mono ${getCharCountColor()}`}>
                {charCount.toLocaleString()} / {YOUTUBE_DESCRIPTION_LIMIT.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 ${getProgressColor()} transition-all duration-300`}
              style={{ width: `${charPercentage}%` }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRegenerate}
              disabled={isGeneratingDescription}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:border-amber-500/50 hover:text-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingDescription ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Regenerating...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-sm">Regenerate</span>
                </>
              )}
            </button>

            <div className="flex-1" />

            {/* Status Indicator */}
            {editedDescription !== generatedDescription && (
              <div className="flex items-center gap-2 text-xs text-amber-400">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Modified</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tips Panel */}
      <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-800/30 border border-slate-700/50">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-1">Description Best Practices</h4>
            <ul className="text-xs text-slate-400 space-y-1">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                <span>First <strong className="text-emerald-400">200 characters</strong> appear in search results</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-blue-400" />
                <span>Include <strong className="text-blue-400">keywords</strong> naturally for SEO</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-amber-400" />
                <span>Add <strong className="text-amber-400">timestamps</strong> for better engagement</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
