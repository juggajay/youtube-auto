'use client';

import { useState, useCallback } from 'react';
import { useThumbnailGeneratorStore } from '@/stores/thumbnail-generator';

export function YouTubeExtractor() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addExternalImage } = useThumbnailGeneratorStore();

  const extractThumbnail = useCallback(async () => {
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/youtube-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract thumbnail');
      }

      if (data.thumbnailUrl) {
        addExternalImage(data.thumbnailUrl, 'youtube');
        setUrl('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [url, addExternalImage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !loading) {
        extractThumbnail();
      }
    },
    [extractThumbnail, loading]
  );

  return (
    <div className="rounded-lg border border-gray-300 bg-white p-4">
      <h3 className="mb-3 text-sm font-medium text-gray-700">Import YouTube Thumbnail</h3>

      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste YouTube video URL..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          disabled={loading}
        />

        <button
          onClick={extractThumbnail}
          disabled={loading || !url.trim()}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
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
              Extracting...
            </span>
          ) : (
            'Extract Thumbnail'
          )}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}

      <p className="mt-2 text-xs text-gray-400">
        Supports youtube.com, youtu.be, and YouTube Shorts URLs
      </p>
    </div>
  );
}
