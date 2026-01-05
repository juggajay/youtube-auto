'use client';

import { useRef, useCallback, DragEvent } from 'react';
import { useThumbnailGeneratorStore } from '@/stores/thumbnail-generator';

interface PromptInputProps {
  onGenerate: (count: number) => void;
  disabled?: boolean;
}

export function PromptInput({ onGenerate, disabled }: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { prompt, setPrompt, referenceImages, images, addReference } = useThumbnailGeneratorStore();

  // Get reference image previews
  const referencePreviews = referenceImages
    .map((id) => images.find((img) => img.id === id))
    .filter((img) => img !== undefined);

  // Handle drag over
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('ring-2', 'ring-blue-500');
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('ring-2', 'ring-blue-500');
  }, []);

  // Handle drop - add image as reference
  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.classList.remove('ring-2', 'ring-blue-500');

      const imageId = e.dataTransfer.getData('text/plain');
      if (imageId) {
        addReference(imageId);
      }
    },
    [addReference]
  );

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Ctrl/Cmd + Enter to generate
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!disabled && prompt.trim()) {
          onGenerate(1);
        }
      }
      // Ctrl/Cmd + Shift + Enter to generate multiple
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        if (!disabled && prompt.trim()) {
          onGenerate(4);
        }
      }
    },
    [disabled, prompt, onGenerate]
  );

  return (
    <div
      className="relative rounded-lg border border-gray-300 bg-white p-4 transition-all"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Reference images preview */}
      {referencePreviews.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="text-sm text-gray-500">References:</span>
          {referencePreviews.map((img) => (
            <div key={img.id} className="relative group">
              <img
                src={img.url.startsWith('data:') ? img.url : `data:image/png;base64,${img.url}`}
                alt="Reference"
                className="h-12 w-12 rounded object-cover"
              />
              <button
                onClick={() => useThumbnailGeneratorStore.getState().removeReference(img.id)}
                className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white group-hover:flex"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Prompt textarea */}
      <textarea
        ref={textareaRef}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Describe the thumbnail you want to generate... Use @element to reference assets. Drag images here to use as references."
        className="min-h-[100px] w-full resize-none border-none bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none"
        disabled={disabled}
      />

      {/* Help text */}
      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
        <span>
          Drag images here to use as references. Type @ to reference elements.
        </span>
        <span>
          <kbd className="rounded bg-gray-100 px-1">Ctrl+Enter</kbd> generate |{' '}
          <kbd className="rounded bg-gray-100 px-1">Ctrl+Shift+Enter</kbd> generate 4x
        </span>
      </div>
    </div>
  );
}
