'use client';

import { useMemo } from 'react';
import { useRunInitStore } from '@/stores/runInitStore';

interface CostItem {
  min: number;
  max: number;
  unit: 'cents';
  provider: string;
}

const COST_ESTIMATES: Record<string, CostItem> = {
  script: { min: 5, max: 15, unit: 'cents', provider: 'Claude API' },
  voice: { min: 50, max: 200, unit: 'cents', provider: 'ElevenLabs' },
  thumbnail: { min: 10, max: 40, unit: 'cents', provider: 'Gemini/DALL-E' },
  assembly: { min: 0, max: 0, unit: 'cents', provider: 'Local FFmpeg' },
  publish: { min: 0, max: 0, unit: 'cents', provider: 'YouTube API' },
};

export function CostEstimator() {
  const { videoIdea, archetypeId } = useRunInitStore();

  const estimate = useMemo(() => {
    // Rough estimate based on topic length and complexity
    const baseMultiplier = Math.max(1, videoIdea.topic.length / 100);

    // Adjust for additional details
    let complexityMultiplier = 1;
    if (videoIdea.angle) complexityMultiplier += 0.1;
    if (videoIdea.targetAudience) complexityMultiplier += 0.1;
    if (videoIdea.mustInclude.length > 0) complexityMultiplier += 0.05 * videoIdea.mustInclude.length;
    if (videoIdea.referenceUrl) complexityMultiplier += 0.2;

    const multiplier = baseMultiplier * complexityMultiplier;

    let totalMin = 0;
    let totalMax = 0;

    Object.values(COST_ESTIMATES).forEach(({ min, max }) => {
      totalMin += min * multiplier;
      totalMax += max * multiplier;
    });

    return {
      min: Math.round(totalMin),
      max: Math.round(totalMax),
      breakdown: COST_ESTIMATES,
      multiplier,
    };
  }, [videoIdea]);

  const handleStartPipeline = () => {
    // TODO: Implement pipeline start logic
    console.log('Starting pipeline with:', {
      videoIdea,
      archetypeId,
      estimatedCost: estimate,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white">Estimated Cost</h3>

      {/* Cost Total */}
      <div className="p-4 rounded-lg bg-gradient-to-r from-zinc-800 to-zinc-800/50 border border-zinc-700">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">
            ${(estimate.min / 100).toFixed(2)} - ${(estimate.max / 100).toFixed(2)}
          </span>
        </div>
        <span className="text-sm text-zinc-400">estimated for this run</span>
      </div>

      {/* Cost Breakdown - Collapsible */}
      <details className="group">
        <summary className="flex items-center gap-2 cursor-pointer text-sm text-zinc-400 hover:text-zinc-300 transition-colors">
          <svg
            className="w-4 h-4 transition-transform group-open:rotate-90"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          View breakdown
        </summary>
        <div className="mt-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-500 text-xs uppercase">
                <th className="text-left py-2">Node</th>
                <th className="text-left py-2">Provider</th>
                <th className="text-right py-2">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700">
              {Object.entries(estimate.breakdown).map(([node, cost]) => (
                <tr key={node}>
                  <td className="py-2 capitalize text-zinc-300">{node}</td>
                  <td className="py-2 text-zinc-500">{cost.provider}</td>
                  <td className="py-2 text-right text-zinc-300">
                    {cost.min === 0 && cost.max === 0 ? (
                      <span className="text-emerald-400">Free</span>
                    ) : (
                      `${Math.round(cost.min * estimate.multiplier)}-${Math.round(cost.max * estimate.multiplier)}c`
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      {/* Disclaimer */}
      <p className="text-xs text-zinc-500">
        Actual costs may vary based on content length and complexity. You will be charged by each provider directly.
      </p>

      {/* Start Pipeline Button */}
      <div className="pt-4 border-t border-zinc-700">
        <button
          type="button"
          className="w-full py-3 px-6 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2"
          onClick={handleStartPipeline}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Start Pipeline
        </button>
      </div>
    </div>
  );
}
