'use client';

import type { ScriptNodeConfig, HookStyle, HookTone } from '@/stores/nodeConfigStore';

interface Props {
  config: ScriptNodeConfig;
  onChange: (updates: Partial<ScriptNodeConfig>) => void;
}

const HOOK_STYLES: { id: HookStyle; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    id: 'question',
    label: 'Question',
    desc: '"Did you know...?" "What if...?"',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'statistic',
    label: 'Statistic',
    desc: '"97% of people fail at..."',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: 'story',
    label: 'Story',
    desc: '"Last week something crazy happened..."',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: 'controversy',
    label: 'Controversy',
    desc: '"Everyone is wrong about..."',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
      </svg>
    ),
  },
  {
    id: 'promise',
    label: 'Promise',
    desc: '"By the end of this video..."',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
];

const HOOK_TONES: { id: HookTone; label: string; desc: string }[] = [
  { id: 'dramatic', label: 'Dramatic', desc: 'High stakes, urgent' },
  { id: 'conversational', label: 'Conversational', desc: 'Casual, friendly' },
  { id: 'mysterious', label: 'Mysterious', desc: 'Intriguing, curiosity-driven' },
];

export function HooksTab({ config, onChange }: Props) {
  return (
    <div className="hooks-tab space-y-6">
      <div>
        <h4 className="text-lg font-semibold text-white mb-1">Hook Generation</h4>
        <p className="text-sm text-slate-400">Configure how opening hooks are generated</p>
      </div>

      {/* Number of Hooks */}
      <div className="form-group">
        <label className="block text-sm font-medium text-slate-300 mb-2">Hooks to Generate</label>
        <div className="number-selector flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              className={`num-btn w-10 h-10 rounded-lg font-medium transition-all
                ${config.hooksToGenerate === n
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              onClick={() => onChange({ hooksToGenerate: n })}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2">You&apos;ll choose from these options during review</p>
      </div>

      {/* Hook Style */}
      <div className="form-group">
        <label className="block text-sm font-medium text-slate-300 mb-3">Hook Style</label>
        <div className="style-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {HOOK_STYLES.map((style) => (
            <button
              key={style.id}
              className={`style-card flex flex-col items-start p-4 rounded-lg border-2 transition-all text-left
                ${config.hookStyle === style.id
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                }`}
              onClick={() => onChange({ hookStyle: style.id })}
            >
              <span className={`style-icon mb-2 ${config.hookStyle === style.id ? 'text-amber-400' : 'text-slate-400'}`}>
                {style.icon}
              </span>
              <span className={`style-label font-medium ${config.hookStyle === style.id ? 'text-white' : 'text-slate-300'}`}>
                {style.label}
              </span>
              <span className="style-desc text-xs text-slate-500 mt-1">
                {style.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Hook Tone */}
      <div className="form-group">
        <label className="block text-sm font-medium text-slate-300 mb-3">Hook Tone</label>
        <div className="tone-options space-y-2">
          {HOOK_TONES.map((tone) => (
            <label
              key={tone.id}
              className={`radio-card flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                ${config.hookTone === tone.id
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                }`}
            >
              <input
                type="radio"
                name="hookTone"
                className="w-4 h-4 text-amber-500 border-slate-600 bg-slate-700 focus:ring-amber-500 focus:ring-offset-0"
                checked={config.hookTone === tone.id}
                onChange={() => onChange({ hookTone: tone.id })}
              />
              <div className="flex-1">
                <span className={`radio-label font-medium block ${config.hookTone === tone.id ? 'text-white' : 'text-slate-300'}`}>
                  {tone.label}
                </span>
                <span className="radio-desc text-xs text-slate-500">
                  {tone.desc}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="preview bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h5 className="text-sm font-semibold text-slate-300 mb-2">Example Hook</h5>
        <p className="text-sm text-slate-400 italic">
          {config.hookStyle === 'question' && config.hookTone === 'dramatic' && '"What if everything you knew about success was completely wrong?"'}
          {config.hookStyle === 'question' && config.hookTone === 'conversational' && '"Have you ever wondered why some people seem to have all the luck?"'}
          {config.hookStyle === 'question' && config.hookTone === 'mysterious' && '"There\'s a secret that the top 1% doesn\'t want you to know..."'}
          {config.hookStyle === 'statistic' && config.hookTone === 'dramatic' && '"97% of people will never achieve their goals. Here\'s why you\'re probably one of them."'}
          {config.hookStyle === 'statistic' && config.hookTone === 'conversational' && '"Did you know that 8 out of 10 people quit before seeing results?"'}
          {config.hookStyle === 'statistic' && config.hookTone === 'mysterious' && '"A hidden study revealed that 73% of success comes from one surprising factor..."'}
          {config.hookStyle === 'story' && config.hookTone === 'dramatic' && '"I was seconds away from losing everything when I discovered this..."'}
          {config.hookStyle === 'story' && config.hookTone === 'conversational' && '"So last week, something weird happened that changed how I think about this..."'}
          {config.hookStyle === 'story' && config.hookTone === 'mysterious' && '"Three years ago, I stumbled upon something that shouldn\'t exist..."'}
          {config.hookStyle === 'controversy' && config.hookTone === 'dramatic' && '"Everything the experts told you about this is a lie."'}
          {config.hookStyle === 'controversy' && config.hookTone === 'conversational' && '"Okay, hot take here, but I think most people are doing this completely wrong."'}
          {config.hookStyle === 'controversy' && config.hookTone === 'mysterious' && '"What I\'m about to show you goes against everything you\'ve been told..."'}
          {config.hookStyle === 'promise' && config.hookTone === 'dramatic' && '"By the end of this video, you will never see the world the same way again."'}
          {config.hookStyle === 'promise' && config.hookTone === 'conversational' && '"Stick around till the end, and I\'ll show you exactly how to do this yourself."'}
          {config.hookStyle === 'promise' && config.hookTone === 'mysterious' && '"What I\'m about to reveal will unlock something you didn\'t know you had..."'}
        </p>
      </div>
    </div>
  );
}
