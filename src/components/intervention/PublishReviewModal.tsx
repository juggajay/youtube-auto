'use client';

import { useState } from 'react';
import type { InterventionModalProps } from './InterventionContainer';

interface ChannelInfo {
  name: string;
  thumbnail: string;
}

interface PublishGeneratedContent {
  videoUrl: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  tags: string[];
  visibility: string;
  scheduledTime?: string;
  channel: ChannelInfo;
  estimatedReach: string;
}

type Visibility = 'public' | 'unlisted' | 'private';

export function PublishReviewModal({ intervention, onDismiss, onRespond }: InterventionModalProps) {
  // Type assertion for generated content specific to publish node
  const content = intervention.generatedContent as PublishGeneratedContent;

  const [visibility, setVisibility] = useState<Visibility>((content.visibility || 'private') as Visibility);
  const [confirmed, setConfirmed] = useState(false);

  const handlePublish = async () => {
    if (!confirmed) return;

    await onRespond({
      interventionId: intervention.id,
      action: 'approve',
      data: {
        visibility,
        confirmed: true,
      },
    });
  };

  const handleSaveDraft = async () => {
    await onRespond({
      interventionId: intervention.id,
      action: 'skip',
      data: {
        saveDraft: true,
      },
    });
  };

  const visibilityOptions: { value: Visibility; label: string; icon: string }[] = [
    { value: 'public', label: 'Public', icon: '&#x1F30D;' },
    { value: 'unlisted', label: 'Unlisted', icon: '&#x1F517;' },
    { value: 'private', label: 'Private', icon: '&#x1F512;' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-700">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span className="text-2xl">&#x1F680;</span> Ready to Publish
          </h2>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            onClick={onDismiss}
          >
            <span className="text-xl">&times;</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Video Preview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-video rounded-lg overflow-hidden bg-black">
              <video
                src={content.videoUrl}
                controls
                poster={content.thumbnailUrl}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="aspect-video rounded-lg overflow-hidden border border-zinc-700">
              <img
                src={content.thumbnailUrl}
                alt="Thumbnail"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Channel */}
          {content.channel && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
              <img
                src={content.channel.thumbnail}
                alt={content.channel.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <span className="text-white font-medium">{content.channel.name}</span>
            </div>
          )}

          {/* Metadata Summary */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Title</label>
              <p className="text-white font-medium">{content.title}</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Description</label>
              <pre className="text-sm text-zinc-400 whitespace-pre-wrap font-sans bg-zinc-800/50 rounded-lg p-3 max-h-24 overflow-y-auto">
                {content.description.slice(0, 200)}...
              </pre>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Tags</label>
              <div className="flex flex-wrap gap-1.5">
                {content.tags.slice(0, 5).map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-xs text-zinc-400"
                  >
                    {tag}
                  </span>
                ))}
                {content.tags.length > 5 && (
                  <span className="px-2 py-1 text-xs text-zinc-500">
                    +{content.tags.length - 5} more
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Visibility</label>
            <div className="flex gap-2">
              {visibilityOptions.map((option) => (
                <button
                  key={option.value}
                  className={`flex-1 px-4 py-3 rounded-lg border font-medium text-sm transition-colors ${
                    visibility === option.value
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-white'
                  }`}
                  onClick={() => setVisibility(option.value)}
                >
                  <span dangerouslySetInnerHTML={{ __html: option.icon }} /> {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scheduled Time */}
          {content.scheduledTime && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <span>&#x1F4C5;</span>
              <span>Scheduled for: {new Date(content.scheduledTime).toLocaleString()}</span>
            </div>
          )}

          {/* Confirmation Checkbox */}
          <div className="p-4 rounded-lg border border-zinc-700 bg-zinc-800/30">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-zinc-600 bg-zinc-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 focus:ring-offset-zinc-900"
              />
              <span className="text-sm text-zinc-300">
                I confirm this video is ready to be published to YouTube
                {visibility === 'public' && (
                  <span className="text-amber-400 font-medium"> and will be visible to everyone</span>
                )}
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-700">
          <button
            className="px-4 py-2 rounded-lg border border-zinc-600 text-zinc-300 hover:bg-zinc-800 transition-colors font-medium text-sm flex items-center gap-2"
            onClick={handleSaveDraft}
          >
            <span>&#x1F4BE;</span> Save as Draft
          </button>
          <button
            className="px-4 py-2 rounded-lg border border-zinc-600 text-zinc-300 hover:bg-zinc-800 transition-colors font-medium text-sm flex items-center gap-2"
            onClick={onDismiss}
          >
            <span>&larr;</span> Go Back
          </button>
          <button
            className="px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white transition-colors font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handlePublish}
            disabled={!confirmed}
          >
            <span>&#x1F680;</span> Publish to YouTube
          </button>
        </div>
      </div>
    </div>
  );
}
