'use client';

import type { ScriptNodeConfig, ChannelBibleOverride } from '@/stores/nodeConfigStore';

interface Props {
  config: ScriptNodeConfig;
  onChange: (updates: Partial<ScriptNodeConfig>) => void;
}

export function BibleOverrideTab({ config, onChange }: Props) {
  const updateBibleOverride = (key: keyof ChannelBibleOverride, value: string | string[]) => {
    onChange({
      bibleOverrides: {
        ...config.bibleOverrides,
        [key]: value,
      },
    });
  };

  const addVocabularyWord = (word: string) => {
    const trimmed = word.trim();
    if (!trimmed) return;
    const current = config.bibleOverrides.vocabulary || [];
    if (!current.includes(trimmed)) {
      updateBibleOverride('vocabulary', [...current, trimmed]);
    }
  };

  const removeVocabularyWord = (word: string) => {
    const current = config.bibleOverrides.vocabulary || [];
    updateBibleOverride('vocabulary', current.filter(w => w !== word));
  };

  const addBannedWord = (word: string) => {
    const trimmed = word.trim();
    if (!trimmed) return;
    const current = config.bibleOverrides.bannedWords || [];
    if (!current.includes(trimmed)) {
      updateBibleOverride('bannedWords', [...current, trimmed]);
    }
  };

  const removeBannedWord = (word: string) => {
    const current = config.bibleOverrides.bannedWords || [];
    updateBibleOverride('bannedWords', current.filter(w => w !== word));
  };

  return (
    <div className="bible-override-tab space-y-6">
      <div>
        <h4 className="text-lg font-semibold text-white mb-1">Channel Bible Override</h4>
        <p className="text-sm text-slate-400">Override channel defaults for this specific script</p>
      </div>

      {/* Use Bible Toggle */}
      <div className="form-group">
        <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg bg-slate-800 border border-slate-700">
          <input
            type="checkbox"
            className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
            checked={config.useBible}
            onChange={(e) => onChange({ useBible: e.target.checked })}
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-white block">Use Channel Bible</span>
            <span className="text-xs text-slate-400">Apply your channel&apos;s style guide to this script</span>
          </div>
          {config.useBible && (
            <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">Active</span>
          )}
        </label>
      </div>

      {config.useBible && (
        <>
          {/* Info Banner */}
          <div className="info-banner flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-blue-300">
              Overrides set here will only apply to this script. Leave fields empty to use your channel&apos;s default bible settings.
            </p>
          </div>

          {/* Tone Override */}
          <div className="form-group">
            <label className="block text-sm font-medium text-slate-300 mb-2">Tone Override</label>
            <select
              className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-amber-500 focus:ring-0"
              value={config.bibleOverrides.tone || ''}
              onChange={(e) => updateBibleOverride('tone', e.target.value)}
            >
              <option value="">Use channel default</option>
              <option value="professional">Professional</option>
              <option value="casual">Casual / Conversational</option>
              <option value="educational">Educational</option>
              <option value="entertaining">Entertaining</option>
              <option value="inspirational">Inspirational</option>
              <option value="authoritative">Authoritative</option>
              <option value="friendly">Friendly</option>
              <option value="humorous">Humorous</option>
            </select>
          </div>

          {/* Target Audience Override */}
          <div className="form-group">
            <label className="block text-sm font-medium text-slate-300 mb-2">Target Audience Override</label>
            <input
              type="text"
              className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-amber-500 focus:ring-0"
              placeholder="e.g., Beginners, Professionals, Tech enthusiasts"
              value={config.bibleOverrides.targetAudience || ''}
              onChange={(e) => updateBibleOverride('targetAudience', e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-1">Leave empty to use channel default</p>
          </div>

          {/* Brand Voice Override */}
          <div className="form-group">
            <label className="block text-sm font-medium text-slate-300 mb-2">Brand Voice Override</label>
            <textarea
              className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-amber-500 focus:ring-0 resize-none"
              rows={3}
              placeholder="Describe the specific voice for this video..."
              value={config.bibleOverrides.brandVoice || ''}
              onChange={(e) => updateBibleOverride('brandVoice', e.target.value)}
            />
          </div>

          {/* Vocabulary Override */}
          <div className="form-group">
            <label className="block text-sm font-medium text-slate-300 mb-1">Vocabulary Override</label>
            <p className="text-xs text-slate-500 mb-3">Words and phrases to use in this script</p>

            <div className="words-list flex flex-wrap gap-2 mb-3 min-h-[40px] p-2 rounded-lg bg-slate-800 border border-slate-700">
              {(!config.bibleOverrides.vocabulary || config.bibleOverrides.vocabulary.length === 0) ? (
                <span className="text-sm text-slate-500 italic">No vocabulary overrides</span>
              ) : (
                config.bibleOverrides.vocabulary.map((word) => (
                  <span
                    key={word}
                    className="word inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-sm"
                  >
                    {word}
                    <button
                      onClick={() => removeVocabularyWord(word)}
                      className="hover:text-green-300"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add word or phrase"
                className="flex-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:border-amber-500 focus:ring-0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addVocabularyWord((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  addVocabularyWord(input.value);
                  input.value = '';
                }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Banned Words Override */}
          <div className="form-group">
            <label className="block text-sm font-medium text-slate-300 mb-1">Banned Words Override</label>
            <p className="text-xs text-slate-500 mb-3">Words to avoid in this script</p>

            <div className="words-list flex flex-wrap gap-2 mb-3 min-h-[40px] p-2 rounded-lg bg-slate-800 border border-slate-700">
              {(!config.bibleOverrides.bannedWords || config.bibleOverrides.bannedWords.length === 0) ? (
                <span className="text-sm text-slate-500 italic">No banned word overrides</span>
              ) : (
                config.bibleOverrides.bannedWords.map((word) => (
                  <span
                    key={word}
                    className="word inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-sm"
                  >
                    {word}
                    <button
                      onClick={() => removeBannedWord(word)}
                      className="hover:text-red-300"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add word to ban"
                className="flex-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:border-amber-500 focus:ring-0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addBannedWord((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  addBannedWord(input.value);
                  input.value = '';
                }}
              >
                Ban
              </button>
            </div>
          </div>
        </>
      )}

      {/* Override Summary */}
      <div className="summary bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h5 className="text-sm font-semibold text-slate-300 mb-2">Active Overrides</h5>
        {!config.useBible ? (
          <p className="text-sm text-slate-500 italic">Channel bible disabled for this script</p>
        ) : (
          <div className="space-y-1 text-sm">
            <p className="text-slate-400">
              Tone: <span className="text-amber-400">{config.bibleOverrides.tone || 'Channel default'}</span>
            </p>
            <p className="text-slate-400">
              Audience: <span className="text-amber-400">{config.bibleOverrides.targetAudience || 'Channel default'}</span>
            </p>
            <p className="text-slate-400">
              Vocabulary additions: <span className="text-green-400">{config.bibleOverrides.vocabulary?.length || 0}</span>
            </p>
            <p className="text-slate-400">
              Banned words: <span className="text-red-400">{config.bibleOverrides.bannedWords?.length || 0}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
