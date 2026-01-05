'use client';

import { useThumbnailGeneratorStore, AspectRatio } from '@/stores/thumbnail-generator';

const ASPECT_RATIOS: { value: AspectRatio; label: string; icon: string }[] = [
  { value: '16:9', label: '16:9', icon: '▬' },
  { value: '1:1', label: '1:1', icon: '■' },
  { value: '4:3', label: '4:3', icon: '▭' },
  { value: '9:16', label: '9:16', icon: '▮' },
];

export function AspectRatioSelector() {
  const { aspectRatio, setAspectRatio } = useThumbnailGeneratorStore();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Aspect Ratio:</span>
      <div className="flex rounded-lg border border-gray-300 bg-white p-1">
        {ASPECT_RATIOS.map((ratio) => (
          <button
            key={ratio.value}
            onClick={() => setAspectRatio(ratio.value)}
            className={`flex items-center gap-1 rounded px-3 py-1.5 text-sm transition-colors ${
              aspectRatio === ratio.value
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            title={ratio.label}
          >
            <span className="text-xs">{ratio.icon}</span>
            <span>{ratio.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
