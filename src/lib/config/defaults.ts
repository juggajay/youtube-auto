import type { ResolvedConfig } from './types';

export function getSystemDefaults(): ResolvedConfig {
  return {
    channelBible: {
      channel_name: '',
      target_audience: { demographics: '', knowledge_level: '', why_they_watch: '' },
      tone: { overall: 'professional', humor: 'none', formality: 'neutral' },
      vocabulary: { use_jargon: false, explain_threshold: '', banned_words: [], preferred_phrases: [] },
      structure: { typical_length: '8-12 minutes', hook_style: '', cta_style: '', intro_length: '' },
      rules: { always_include: [], never_include: [], fact_check: '' },
    },
    voice: {
      provider: 'elevenlabs',
      voiceId: '',
      speed: 1.0,
      stability: 0.75,
      pronunciationGuide: [],
    },
    thumbnail: {
      dimensions: { width: 1280, height: 720 },
      colors: { primary: '#2563EB', secondary: '#1E293B', text: '#FFFFFF', accent: '#F59E0B' },
      typography: { font_family: 'Inter', max_words: 4, text_position: 'dynamic' },
      style: { background_type: 'generated', include_face: false, overall_mood: 'professional' },
      elements: { use_arrows: false, use_circles: false, use_icons: true },
      defaultCount: 3,
      generator: 'gemini',
    },
    assembly: {
      resolution: '1080p',
      aspect_ratio: '16:9',
      frame_rate: 30,
      assets: {},
      style: {
        transition_type: 'cut',
        text_animation: 'fade',
        caption_style: { enabled: true, font: 'Inter', position: 'bottom', style: 'standard' },
      },
      b_roll: { source: 'generated' },
    },
    publish: {
      platform: 'youtube',
      channel_id: '',
      defaults: { visibility: 'private', category: '22', language: 'en', made_for_kids: false },
      scheduling: { mode: 'draft' },
      metadata_template: { description_template: '', default_tags: [] },
    },
    intervention: {
      nodes: {
        trigger: 'auto',
        research: 'auto',
        script: 'review',
        voice: 'auto',
        thumbnail: 'review',
        assembly: 'auto',
        publish: 'always_review',
      },
      defaults: { pauseOnError: true, notifyOnComplete: true },
    },
  };
}
