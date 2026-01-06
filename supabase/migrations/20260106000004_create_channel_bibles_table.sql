-- Create channel_bibles table
-- Stores channel identity, tone sliders, vocabulary, and example scripts

CREATE TABLE IF NOT EXISTS channel_bibles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Identity
  channel_name TEXT,
  niche TEXT,
  target_audience TEXT,

  -- Tone Sliders (0-100)
  tone_casual_professional INTEGER DEFAULT 50 CHECK (tone_casual_professional >= 0 AND tone_casual_professional <= 100),
  tone_humor_level INTEGER DEFAULT 50 CHECK (tone_humor_level >= 0 AND tone_humor_level <= 100),
  tone_energy_level INTEGER DEFAULT 50 CHECK (tone_energy_level >= 0 AND tone_energy_level <= 100),
  tone_educational_entertainment INTEGER DEFAULT 50 CHECK (tone_educational_entertainment >= 0 AND tone_educational_entertainment <= 100),

  -- Vocabulary
  preferred_terms TEXT[],
  banned_words TEXT[],
  signature_phrases TEXT[],

  -- Content Defaults
  typical_length_minutes INTEGER DEFAULT 10,
  hook_style TEXT CHECK (hook_style IS NULL OR hook_style IN (
    'question',
    'statistic',
    'story',
    'controversy'
  )),
  cta_approach TEXT,

  -- Example Scripts (CRITICAL)
  example_scripts JSONB DEFAULT '[]', -- [{title, script, notes}]

  -- Brand Assets
  primary_color TEXT,
  secondary_color TEXT,
  font_preference TEXT,
  logo_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_channel_bibles_user_id ON channel_bibles(user_id);

-- Enable Row Level Security
ALTER TABLE channel_bibles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for channel_bibles
CREATE POLICY "Users can view their own channel bible"
  ON channel_bibles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own channel bible"
  ON channel_bibles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own channel bible"
  ON channel_bibles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own channel bible"
  ON channel_bibles FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_channel_bibles_updated_at
  BEFORE UPDATE ON channel_bibles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
