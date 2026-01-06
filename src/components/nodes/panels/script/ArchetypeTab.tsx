'use client';

import type { ScriptNodeConfig } from '@/stores/nodeConfigStore';

interface Props {
  config: ScriptNodeConfig;
  onChange: (updates: Partial<ScriptNodeConfig>) => void;
}

// Default archetypes for video formats
const ARCHETYPES = [
  {
    id: 'listicle',
    name: 'Listicle',
    icon: 'list',
    description: 'Numbered list format (7 Tips, 10 Mistakes, etc.)',
    typicalLength: '8-12 min',
    sections: [
      { name: 'Hook', duration: '15s' },
      { name: 'Intro', duration: '30s' },
      { name: 'List Items (x5-10)', duration: '6-10m' },
      { name: 'Recap', duration: '30s' },
      { name: 'CTA', duration: '15s' },
    ],
  },
  {
    id: 'tutorial',
    name: 'Tutorial',
    icon: 'tutorial',
    description: 'Step-by-step educational content',
    typicalLength: '10-20 min',
    sections: [
      { name: 'Hook', duration: '15s' },
      { name: 'What You\'ll Learn', duration: '30s' },
      { name: 'Prerequisites', duration: '1m' },
      { name: 'Steps', duration: '8-15m' },
      { name: 'Summary', duration: '1m' },
      { name: 'CTA', duration: '15s' },
    ],
  },
  {
    id: 'story',
    name: 'Story',
    icon: 'story',
    description: 'Narrative-driven content with arc',
    typicalLength: '12-20 min',
    sections: [
      { name: 'Opening Hook', duration: '30s' },
      { name: 'Setup', duration: '2m' },
      { name: 'Rising Action', duration: '5-8m' },
      { name: 'Climax', duration: '3m' },
      { name: 'Resolution', duration: '2m' },
      { name: 'Lesson/CTA', duration: '1m' },
    ],
  },
  {
    id: 'explainer',
    name: 'Explainer',
    icon: 'explainer',
    description: 'Deep dive into a single topic',
    typicalLength: '10-15 min',
    sections: [
      { name: 'Hook Question', duration: '15s' },
      { name: 'Why This Matters', duration: '1m' },
      { name: 'Background', duration: '2m' },
      { name: 'Main Explanation', duration: '6-10m' },
      { name: 'Examples', duration: '2m' },
      { name: 'Takeaways', duration: '1m' },
    ],
  },
  {
    id: 'comparison',
    name: 'Comparison',
    icon: 'comparison',
    description: 'X vs Y format with verdict',
    typicalLength: '10-15 min',
    sections: [
      { name: 'Hook', duration: '15s' },
      { name: 'Intro Both Options', duration: '1m' },
      { name: 'Criteria Setup', duration: '30s' },
      { name: 'Comparisons', duration: '8-12m' },
      { name: 'Verdict', duration: '1m' },
      { name: 'CTA', duration: '15s' },
    ],
  },
  {
    id: 'reaction',
    name: 'Reaction',
    icon: 'reaction',
    description: 'React and comment on content',
    typicalLength: '8-15 min',
    sections: [
      { name: 'Hook', duration: '15s' },
      { name: 'Context', duration: '1m' },
      { name: 'Reaction Segments', duration: '6-12m' },
      { name: 'Overall Thoughts', duration: '1m' },
      { name: 'CTA', duration: '15s' },
    ],
  },
  {
    id: 'challenge',
    name: 'Challenge',
    icon: 'challenge',
    description: 'Attempting something difficult',
    typicalLength: '12-20 min',
    sections: [
      { name: 'Hook/Tease Result', duration: '30s' },
      { name: 'Challenge Setup', duration: '1m' },
      { name: 'Rules', duration: '30s' },
      { name: 'Attempt', duration: '8-15m' },
      { name: 'Result', duration: '1m' },
      { name: 'Reflection/CTA', duration: '1m' },
    ],
  },
  {
    id: 'shorts',
    name: 'Short',
    icon: 'short',
    description: 'YouTube Shorts format (<60s)',
    typicalLength: '<60s',
    sections: [
      { name: 'Hook', duration: '3s' },
      { name: 'Content', duration: '45s' },
      { name: 'CTA', duration: '5s' },
    ],
  },
];

const getArchetypeIcon = (iconName: string) => {
  const icons: Record<string, React.ReactNode> = {
    list: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
    tutorial: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    story: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
      </svg>
    ),
    explainer: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    comparison: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    reaction: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    challenge: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    short: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  };
  return icons[iconName] || icons.list;
};

export function ArchetypeTab({ config, onChange }: Props) {
  const selectedArchetype = ARCHETYPES.find(a => a.id === config.archetypeId);

  return (
    <div className="archetype-tab space-y-6">
      <div>
        <h4 className="text-lg font-semibold text-white mb-1">Video Format</h4>
        <p className="text-sm text-slate-400">Choose the structure template for your script</p>
      </div>

      {/* Archetype Grid */}
      <div className="archetype-grid grid grid-cols-2 md:grid-cols-4 gap-3">
        {ARCHETYPES.map((arch) => (
          <button
            key={arch.id}
            className={`archetype-card flex flex-col items-center p-4 rounded-lg border-2 transition-all
              ${config.archetypeId === arch.id
                ? 'border-amber-500 bg-amber-500/10'
                : 'border-slate-600 bg-slate-800 hover:border-slate-500'
              }`}
            onClick={() => onChange({ archetypeId: arch.id })}
          >
            <span className={`archetype-icon mb-2 ${config.archetypeId === arch.id ? 'text-amber-400' : 'text-slate-400'}`}>
              {getArchetypeIcon(arch.icon)}
            </span>
            <span className={`archetype-name text-sm font-medium ${config.archetypeId === arch.id ? 'text-white' : 'text-slate-300'}`}>
              {arch.name}
            </span>
            <span className="archetype-duration text-xs text-slate-500 mt-1">
              {arch.typicalLength}
            </span>
          </button>
        ))}
      </div>

      {/* Selected Archetype Preview */}
      {selectedArchetype && (
        <div className="archetype-preview bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h5 className="text-sm font-semibold text-white mb-2">Structure Preview</h5>
          <p className="archetype-description text-sm text-slate-400 mb-4">
            {selectedArchetype.description}
          </p>
          <div className="section-timeline space-y-2">
            {selectedArchetype.sections.map((section, i) => (
              <div
                key={i}
                className="timeline-item flex items-center gap-3 text-sm"
              >
                <span className="section-number w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-medium">
                  {i + 1}
                </span>
                <span className="section-name flex-1 text-slate-300">
                  {section.name}
                </span>
                <span className="section-duration text-slate-500">
                  {section.duration}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-500">
              Tip: You can customize this structure in the Structure tab after selecting a format.
            </p>
          </div>
        </div>
      )}

      {/* No Selection State */}
      {!selectedArchetype && (
        <div className="no-selection bg-slate-800/50 rounded-lg p-6 border border-dashed border-slate-600 text-center">
          <svg className="w-12 h-12 mx-auto text-slate-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-slate-400 text-sm">Select a video format to see its structure</p>
        </div>
      )}
    </div>
  );
}
