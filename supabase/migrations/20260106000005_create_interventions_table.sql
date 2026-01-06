-- Create interventions table
-- Tracks intervention state and user responses during pipeline execution

CREATE TABLE IF NOT EXISTS interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL CHECK (node_type IN (
    'script',
    'voice',
    'thumbnail',
    'assembly',
    'publish'
  )),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'responded',
    'timeout'
  )),

  -- What AI Generated
  generated_content JSONB NOT NULL, -- varies by node type

  -- User Response
  user_selection JSONB,
  user_edits JSONB,
  user_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_interventions_run_id ON interventions(run_id);
CREATE INDEX IF NOT EXISTS idx_interventions_node_type ON interventions(node_type);
CREATE INDEX IF NOT EXISTS idx_interventions_status ON interventions(status);
CREATE INDEX IF NOT EXISTS idx_interventions_created_at ON interventions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for interventions
-- Users can access interventions for their own runs
CREATE POLICY "Users can view interventions for their own runs"
  ON interventions FOR SELECT
  USING (
    run_id IN (
      SELECT id FROM runs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create interventions for their own runs"
  ON interventions FOR INSERT
  WITH CHECK (
    run_id IN (
      SELECT id FROM runs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update interventions for their own runs"
  ON interventions FOR UPDATE
  USING (
    run_id IN (
      SELECT id FROM runs WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    run_id IN (
      SELECT id FROM runs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete interventions for their own runs"
  ON interventions FOR DELETE
  USING (
    run_id IN (
      SELECT id FROM runs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all interventions"
  ON interventions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
