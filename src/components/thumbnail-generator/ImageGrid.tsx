'use client';

import { DragEvent, useCallback } from 'react';
import { useThumbnailGeneratorStore, GeneratedImage } from '@/stores/thumbnail-generator';

interface ImageCardProps {
  image: GeneratedImage;
  onClick: () => void;
}

function ImageCard({ image, onClick }: ImageCardProps) {
  const { deleteImage } = useThumbnailGeneratorStore();

  // Handle drag start - set image ID for reference
  const handleDragStart = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData('text/plain', image.id);
      e.dataTransfer.effectAllowed = 'copy';
    },
    [image.id]
  );

  const imageUrl = image.url.startsWith('data:')
    ? image.url
    : `data:image/png;base64,${image.url}`;

  if (image.status === 'generating') {
    return (
      <div className="group relative aspect-video w-full animate-pulse rounded-lg bg-gray-200">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (image.status === 'failed') {
    return (
      <div className="group relative aspect-video w-full rounded-lg border-2 border-red-200 bg-red-50">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
          <span className="text-red-500">Failed</span>
          <p className="text-center text-xs text-red-400">{image.error || 'Unknown error'}</p>
        </div>
        <button
          onClick={() => deleteImage(image.id)}
          className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
          title="Remove"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div
      className="group relative aspect-video w-full cursor-pointer overflow-hidden rounded-lg bg-gray-100 transition-transform hover:scale-[1.02]"
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
    >
      <img
        src={imageUrl}
        alt={image.prompt}
        className="h-full w-full object-cover"
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="line-clamp-2 text-sm text-white">{image.prompt}</p>
        </div>

        {/* Drag hint */}
        <div className="absolute left-2 top-2 rounded bg-white/90 px-2 py-1 text-xs text-gray-700">
          Drag to use as reference
        </div>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteImage(image.id);
          }}
          className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white transition-colors hover:bg-red-600"
          title="Delete"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function ImageGrid() {
  const { images, queue, openModal } = useThumbnailGeneratorStore();

  // Combine queue items (as placeholders) and completed images
  const allItems = [
    ...queue.map((req) => ({
      id: req.id,
      url: '',
      prompt: req.prompt,
      aspectRatio: req.aspectRatio,
      timestamp: Date.now(),
      status: 'generating' as const,
    })),
    ...images,
  ];

  if (allItems.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">No images generated yet</p>
          <p className="mt-1 text-sm text-gray-400">
            Enter a prompt above and click Generate
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {allItems.map((item) => (
        <ImageCard
          key={item.id}
          image={item}
          onClick={() => {
            if (item.status === 'completed') {
              openModal(item.id);
            }
          }}
        />
      ))}
    </div>
  );
}
