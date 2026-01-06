// Database types for VidFlow Supabase tables

// ============================================================================
// Run Types
// ============================================================================

export type RunStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed';

export interface Run {
  id: string;
  user_id: string;
  template_id: string | null;
  status: RunStatus;

  // Video Idea (from pre-run modal)
  topic: string;
  angle: string | null;
  target_audience: string | null;
  must_include: string[];
  must_avoid: string[];
  reference_url: string | null;
  archetype_id: string;

  // Intervention Settings
  review_script: boolean;
  review_thumbnail: boolean;
  review_before_publish: boolean;

  // Execution State
  current_node: string | null;
  node_outputs: Record<string, unknown>;
  error_message: string | null;

  // Cost Tracking
  estimated_cost_cents: number | null;
  actual_cost_cents: number;

  // Timestamps
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface RunInsert {
  user_id: string;
  template_id?: string | null;
  status?: RunStatus;
  topic: string;
  angle?: string | null;
  target_audience?: string | null;
  must_include?: string[];
  must_avoid?: string[];
  reference_url?: string | null;
  archetype_id: string;
  review_script?: boolean;
  review_thumbnail?: boolean;
  review_before_publish?: boolean;
  current_node?: string | null;
  node_outputs?: Record<string, unknown>;
  error_message?: string | null;
  estimated_cost_cents?: number | null;
  actual_cost_cents?: number;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface RunUpdate {
  template_id?: string | null;
  status?: RunStatus;
  topic?: string;
  angle?: string | null;
  target_audience?: string | null;
  must_include?: string[];
  must_avoid?: string[];
  reference_url?: string | null;
  archetype_id?: string;
  review_script?: boolean;
  review_thumbnail?: boolean;
  review_before_publish?: boolean;
  current_node?: string | null;
  node_outputs?: Record<string, unknown>;
  error_message?: string | null;
  estimated_cost_cents?: number | null;
  actual_cost_cents?: number;
  started_at?: string | null;
  completed_at?: string | null;
}

// ============================================================================
// Run Node Configs Types
// ============================================================================

export type NodeType = 'script' | 'voice' | 'thumbnail' | 'assembly' | 'publish';

export interface RunNodeConfig {
  id: string;
  run_id: string;
  node_type: NodeType;
  config: Record<string, unknown>;
  created_at: string;
}

export interface RunNodeConfigInsert {
  run_id: string;
  node_type: NodeType;
  config: Record<string, unknown>;
}

export interface RunNodeConfigUpdate {
  config?: Record<string, unknown>;
}

// ============================================================================
// Channel Bible Types
// ============================================================================

export type HookStyle = 'question' | 'statistic' | 'story' | 'controversy';

export interface ExampleScript {
  title: string;
  script: string;
  notes?: string;
}

export interface ChannelBible {
  id: string;
  user_id: string;

  // Identity
  channel_name: string | null;
  niche: string | null;
  target_audience: string | null;

  // Tone Sliders (0-100)
  tone_casual_professional: number;
  tone_humor_level: number;
  tone_energy_level: number;
  tone_educational_entertainment: number;

  // Vocabulary
  preferred_terms: string[];
  banned_words: string[];
  signature_phrases: string[];

  // Content Defaults
  typical_length_minutes: number;
  hook_style: HookStyle | null;
  cta_approach: string | null;

  // Example Scripts (CRITICAL)
  example_scripts: ExampleScript[];

  // Brand Assets
  primary_color: string | null;
  secondary_color: string | null;
  font_preference: string | null;
  logo_url: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface ChannelBibleInsert {
  user_id: string;
  channel_name?: string | null;
  niche?: string | null;
  target_audience?: string | null;
  tone_casual_professional?: number;
  tone_humor_level?: number;
  tone_energy_level?: number;
  tone_educational_entertainment?: number;
  preferred_terms?: string[];
  banned_words?: string[];
  signature_phrases?: string[];
  typical_length_minutes?: number;
  hook_style?: HookStyle | null;
  cta_approach?: string | null;
  example_scripts?: ExampleScript[];
  primary_color?: string | null;
  secondary_color?: string | null;
  font_preference?: string | null;
  logo_url?: string | null;
}

export interface ChannelBibleUpdate {
  channel_name?: string | null;
  niche?: string | null;
  target_audience?: string | null;
  tone_casual_professional?: number;
  tone_humor_level?: number;
  tone_energy_level?: number;
  tone_educational_entertainment?: number;
  preferred_terms?: string[];
  banned_words?: string[];
  signature_phrases?: string[];
  typical_length_minutes?: number;
  hook_style?: HookStyle | null;
  cta_approach?: string | null;
  example_scripts?: ExampleScript[];
  primary_color?: string | null;
  secondary_color?: string | null;
  font_preference?: string | null;
  logo_url?: string | null;
}

// ============================================================================
// Template Types
// ============================================================================

export interface Template {
  id: string;
  user_id: string;
  name: string;
  description: string | null;

  // Archetype
  archetype_id: string;

  // Node Configs (full config per node)
  script_config: ScriptNodeConfig | null;
  voice_config: VoiceNodeConfig | null;
  thumbnail_config: ThumbnailNodeConfig | null;
  assembly_config: AssemblyNodeConfig | null;
  publish_config: PublishNodeConfig | null;

  // Intervention Defaults
  default_review_script: boolean;
  default_review_thumbnail: boolean;
  default_review_before_publish: boolean;

  // Metadata
  use_count: number;
  is_favorite: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface TemplateInsert {
  user_id: string;
  name: string;
  description?: string | null;
  archetype_id: string;
  script_config?: ScriptNodeConfig | null;
  voice_config?: VoiceNodeConfig | null;
  thumbnail_config?: ThumbnailNodeConfig | null;
  assembly_config?: AssemblyNodeConfig | null;
  publish_config?: PublishNodeConfig | null;
  default_review_script?: boolean;
  default_review_thumbnail?: boolean;
  default_review_before_publish?: boolean;
  use_count?: number;
  is_favorite?: boolean;
}

export interface TemplateUpdate {
  name?: string;
  description?: string | null;
  archetype_id?: string;
  script_config?: ScriptNodeConfig | null;
  voice_config?: VoiceNodeConfig | null;
  thumbnail_config?: ThumbnailNodeConfig | null;
  assembly_config?: AssemblyNodeConfig | null;
  publish_config?: PublishNodeConfig | null;
  default_review_script?: boolean;
  default_review_thumbnail?: boolean;
  default_review_before_publish?: boolean;
  use_count?: number;
  is_favorite?: boolean;
}

// ============================================================================
// Node Config Types (for templates and run_node_configs)
// ============================================================================

export interface ScriptNodeConfig {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  style_instructions?: string;
  include_timestamps?: boolean;
  include_b_roll_suggestions?: boolean;
}

export interface VoiceNodeConfig {
  voice_id?: string;
  voice_name?: string;
  stability?: number;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export interface ThumbnailNodeConfig {
  style?: string;
  include_text?: boolean;
  text_position?: 'top' | 'bottom' | 'center' | 'none';
  color_scheme?: string;
  face_prominence?: 'high' | 'medium' | 'low' | 'none';
  generate_variants?: number;
}

export interface AssemblyNodeConfig {
  resolution?: '1080p' | '720p' | '4k';
  format?: 'mp4' | 'mov' | 'webm';
  include_subtitles?: boolean;
  subtitle_style?: string;
  background_music_volume?: number;
  transition_style?: string;
}

export interface PublishNodeConfig {
  visibility?: 'public' | 'unlisted' | 'private';
  category_id?: string;
  default_tags?: string[];
  playlist_id?: string;
  scheduled_time?: string;
  notify_subscribers?: boolean;
  made_for_kids?: boolean;
}

// ============================================================================
// Intervention Types
// ============================================================================

export type InterventionStatus = 'pending' | 'responded' | 'timeout';

export interface Intervention {
  id: string;
  run_id: string;
  node_type: NodeType;
  status: InterventionStatus;

  // What AI Generated
  generated_content: Record<string, unknown>;

  // User Response
  user_selection: Record<string, unknown> | null;
  user_edits: Record<string, unknown> | null;
  user_notes: string | null;

  // Timestamps
  created_at: string;
  responded_at: string | null;
}

export interface InterventionInsert {
  run_id: string;
  node_type: NodeType;
  status?: InterventionStatus;
  generated_content: Record<string, unknown>;
  user_selection?: Record<string, unknown> | null;
  user_edits?: Record<string, unknown> | null;
  user_notes?: string | null;
  responded_at?: string | null;
}

export interface InterventionUpdate {
  status?: InterventionStatus;
  user_selection?: Record<string, unknown> | null;
  user_edits?: Record<string, unknown> | null;
  user_notes?: string | null;
  responded_at?: string | null;
}

// Generated content types for different nodes
export interface ScriptGeneratedContent {
  script: string;
  title_options: string[];
  description: string;
  tags: string[];
  hook: string;
  outline: string[];
}

export interface ThumbnailGeneratedContent {
  thumbnails: Array<{
    url: string;
    prompt: string;
    style: string;
  }>;
}

export interface PublishGeneratedContent {
  title: string;
  description: string;
  tags: string[];
  scheduled_time?: string;
}

// ============================================================================
// Content Library Types
// ============================================================================

export type ContentType = 'hook' | 'title' | 'description' | 'intro' | 'cta' | 'outline' | 'script';

export interface ContentLibraryRow {
  id: string;
  user_id: string;
  name: string;
  type: ContentType;
  content: string;
  tags: string[];
  topic: string | null;
  archetype: string | null;
  metadata: Record<string, unknown>;
  used_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentLibraryInsert {
  user_id: string;
  name: string;
  type: ContentType;
  content: string;
  tags?: string[];
  topic?: string | null;
  archetype?: string | null;
  metadata?: Record<string, unknown>;
  used_count?: number;
  last_used_at?: string | null;
}

export interface ContentLibraryUpdate {
  name?: string;
  type?: ContentType;
  content?: string;
  tags?: string[];
  topic?: string | null;
  archetype?: string | null;
  metadata?: Record<string, unknown>;
  used_count?: number;
  last_used_at?: string | null;
}

// Type aliases for cleaner API usage
export type ContentItem = ContentLibraryRow;
export type ContentItemInsert = ContentLibraryInsert;
export type ContentItemUpdate = ContentLibraryUpdate;

export interface ResolvedContent {
  tag: string;
  id: string;
  content: string;
  type: ContentType;
}

// ============================================================================
// Element Types (User uploaded assets like logos, overlays, etc.)
// ============================================================================

export type ElementType = 'logo' | 'overlay' | 'background' | 'character' | 'prop' | 'other';

export interface Element {
  id: string;
  user_id: string;
  name: string;
  type: ElementType;
  tags: string[];
  storage_path: string;
  thumbnail_path: string | null;
  metadata: Record<string, unknown>;
  file_size_bytes: number;
  mime_type: string;
  width: number | null;
  height: number | null;
  used_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ElementInsert {
  user_id: string;
  name: string;
  type: ElementType;
  tags?: string[];
  storage_path: string;
  thumbnail_path?: string | null;
  metadata?: Record<string, unknown>;
  file_size_bytes: number;
  mime_type: string;
  width?: number | null;
  height?: number | null;
  used_count?: number;
  last_used_at?: string | null;
}

export interface ElementUpdate {
  name?: string;
  type?: ElementType;
  tags?: string[];
  metadata?: Record<string, unknown>;
  used_count?: number;
  last_used_at?: string | null;
}

export interface ElementWithUrl extends Element {
  url: string;
  thumbnail_url: string | null;
}

export interface ResolvedElement {
  tag: string;
  element: ElementWithUrl;
}

// ============================================================================
// YouTube Connection Types
// ============================================================================

export interface YouTubeConnection {
  id: string;
  user_id: string;
  channel_id: string;
  channel_title: string | null;
  channel_thumbnail: string | null;
  access_token: string;
  refresh_token: string;
  token_expires_at: string | null;
  scopes: string[];
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface YouTubeConnectionInsert {
  user_id: string;
  channel_id: string;
  channel_title?: string | null;
  channel_thumbnail?: string | null;
  access_token: string;
  refresh_token: string;
  token_expires_at?: string | null;
  scopes?: string[];
  is_primary?: boolean;
}

export interface YouTubeConnectionUpdate {
  channel_title?: string | null;
  channel_thumbnail?: string | null;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string | null;
  scopes?: string[];
  is_primary?: boolean;
}

// ============================================================================
// Database Schema Type (for Supabase client)
// ============================================================================

export interface Database {
  public: {
    Tables: {
      runs: {
        Row: Run;
        Insert: RunInsert;
        Update: RunUpdate;
      };
      run_node_configs: {
        Row: RunNodeConfig;
        Insert: RunNodeConfigInsert;
        Update: RunNodeConfigUpdate;
      };
      channel_bibles: {
        Row: ChannelBible;
        Insert: ChannelBibleInsert;
        Update: ChannelBibleUpdate;
      };
      templates: {
        Row: Template;
        Insert: TemplateInsert;
        Update: TemplateUpdate;
      };
      interventions: {
        Row: Intervention;
        Insert: InterventionInsert;
        Update: InterventionUpdate;
      };
      youtube_connections: {
        Row: YouTubeConnection;
        Insert: YouTubeConnectionInsert;
        Update: YouTubeConnectionUpdate;
      };
      elements: {
        Row: Element;
        Insert: ElementInsert;
        Update: ElementUpdate;
      };
      content_library: {
        Row: ContentItem;
        Insert: ContentItemInsert;
        Update: ContentItemUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      run_status: RunStatus;
      node_type: NodeType;
      intervention_status: InterventionStatus;
      hook_style: HookStyle;
      element_type: ElementType;
      content_type: ContentType;
    };
  };
}
