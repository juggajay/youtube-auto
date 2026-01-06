'use client';

import { useRunInitStore } from '@/stores/runInitStore';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

// Archetype data - in production this would come from docs/archetypes.json
const ARCHETYPES = [
  {
    id: 'explainer',
    name: 'Explainer',
    icon: '📚',
    shortDescription: 'Deep dive into a concept or topic',
    typicalLength: '8-12 min',
    tone: 'Educational',
    sections: [
      { name: 'Hook', duration: '0:15' },
      { name: 'Problem Statement', duration: '1:00' },
      { name: 'Background Context', duration: '2:00' },
      { name: 'Main Explanation', duration: '5:00' },
      { name: 'Examples & Applications', duration: '2:00' },
      { name: 'Key Takeaways', duration: '1:00' },
      { name: 'Call to Action', duration: '0:30' },
    ],
  },
  {
    id: 'vs_battle',
    name: 'VS Battle',
    icon: '⚔️',
    shortDescription: 'Compare two products, tools, or ideas',
    typicalLength: '10-15 min',
    tone: 'Analytical',
    sections: [
      { name: 'Hook', duration: '0:20' },
      { name: 'Context', duration: '1:00' },
      { name: 'Contender A Overview', duration: '2:00' },
      { name: 'Contender B Overview', duration: '2:00' },
      { name: 'Head-to-Head Comparison', duration: '5:00' },
      { name: 'Verdict & Recommendation', duration: '2:00' },
      { name: 'Call to Action', duration: '0:30' },
    ],
  },
  {
    id: 'listicle',
    name: 'Listicle',
    icon: '📋',
    shortDescription: 'Ranked list of items or tips',
    typicalLength: '8-12 min',
    tone: 'Engaging',
    sections: [
      { name: 'Hook', duration: '0:15' },
      { name: 'Why This List Matters', duration: '0:45' },
      { name: 'Items 10-6', duration: '3:00' },
      { name: 'Items 5-2', duration: '4:00' },
      { name: 'Number 1 Reveal', duration: '2:00' },
      { name: 'Honorable Mentions', duration: '1:00' },
      { name: 'Call to Action', duration: '0:30' },
    ],
  },
  {
    id: 'tutorial',
    name: 'Tutorial',
    icon: '🎓',
    shortDescription: 'Step-by-step how-to guide',
    typicalLength: '10-20 min',
    tone: 'Instructional',
    sections: [
      { name: 'Hook & End Result Preview', duration: '0:30' },
      { name: 'Prerequisites', duration: '1:00' },
      { name: 'Step 1', duration: '3:00' },
      { name: 'Step 2', duration: '3:00' },
      { name: 'Step 3', duration: '3:00' },
      { name: 'Common Mistakes', duration: '2:00' },
      { name: 'Final Result & Tips', duration: '1:30' },
      { name: 'Call to Action', duration: '0:30' },
    ],
  },
  {
    id: 'news',
    name: 'News/Update',
    icon: '📰',
    shortDescription: 'Breaking news or recent developments',
    typicalLength: '5-8 min',
    tone: 'Informative',
    sections: [
      { name: 'Breaking News Hook', duration: '0:15' },
      { name: 'What Happened', duration: '1:30' },
      { name: 'Why It Matters', duration: '2:00' },
      { name: 'Expert Reactions', duration: '1:30' },
      { name: 'What This Means For You', duration: '1:30' },
      { name: 'Call to Action', duration: '0:30' },
    ],
  },
  {
    id: 'story',
    name: 'Story/Case Study',
    icon: '📖',
    shortDescription: 'Narrative-driven content',
    typicalLength: '12-18 min',
    tone: 'Storytelling',
    sections: [
      { name: 'Compelling Hook', duration: '0:30' },
      { name: 'Setting the Scene', duration: '2:00' },
      { name: 'Rising Action', duration: '4:00' },
      { name: 'The Turning Point', duration: '2:00' },
      { name: 'Resolution', duration: '2:00' },
      { name: 'Lessons Learned', duration: '2:00' },
      { name: 'Call to Action', duration: '0:30' },
    ],
  },
];

export function ArchetypeSelector({ onNext, onBack }: Props) {
  const { archetypeId, setArchetype } = useRunInitStore();

  const selectedArchetype = ARCHETYPES.find(a => a.id === archetypeId);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-white">Choose Video Format</h3>
        <p className="text-sm text-zinc-400">
          Select the structure that best fits your content
        </p>
      </div>

      {/* Archetype Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {ARCHETYPES.map((arch) => (
          <button
            key={arch.id}
            type="button"
            className={`
              relative p-4 rounded-lg text-left transition-all
              ${archetypeId === arch.id
                ? 'bg-blue-600/20 border-2 border-blue-500 ring-2 ring-blue-500/20'
                : 'bg-zinc-800 border border-zinc-700 hover:border-zinc-500'
              }
            `}
            onClick={() => setArchetype(arch.id)}
          >
            {archetypeId === arch.id && (
              <div className="absolute top-2 right-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <div className="text-2xl mb-2">{arch.icon}</div>
            <div className="font-medium text-white text-sm">{arch.name}</div>
            <div className="text-xs text-zinc-400 mt-1 line-clamp-2">
              {arch.shortDescription}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-zinc-500">{arch.typicalLength}</span>
              <span className="text-xs text-zinc-600">|</span>
              <span className="text-xs text-zinc-500">{arch.tone}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Structure Preview */}
      {selectedArchetype && (
        <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
          <h4 className="text-sm font-medium text-zinc-300 mb-3">
            Structure Preview
          </h4>
          <ol className="space-y-2">
            {selectedArchetype.sections.map((section, i) => (
              <li
                key={i}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2 text-zinc-300">
                  <span className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-400">
                    {i + 1}
                  </span>
                  {section.name}
                </span>
                <span className="text-zinc-500 text-xs">{section.duration}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t border-zinc-700">
        <button
          type="button"
          className="px-5 py-2.5 rounded-lg font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all"
          onClick={onBack}
        >
          <span className="mr-2">&#8592;</span>
          Back
        </button>
        <button
          type="button"
          className={`
            px-6 py-2.5 rounded-lg font-medium transition-all
            ${archetypeId
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
            }
          `}
          disabled={!archetypeId}
          onClick={onNext}
        >
          Review & Start
          <span className="ml-2">&#8594;</span>
        </button>
      </div>
    </div>
  );
}

// Export archetypes for use elsewhere
export { ARCHETYPES };
