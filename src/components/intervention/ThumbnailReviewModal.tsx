'use client';

import { useState } from 'react';
import type { InterventionModalProps } from './InterventionContainer';

interface ThumbnailOption {
  id: string;
  imageUrl: string;
  prompt: string;
}

interface ThumbnailGeneratedContent {
  thumbnails: ThumbnailOption[];
}

export function ThumbnailReviewModal({ intervention, onDismiss, onRespond }: InterventionModalProps) {
  // Type assertion for generated content specific to thumbnail node
  const content = intervention.generatedContent as ThumbnailGeneratedContent;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const handleSelect = async () => {
    if (!selectedId) return;

    await onRespond({
      interventionId: intervention.id,
      action: 'select',
      data: {
        selectedThumbnailId: selectedId,
      },
    });
  };

  const handleGenerateMore = async () => {
    setGenerating(true);
    await onRespond({
      interventionId: intervention.id,
      action: 'retry',
      data: {
        generateMore: true,
      },
    });
  };

  const handleOpenStudio = () => {
    // Open thumbnail in full editor
    window.open(`/studio/thumbnail?intervention=${intervention.id}`, '_blank');
  };

  const handleSkip = async () => {
    // Use first thumbnail by default
    if (content.thumbnails.length > 0) {
      await onRespond({
        interventionId: intervention.id,
        action: 'select',
        data: {
          selectedThumbnailId: content.thumbnails[0].id,
        },
      });
    } else {
      onDismiss();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-700">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="text-2xl">&#x1F5BC;</span> Choose Thumbnail
            </h2>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              onClick={onDismiss}
            >
              <span className="text-xl">&times;</span>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Thumbnail Grid */}
            <div className="grid grid-cols-2 gap-4">
              {content.thumbnails.map((thumb) => (
                <div
                  key={thumb.id}
                  className={`relative group aspect-video rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                    selectedId === thumb.id
                      ? 'border-blue-500 ring-2 ring-blue-500/30'
                      : 'border-zinc-700 hover:border-zinc-600'
                  }`}
                  onClick={() => setSelectedId(thumb.id)}
                >
                  <img
                    src={thumb.imageUrl}
                    alt="Generated thumbnail"
                    className="w-full h-full object-cover"
                  />

                  {/* Zoom button */}
                  <button
                    className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomedImage(thumb.imageUrl);
                    }}
                  >
                    <span>&#x1F50D;</span>
                  </button>

                  {/* Selected badge */}
                  {selectedId === thumb.id && (
                    <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-blue-500 text-white text-xs font-medium flex items-center gap-1">
                      <span>&#x2713;</span> Selected
                    </div>
                  )}

                  {/* Hover overlay with prompt */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <p className="text-xs text-zinc-300 line-clamp-2">{thumb.prompt}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                className="px-4 py-2 rounded-lg border border-zinc-600 text-zinc-300 hover:bg-zinc-800 transition-colors font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleGenerateMore}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <span>&#x23F3;</span> Generating...
                  </>
                ) : (
                  <>
                    <span>&#x1F3B2;</span> Generate More
                  </>
                )}
              </button>
              <button
                className="px-4 py-2 rounded-lg border border-zinc-600 text-zinc-300 hover:bg-zinc-800 transition-colors font-medium text-sm flex items-center gap-2"
                onClick={handleOpenStudio}
              >
                <span>&#x1F3A8;</span> Open in Thumbnail Studio
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-700">
            <button
              className="px-4 py-2 rounded-lg border border-zinc-600 text-zinc-300 hover:bg-zinc-800 transition-colors font-medium text-sm"
              onClick={handleSkip}
            >
              Skip (Use First)
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSelect}
              disabled={!selectedId}
            >
              <span>&#x2705;</span> Use Selected
            </button>
          </div>
        </div>
      </div>

      {/* Zoom Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 cursor-pointer"
          onClick={() => setZoomedImage(null)}
        >
          <img
            src={zoomedImage}
            alt="Zoomed thumbnail"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
          <button
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            onClick={() => setZoomedImage(null)}
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>
      )}
    </>
  );
}
