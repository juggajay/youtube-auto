-- Create runs table
-- Runs track individual pipeline executions with video idea, intervention settings, and state

CREATE TABLE IF NOT EXISTS runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'running',
    'paused',
    'completed',
    'failed'
  )),

  -- Video Idea (from pre-run modal)
  topic TEXT NOT NULL,
  angle TEXT,
  target_audience TEXT,
  must_include TEXT[],
  must_avoid TEXT[],
  reference_url TEXT,
  archetype_id TEXT NOT NULL,

  -- Intervention Settings
  review_script BOOLEAN DEFAULT FALSE,
  review_thumbnail BOOLEAN DEFAULT FALSE,
  review_before_publish BOOLEAN DEFAULT TRUE,

  -- Execution State
  current_node TEXT,
  node_outputs JSONB DEFAULT '{}',
  error_message TEXT,

  -- Cost Tracking
  estimated_cost_cents INTEGER,
  actual_cost_cents INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_runs_user_id ON runs(user_id);
CREATE INDEX IF NOT EXISTS idx_runs_template_id ON runs(template_id);
CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status);
CREATE INDEX IF NOT EXISTS idx_runs_archetype_id ON runs(archetype_id);
CREATE INDEX IF NOT EXISTS idx_runs_created_at ON runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runs_current_node ON runs(current_node);

-- Enable Row Level Security
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for runs
CREATE POLICY "Users can view their own runs"
  ON runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own runs"
  ON runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own runs"
  ON runs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own runs"
  ON runs FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all runs"
  ON runs FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
