'use client';

import { useRunInitStore } from '@/stores/runInitStore';

export function InterventionCheckboxes() {
  const { interventions, setInterventions } = useRunInitStore();

  const reviewCount = [
    interventions.reviewScript,
    interventions.reviewThumbnail,
    interventions.reviewBeforePublish,
  ].filter(Boolean).length;

  const isFullyAutonomous = reviewCount === 0;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-medium text-white">Review Points</h3>
        <p className="text-sm text-zinc-400">
          Check where you want the pipeline to pause for your approval
        </p>
      </div>

      <div className="space-y-3">
        {/* Review Script */}
        <label className="flex items-start gap-4 p-4 rounded-lg bg-zinc-800 border border-zinc-700 cursor-pointer hover:border-zinc-600 transition-colors">
          <div className="pt-0.5">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-zinc-900"
              checked={interventions.reviewScript}
              onChange={(e) => setInterventions({ reviewScript: e.target.checked })}
            />
          </div>
          <div className="flex-1">
            <div className="font-medium text-white">Review Script</div>
            <div className="text-sm text-zinc-400 mt-0.5">
              Pause after script generation to review, edit, and approve before voice generation
            </div>
          </div>
        </label>

        {/* Review Thumbnail */}
        <label className="flex items-start gap-4 p-4 rounded-lg bg-zinc-800 border border-zinc-700 cursor-pointer hover:border-zinc-600 transition-colors">
          <div className="pt-0.5">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-zinc-900"
              checked={interventions.reviewThumbnail}
              onChange={(e) => setInterventions({ reviewThumbnail: e.target.checked })}
            />
          </div>
          <div className="flex-1">
            <div className="font-medium text-white">Review Thumbnail Options</div>
            <div className="text-sm text-zinc-400 mt-0.5">
              Pause to select from generated thumbnails or request more variations
            </div>
          </div>
        </label>

        {/* Review Before Publish - Recommended */}
        <label className="flex items-start gap-4 p-4 rounded-lg bg-zinc-800 border-2 border-emerald-700/50 cursor-pointer hover:border-emerald-600/50 transition-colors relative">
          <div className="pt-0.5">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-zinc-900"
              checked={interventions.reviewBeforePublish}
              onChange={(e) => setInterventions({ reviewBeforePublish: e.target.checked })}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">Review Before Publish</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-900/50 text-emerald-400 text-xs font-medium">
                Recommended
              </span>
            </div>
            <div className="text-sm text-zinc-400 mt-0.5">
              Final review of video, metadata, and settings before uploading to YouTube
            </div>
          </div>
        </label>
      </div>

      {/* Autonomy Indicator */}
      <div className={`
        flex items-center gap-3 p-3 rounded-lg
        ${isFullyAutonomous
          ? 'bg-amber-900/20 border border-amber-700/30'
          : 'bg-blue-900/20 border border-blue-700/30'
        }
      `}>
        {isFullyAutonomous ? (
          <>
            <span className="text-xl">&#9889;</span>
            <div className="flex-1">
              <div className="font-medium text-amber-300 text-sm">
                Fully Autonomous
              </div>
              <div className="text-xs text-amber-400/70">
                Pipeline runs without interruption - use with caution
              </div>
            </div>
          </>
        ) : (
          <>
            <span className="text-xl">&#128721;</span>
            <div className="flex-1">
              <div className="font-medium text-blue-300 text-sm">
                {reviewCount} review point{reviewCount > 1 ? 's' : ''} enabled
              </div>
              <div className="text-xs text-blue-400/70">
                Pipeline will pause for your input at selected stages
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
