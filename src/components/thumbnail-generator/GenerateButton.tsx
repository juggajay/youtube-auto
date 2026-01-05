'use client';

import { useState, useCallback } from 'react';
import { useThumbnailGeneratorStore } from '@/stores/thumbnail-generator';

export function GenerateButton() {
  const [count, setCount] = useState(1);
  const { prompt, isGenerating, addToQueue, queue, aspectRatio, referenceImages, images } = useThumbnailGeneratorStore();

  const canGenerate = prompt.trim().length > 0;

  // Generate images
  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;

    // Add requests to queue
    addToQueue(count);

    // Process the queue
    const state = useThumbnailGeneratorStore.getState();
    const pendingRequests = state.queue.filter((req) => req.status === 'queued');

    // Get reference image data
    const referenceData = referenceImages
      .map((id) => {
        const img = images.find((i) => i.id === id);
        return img?.url;
      })
      .filter((url) => url !== undefined);

    // Process each request in parallel
    await Promise.all(
      pendingRequests.map(async (request) => {
        useThumbnailGeneratorStore.getState().startGeneration(request.id);

        try {
          const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: request.prompt,
              aspectRatio: request.aspectRatio,
              references: referenceData,
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(data.error || 'Generation failed');
          }

          useThumbnailGeneratorStore.getState().completeGeneration(
            request.id,
            data.imageBase64
          );
        } catch (error) {
          useThumbnailGeneratorStore.getState().failGeneration(
            request.id,
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
      })
    );
  }, [canGenerate, count, addToQueue, referenceImages, images]);

  const queueCount = queue.length;

  return (
    <div className="flex items-center gap-3">
      {/* Count selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Generate:</span>
        <select
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          disabled={isGenerating}
        >
          <option value={1}>1 image</option>
          <option value={2}>2 images</option>
          <option value={4}>4 images</option>
          <option value={8}>8 images</option>
        </select>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!canGenerate || isGenerating}
        className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isGenerating ? (
          <span className="flex items-center gap-2">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Generating ({queueCount})...
          </span>
        ) : (
          'Generate'
        )}
      </button>
    </div>
  );
}
