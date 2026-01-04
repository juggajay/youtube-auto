// === Channel Bible ===

export interface ChannelBible {
  channel_name: string;
  tagline?: string;
  target_audience: {
    demographics: string;
    knowledge_level: string;
    why_they_watch: string;
  };
  tone: {
    overall: string;
    humor: string;
    formality: string;
  };
  vocabulary: {
    use_jargon: boolean;
    explain_threshold: string;
    banned_words: string[];
    preferred_phrases: string[];
  };
  structure: {
    typical_length: string;
    hook_style: string;
    cta_style: string;
    intro_length: string;
  };
  rules: {
    always_include: string[];
    never_include: string[];
    fact_check: string;
  };
  example_scripts?: {
    name: string;
    script: string;
    notes: string;
  }[];
}

// === Intervention ===

export type InterventionLevel = 'auto' | 'review' | 'always_review';

export interface InterventionConfig {
  nodes: {
    trigger: InterventionLevel;
    research: InterventionLevel;
    script: InterventionLevel;
    voice: InterventionLevel;
    thumbnail: InterventionLevel;
    assembly: InterventionLevel;
    publish: InterventionLevel;
    [nodeId: string]: InterventionLevel;
  };
  defaults: {
    pauseOnError: boolean;
    notifyOnComplete: boolean;
    autoApproveTimeout?: number;
  };
}

// === Resolved Config ===

export interface ResolvedConfig {
  channelBible: ChannelBible;

  voice: {
    provider: 'elevenlabs' | 'playht' | 'openai';
    voiceId: string;
    speed: number;
    stability?: number;
    pronunciationGuide: { word: string; phonetic: string }[];
  };

  thumbnail: {
    dimensions: { width: number; height: number };
    colors: { primary: string; secondary: string; text: string; accent: string };
    typography: { font_family: string; max_words: number; text_position: string };
    style: { background_type: string; include_face: boolean; overall_mood: string };
    elements: { use_arrows: boolean; use_circles: boolean; use_icons: boolean };
  };

  assembly: {
    resolution: '1080p' | '4k';
    aspect_ratio: '16:9' | '9:16' | '1:1';
    frame_rate: 30 | 60;
    assets: { intro_video?: string; outro_video?: string; background_music?: string };
    style: {
      transition_type: 'cut' | 'fade' | 'swipe';
      text_animation: 'none' | 'fade' | 'typewriter';
      caption_style: { enabled: boolean; font: string; position: string; style: string };
    };
    b_roll: { source: 'generated' | 'stock' | 'manual' };
  };

  publish: {
    platform: 'youtube';
    channel_id: string;
    defaults: { visibility: string; category: string; language: string; made_for_kids: boolean };
    scheduling: { mode: 'immediate' | 'scheduled' | 'draft'; preferred_times?: string[] };
    metadata_template: { description_template: string; default_tags: string[] };
  };

  intervention: InterventionConfig;

  archetype?: Archetype;
}

// === Archetype ===

export interface Archetype {
  id: string;
  name: string;
  description: string;
  structure: {
    sections: {
      id: string;
      name: string;
      required: boolean;
      description: string;
    }[];
  };
  titleFormula?: string;
  hookTemplate?: string;
}
