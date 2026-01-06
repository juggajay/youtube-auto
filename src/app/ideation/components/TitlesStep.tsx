'use client';

import { useIdeationStore } from '@/stores/ideationStore';
import { useCallback, useMemo } from 'react';

// Power words commonly used in viral titles
const POWER_WORDS = [
  'Secret', 'Hidden', 'Shocking', 'Ultimate', 'Proven',
  'Never', 'Always', 'Truth', 'Exposed', 'Revealed',
  'Amazing', 'Essential', 'Revolutionary', 'Exclusive', 'Insane',
];

function getCharCountColor(count: number): { color: string; label: string } {
  if (count <= 50) {
    return { color: 'text-emerald-400', label: 'Perfect' };
  } else if (count <= 60) {
    return { color: 'text-amber-400', label: 'Good' };
  } else if (count <= 70) {
    return { color: 'text-orange-400', label: 'Long' };
  }
  return { color: 'text-red-400', label: 'Too long' };
}

function highlightPowerWords(text: string): React.ReactNode[] {
  const words = text.split(/(\s+)/);
  return words.map((word, i) => {
    const cleanWord = word.replace(/[^a-zA-Z]/g, '');
    const isPowerWord = POWER_WORDS.some(
      pw => cleanWord.toLowerCase() === pw.toLowerCase()
    );
    if (isPowerWord) {
      return (
        <span key={i} className="text-cyan-300 font-semibold">
          {word}
        </span>
      );
    }
    return <span key={i}>{word}</span>;
  });
}

function hasNumber(text: string): boolean {
  return /\d/.test(text);
}

export function TitlesStep() {
  const {
    generatedTitles,
    selectedTitleIds,
    isGeneratingTitles,
    generateTitles,
    toggleTitleSelection,
    selectedHookIds,
    generatedHooks,
  } = useIdeationStore();

  const selectedHooks = useMemo(() => {
    return generatedHooks.filter(h => selectedHookIds.includes(h.id));
  }, [generatedHooks, selectedHookIds]);

  const handleGenerate = useCallback(() => {
    generateTitles(5);
  }, [generateTitles]);

  const handleGenerateMore = useCallback(() => {
    generateTitles(3);
  }, [generateTitles]);

  return (
    <div className="titles-step">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Generate Titles</h2>
            <p className="text-sm text-slate-400">Create click-worthy titles for your video</p>
          </div>
        </div>
      </div>

      {/* Context Panel */}
      {selectedHooks.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-slate-300">Based on your selected hooks:</span>
          </div>
          <div className="space-y-2">
            {selectedHooks.map((hook) => (
              <div
                key={hook.id}
                className="text-sm text-slate-400 pl-4 border-l-2 border-cyan-500/30"
              >
                &ldquo;{hook.content}&rdquo;
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate Button */}
      {generatedTitles.length === 0 && (
        <button
          onClick={handleGenerate}
          disabled={isGeneratingTitles}
          className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 p-px mb-8 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="relative flex items-center justify-center gap-3 px-6 py-4 bg-slate-900/90 rounded-[11px] group-hover:bg-slate-900/70 transition-colors">
            {isGeneratingTitles ? (
              <>
                <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-cyan-400 font-semibold">Generating Titles...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-cyan-400 font-semibold">Generate Titles</span>
              </>
            )}
          </div>
        </button>
      )}

      {/* Loading State */}
      {isGeneratingTitles && generatedTitles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-cyan-400/30 border-t-transparent animate-spin" style={{ animationDuration: '1.5s' }} />
          </div>
          <p className="text-slate-400 animate-pulse">Crafting click-worthy titles...</p>
        </div>
      )}

      {/* Titles Grid */}
      {generatedTitles.length > 0 && (
        <>
          {/* Selection Counter */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Select titles to save:</span>
              {selectedTitleIds.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-medium">
                  {selectedTitleIds.length} selected
                </span>
              )}
            </div>
          </div>

          {/* Titles Cards */}
          <div className="grid gap-3 mb-6">
            {generatedTitles.map((title, index) => {
              const isSelected = selectedTitleIds.includes(title.id);
              const charCount = title.charCount || title.content.length;
              const { color: charColor, label: charLabel } = getCharCountColor(charCount);
              const titleHasNumber = title.hasNumber ?? hasNumber(title.content);

              return (
                <div
                  key={title.id}
                  onClick={() => toggleTitleSelection(title.id)}
                  className={`
                    group relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200
                    ${isSelected
                      ? 'border-cyan-500 bg-cyan-500/5 shadow-lg shadow-cyan-500/10'
                      : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50'
                    }
                  `}
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  {/* Selection Checkbox */}
                  <div className="absolute top-4 right-4">
                    <div
                      className={`
                        w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all
                        ${isSelected
                          ? 'border-cyan-500 bg-cyan-500'
                          : 'border-slate-600 bg-slate-800 group-hover:border-slate-500'
                        }
                      `}
                    >
                      {isSelected && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Title Content */}
                  <div className="pr-10 mb-3">
                    <p className="text-lg text-white font-medium leading-relaxed">
                      {highlightPowerWords(title.content)}
                    </p>
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Character Count */}
                    <div className={`flex items-center gap-1.5 text-xs ${charColor}`}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      <span className="font-mono">{charCount} chars</span>
                      <span className="text-slate-500">({charLabel})</span>
                    </div>

                    {/* Number Indicator */}
                    {titleHasNumber && (
                      <div className="flex items-center gap-1.5 text-xs text-purple-400">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        <span>Has number</span>
                      </div>
                    )}

                    {/* Power Word Indicator */}
                    {title.hasPowerWord && (
                      <div className="flex items-center gap-1.5 text-xs text-cyan-400">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Power word</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Generate More Button */}
          <button
            onClick={handleGenerateMore}
            disabled={isGeneratingTitles}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-700 text-slate-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingTitles ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Generate More Titles</span>
              </>
            )}
          </button>
        </>
      )}

      {/* Tips Panel */}
      <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-800/30 border border-slate-700/50">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-1">Title Best Practices</h4>
            <ul className="text-xs text-slate-400 space-y-1">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                <span><strong className="text-emerald-400">50-60 chars</strong> is ideal for YouTube</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-purple-400" />
                <span><strong className="text-purple-400">Numbers</strong> increase click-through rate</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-cyan-400" />
                <span><strong className="text-cyan-400">Power words</strong> trigger emotional response</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
