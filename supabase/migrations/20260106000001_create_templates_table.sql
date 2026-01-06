-- Create templates table
-- Templates allow users to save pipeline configurations for reuse

CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,

  -- Archetype
  archetype_id TEXT NOT NULL,

  -- Node Configs (full config per node)
  script_config JSONB,
  voice_config JSONB,
  thumbnail_config JSONB,
  assembly_config JSONB,
  publish_config JSONB,

  -- Intervention Defaults
  default_review_script BOOLEAN DEFAULT FALSE,
  default_review_thumbnail BOOLEAN DEFAULT FALSE,
  default_review_before_publish BOOLEAN DEFAULT TRUE,

  -- Metadata
  use_count INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_archetype_id ON templates(archetype_id);
CREATE INDEX IF NOT EXISTS idx_templates_is_favorite ON templates(is_favorite);
CREATE INDEX IF NOT EXISTS idx_templates_use_count ON templates(use_count DESC);

-- Enable Row Level Security
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for templates
CREATE POLICY "Users can view their own templates"
  ON templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
  ON templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON templates FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
