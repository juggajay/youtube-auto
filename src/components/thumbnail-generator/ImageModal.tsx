'use client';

import { useEffect, useCallback } from 'react';
import { useThumbnailGeneratorStore } from '@/stores/thumbnail-generator';

export function ImageModal() {
  const {
    modalOpen,
    modalImageId,
    images,
    closeModal,
    navigateModal,
    insertReferenceToPrompt,
    deleteImage,
  } = useThumbnailGeneratorStore();

  // Get current image
  const currentImage = images.find((img) => img.id === modalImageId);
  const completedImages = images.filter((img) => img.status === 'completed');
  const currentIndex = completedImages.findIndex((img) => img.id === modalImageId);
  const totalImages = completedImages.length;

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!modalOpen) return;

      switch (e.key) {
        case 'Escape':
          closeModal();
          break;
        case 'ArrowLeft':
          navigateModal('prev');
          break;
        case 'ArrowRight':
          navigateModal('next');
          break;
        case 'i':
        case 'I':
          if (modalImageId) {
            insertReferenceToPrompt(modalImageId);
          }
          break;
        case 'Delete':
        case 'Backspace':
          if (modalImageId) {
            deleteImage(modalImageId);
          }
          break;
      }
    },
    [modalOpen, modalImageId, closeModal, navigateModal, insertReferenceToPrompt, deleteImage]
  );

  // Add keyboard listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalOpen]);

  if (!modalOpen || !currentImage) return null;

  const imageUrl = currentImage.url.startsWith('data:')
    ? currentImage.url
    : `data:image/png;base64,${currentImage.url}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={closeModal}
    >
      {/* Close button */}
      <button
        onClick={closeModal}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        title="Close (Esc)"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Navigation arrows */}
      {totalImages > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigateModal('prev');
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
            title="Previous (Left Arrow)"
          >
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              navigateModal('next');
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
            title="Next (Right Arrow)"
          >
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Main image container */}
      <div
        className="relative max-h-[90vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={currentImage.prompt}
          className="max-h-[80vh] rounded-lg object-contain"
        />

        {/* Image info and actions */}
        <div className="absolute bottom-0 left-0 right-0 rounded-b-lg bg-gradient-to-t from-black/80 to-transparent p-4">
          <p className="mb-3 text-white">{currentImage.prompt}</p>

          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">
              {currentIndex + 1} of {totalImages}
            </span>

            <div className="flex gap-2">
              <button
                onClick={() => insertReferenceToPrompt(currentImage.id)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
                title="Insert into prompt (I)"
              >
                Insert into Prompt
              </button>

              <a
                href={imageUrl}
                download={`thumbnail-${currentImage.id}.png`}
                onClick={(e) => e.stopPropagation()}
                className="rounded-lg bg-white/20 px-4 py-2 text-sm text-white transition-colors hover:bg-white/30"
                title="Download"
              >
                Download
              </a>

              <button
                onClick={() => deleteImage(currentImage.id)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700"
                title="Delete (Del)"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="absolute bottom-4 left-4 text-sm text-white/50">
        <kbd className="rounded bg-white/10 px-1">←</kbd> <kbd className="rounded bg-white/10 px-1">→</kbd> Navigate |{' '}
        <kbd className="rounded bg-white/10 px-1">I</kbd> Insert |{' '}
        <kbd className="rounded bg-white/10 px-1">Esc</kbd> Close
      </div>
    </div>
  );
}
