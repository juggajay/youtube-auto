'use client';

import { useState } from 'react';
import { useRunInitStore } from '@/stores/runInitStore';

interface Props {
  onNext: () => void;
}

export function VideoIdeaForm({ onNext }: Props) {
  const { videoIdea, updateVideoIdea, addMustInclude, removeMustInclude, addMustAvoid, removeMustAvoid } = useRunInitStore();
  const [showDetails, setShowDetails] = useState(false);
  const [newMustInclude, setNewMustInclude] = useState('');
  const [newMustAvoid, setNewMustAvoid] = useState('');

  const canProceed = videoIdea.topic.trim().length > 0;

  const handleAddMustInclude = () => {
    if (newMustInclude.trim()) {
      addMustInclude(newMustInclude.trim());
      setNewMustInclude('');
    }
  };

  const handleAddMustAvoid = () => {
    if (newMustAvoid.trim()) {
      addMustAvoid(newMustAvoid.trim());
      setNewMustAvoid('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Topic - Always Visible */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-300">
          What's your video about?
        </label>
        <textarea
          className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-600 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="e.g., Why most productivity advice is wrong and what actually works..."
          value={videoIdea.topic}
          onChange={(e) => updateVideoIdea({ topic: e.target.value })}
          rows={3}
        />
        <div className="flex justify-between text-xs text-zinc-500">
          <span>{videoIdea.topic.length} characters</span>
          {videoIdea.topic.length > 0 && videoIdea.topic.length < 10 && (
            <span className="text-amber-500">Add more detail for better results</span>
          )}
        </div>
      </div>

      {/* Expandable Details Toggle */}
      <button
        type="button"
        className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        onClick={() => setShowDetails(!showDetails)}
      >
        <svg
          className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {showDetails ? 'Hide details' : 'Add details (angle, audience, requirements)'}
      </button>

      {/* Expandable Details Section */}
      {showDetails && (
        <div className="space-y-5 pt-2 border-t border-zinc-700">
          {/* Angle */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">
              Angle / Hook
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-600 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Contrarian take, Personal story, Data-driven..."
              value={videoIdea.angle}
              onChange={(e) => updateVideoIdea({ angle: e.target.value })}
            />
          </div>

          {/* Target Audience */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">
              Target Audience
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-600 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Entrepreneurs aged 25-40 struggling with time management"
              value={videoIdea.targetAudience}
              onChange={(e) => updateVideoIdea({ targetAudience: e.target.value })}
            />
          </div>

          {/* Must Include */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">
              Must Include
            </label>
            <div className="space-y-2">
              {videoIdea.mustInclude.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {videoIdea.mustInclude.map((item, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/40 border border-emerald-700/50 text-emerald-300 text-sm"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeMustInclude(i)}
                        className="hover:text-emerald-100 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                type="text"
                className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-600 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add requirement and press Enter"
                value={newMustInclude}
                onChange={(e) => setNewMustInclude(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMustInclude();
                  }
                }}
              />
            </div>
          </div>

          {/* Must Avoid */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">
              Must Avoid
            </label>
            <div className="space-y-2">
              {videoIdea.mustAvoid.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {videoIdea.mustAvoid.map((item, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-900/40 border border-red-700/50 text-red-300 text-sm"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeMustAvoid(i)}
                        className="hover:text-red-100 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                type="text"
                className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-600 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add thing to avoid and press Enter"
                value={newMustAvoid}
                onChange={(e) => setNewMustAvoid(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMustAvoid();
                  }
                }}
              />
            </div>
          </div>

          {/* Reference URL */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">
              Reference Video URL <span className="text-zinc-500">(optional)</span>
            </label>
            <input
              type="url"
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-600 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://youtube.com/watch?v=..."
              value={videoIdea.referenceUrl}
              onChange={(e) => updateVideoIdea({ referenceUrl: e.target.value })}
            />
            <p className="text-xs text-zinc-500">
              AI will analyze this video's style and structure
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end pt-4 border-t border-zinc-700">
        <button
          type="button"
          className={`
            px-6 py-2.5 rounded-lg font-medium transition-all
            ${canProceed
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
            }
          `}
          disabled={!canProceed}
          onClick={onNext}
        >
          Choose Format
          <span className="ml-2">&#8594;</span>
        </button>
      </div>
    </div>
  );
}
