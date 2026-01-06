'use client';

import { useIdeationStore } from '@/stores/ideationStore';
import { useCallback, useState } from 'react';

export function ThumbnailStep() {
  const {
    thumbnailConcepts,
    selectedThumbnailConcept,
    addThumbnailConcept,
    removeThumbnailConcept,
    setSelectedThumbnailConcept,
  } = useIdeationStore();

  const [newConcept, setNewConcept] = useState('');

  const handleAddConcept = useCallback(() => {
    const trimmed = newConcept.trim();
    if (trimmed && !thumbnailConcepts.includes(trimmed)) {
      addThumbnailConcept(trimmed);
      setNewConcept('');
    }
  }, [newConcept, thumbnailConcepts, addThumbnailConcept]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddConcept();
    }
  }, [handleAddConcept]);

  const handleRemove = useCallback((concept: string) => {
    removeThumbnailConcept(concept);
  }, [removeThumbnailConcept]);

  const handleSelect = useCallback((concept: string) => {
    setSelectedThumbnailConcept(
      selectedThumbnailConcept === concept ? null : concept
    );
  }, [selectedThumbnailConcept, setSelectedThumbnailConcept]);

  return (
    <div className="thumbnail-step">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Thumbnail Concepts</h2>
            <p className="text-sm text-slate-400">Describe ideas for your video thumbnail</p>
          </div>
        </div>
      </div>

      {/* Optional Badge */}
      <div className="mb-6 flex items-center gap-2">
        <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-400">
          Optional Step
        </span>
        <span className="text-xs text-slate-500">You can skip this step if needed</span>
      </div>

      {/* Add Concept Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Add a thumbnail concept
        </label>
        <div className="relative">
          <textarea
            value={newConcept}
            onChange={(e) => setNewConcept(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe a thumbnail idea... e.g., 'Person looking shocked at a pile of cash with a red arrow pointing up'"
            className="w-full h-24 bg-slate-800/50 text-white text-sm rounded-xl px-4 py-3 border-2 border-slate-700/50 focus:border-pink-500/50 focus:ring-0 resize-none transition-colors placeholder:text-slate-600"
          />
          <div className="absolute bottom-3 right-3">
            <button
              onClick={handleAddConcept}
              disabled={!newConcept.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-500 text-white text-sm font-medium hover:bg-pink-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-pink-500"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Concept
            </button>
          </div>
        </div>
      </div>

      {/* Concepts List */}
      {thumbnailConcepts.length > 0 ? (
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300">
              Your concepts ({thumbnailConcepts.length})
            </label>
            <span className="text-xs text-slate-500">Select one as primary</span>
          </div>

          <div className="space-y-2">
            {thumbnailConcepts.map((concept, index) => {
              const isSelected = selectedThumbnailConcept === concept;

              return (
                <div
                  key={`${concept}-${index}`}
                  className={`
                    group relative rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer
                    ${isSelected
                      ? 'border-pink-500 bg-pink-500/5 shadow-lg shadow-pink-500/10'
                      : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50'
                    }
                  `}
                  onClick={() => handleSelect(concept)}
                >
                  <div className="flex items-start gap-3">
                    {/* Radio Button */}
                    <div
                      className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all
                        ${isSelected
                          ? 'border-pink-500 bg-pink-500'
                          : 'border-slate-600 bg-slate-800 group-hover:border-slate-500'
                        }
                      `}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white leading-relaxed">{concept}</p>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(concept);
                      }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Primary Badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 text-xs font-medium">
                        Primary
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="mb-6 p-8 rounded-xl border-2 border-dashed border-slate-700/50 bg-slate-800/20 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm mb-1">No concepts added yet</p>
          <p className="text-slate-500 text-xs">Add descriptions of thumbnail ideas above</p>
        </div>
      )}

      {/* Preview Hint */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-pink-500/5 to-purple-500/5 border border-pink-500/20">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-1">Coming Soon: AI Thumbnail Generation</h4>
            <p className="text-xs text-slate-400">
              These concepts will be used to generate thumbnail options using AI image generation.
              For now, use these descriptions as a reference for creating thumbnails manually.
            </p>
          </div>
        </div>
      </div>

      {/* Tips Panel */}
      <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-800/30 border border-slate-700/50">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-1">Thumbnail Best Practices</h4>
            <ul className="text-xs text-slate-400 space-y-1">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-pink-400" />
                <span><strong className="text-pink-400">Faces</strong> with emotions drive higher CTR</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-purple-400" />
                <span><strong className="text-purple-400">Contrast</strong> makes thumbnails pop in the feed</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-cyan-400" />
                <span><strong className="text-cyan-400">3 words max</strong> for any text overlay</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Example Concepts */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-slate-400 mb-3">
          Example concept formats:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            'Close-up of surprised face with glowing "$$$" symbols floating around',
            'Split screen: "Before" sad face, "After" celebrating with confetti',
            'Dark background, spotlight on product, bold yellow text "SECRET"',
            'Person pointing at screen showing a graph going up dramatically',
          ].map((example, i) => (
            <button
              key={i}
              onClick={() => {
                if (!thumbnailConcepts.includes(example)) {
                  addThumbnailConcept(example);
                }
              }}
              className="text-left p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 text-xs text-slate-400 hover:border-pink-500/30 hover:text-slate-300 transition-colors"
            >
              <span className="text-pink-400 mr-1">+</span>
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
