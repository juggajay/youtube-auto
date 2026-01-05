'use client';

import { useCallback } from 'react';
import {
  PromptInput,
  AspectRatioSelector,
  ImageGrid,
  ImageModal,
  YouTubeExtractor,
  GenerateButton,
} from '@/components/thumbnail-generator';
import { useThumbnailGeneratorStore } from '@/stores/thumbnail-generator';

export default function ThumbnailGeneratorPage() {
  const { addToQueue, prompt, aspectRatio, referenceImages, images, isGenerating } =
    useThumbnailGeneratorStore();

  // Handle generation from prompt input keyboard shortcut
  const handleGenerate = useCallback(
    async (count: number) => {
      if (!prompt.trim()) return;

      // Add requests to queue
      addToQueue(count);

      // Get the queue state
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
    },
    [addToQueue, prompt, referenceImages, images]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-bold text-gray-900">Thumbnail Generator</h1>
          <p className="text-sm text-gray-500">
            Generate AI-powered thumbnails with Imagen 4.0
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl p-6">
        <div className="space-y-6">
          {/* Controls row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <AspectRatioSelector />
            <GenerateButton />
          </div>

          {/* Prompt input */}
          <PromptInput onGenerate={handleGenerate} disabled={isGenerating} />

          {/* YouTube extractor */}
          <YouTubeExtractor />

          {/* Image grid */}
          <div>
            <h2 className="mb-4 text-lg font-medium text-gray-900">Generated Images</h2>
            <ImageGrid />
          </div>
        </div>
      </main>

      {/* Fullscreen modal */}
      <ImageModal />
    </div>
  );
}
