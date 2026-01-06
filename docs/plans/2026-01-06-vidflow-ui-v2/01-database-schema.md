# Database Schema

## Tables

### runs
```sql
create table runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  template_id uuid references templates(id),
  status text not null default 'pending', -- pending, running, paused, completed, failed

  -- Video Idea (from pre-run modal)
  topic text not null,
  angle text,
  target_audience text,
  must_include text[],
  must_avoid text[],
  reference_url text,
  archetype_id text not null,

  -- Intervention Settings
  review_script boolean default false,
  review_thumbnail boolean default false,
  review_before_publish boolean default true,

  -- Execution State
  current_node text,
  node_outputs jsonb default '{}',
  error_message text,

  -- Cost Tracking
  estimated_cost_cents integer,
  actual_cost_cents integer default 0,

  -- Timestamps
  created_at timestamptz default now(),
  started_at timestamptz,
  completed_at timestamptz
);
```

### run_node_configs
```sql
create table run_node_configs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references runs(id) on delete cascade,
  node_type text not null, -- script, voice, thumbnail, assembly, publish
  config jsonb not null,
  created_at timestamptz default now(),
  unique(run_id, node_type)
);
```

### channel_bibles
```sql
create table channel_bibles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) unique not null,

  -- Identity
  channel_name text,
  niche text,
  target_audience text,

  -- Tone Sliders (0-100)
  tone_casual_professional integer default 50,
  tone_humor_level integer default 50,
  tone_energy_level integer default 50,
  tone_educational_entertainment integer default 50,

  -- Vocabulary
  preferred_terms text[],
  banned_words text[],
  signature_phrases text[],

  -- Content Defaults
  typical_length_minutes integer default 10,
  hook_style text, -- question, statistic, story, controversy
  cta_approach text,

  -- Example Scripts (CRITICAL)
  example_scripts jsonb default '[]', -- [{title, script, notes}]

  -- Brand Assets
  primary_color text,
  secondary_color text,
  font_preference text,
  logo_url text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### templates
```sql
create table templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  name text not null,
  description text,

  -- Archetype
  archetype_id text not null,

  -- Node Configs (full config per node)
  script_config jsonb,
  voice_config jsonb,
  thumbnail_config jsonb,
  assembly_config jsonb,
  publish_config jsonb,

  -- Intervention Defaults
  default_review_script boolean default false,
  default_review_thumbnail boolean default false,
  default_review_before_publish boolean default true,

  -- Metadata
  use_count integer default 0,
  is_favorite boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### interventions
```sql
create table interventions (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references runs(id) on delete cascade,
  node_type text not null,
  status text not null default 'pending', -- pending, responded, timeout

  -- What AI Generated
  generated_content jsonb not null, -- varies by node type

  -- User Response
  user_selection jsonb,
  user_edits jsonb,
  user_notes text,

  created_at timestamptz default now(),
  responded_at timestamptz
);
```

### youtube_connections
```sql
create table youtube_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  channel_id text not null,
  channel_title text,
  channel_thumbnail text,
  access_token text not null, -- encrypted
  refresh_token text not null, -- encrypted
  token_expires_at timestamptz,
  scopes text[],
  is_primary boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, channel_id)
);
```

## TypeScript Types

```typescript
// types/database.ts

export interface Run {
  id: string;
  user_id: string;
  template_id?: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  topic: string;
  angle?: string;
  target_audience?: string;
  must_include: string[];
  must_avoid: string[];
  reference_url?: string;
  archetype_id: string;
  review_script: boolean;
  review_thumbnail: boolean;
  review_before_publish: boolean;
  current_node?: string;
  node_outputs: Record<string, unknown>;
  error_message?: string;
  estimated_cost_cents?: number;
  actual_cost_cents: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface ChannelBible {
  id: string;
  user_id: string;
  channel_name?: string;
  niche?: string;
  target_audience?: string;
  tone_casual_professional: number;
  tone_humor_level: number;
  tone_energy_level: number;
  tone_educational_entertainment: number;
  preferred_terms: string[];
  banned_words: string[];
  signature_phrases: string[];
  typical_length_minutes: number;
  hook_style?: string;
  cta_approach?: string;
  example_scripts: Array<{
    title: string;
    script: string;
    notes?: string;
  }>;
  primary_color?: string;
  secondary_color?: string;
  font_preference?: string;
  logo_url?: string;
}

export interface Template {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  archetype_id: string;
  script_config?: ScriptNodeConfig;
  voice_config?: VoiceNodeConfig;
  thumbnail_config?: ThumbnailNodeConfig;
  assembly_config?: AssemblyNodeConfig;
  publish_config?: PublishNodeConfig;
  default_review_script: boolean;
  default_review_thumbnail: boolean;
  default_review_before_publish: boolean;
  use_count: number;
  is_favorite: boolean;
}
```
