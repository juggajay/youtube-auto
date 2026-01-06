-- Create run_node_configs table
-- Stores per-node configuration for each run

CREATE TABLE IF NOT EXISTS run_node_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL CHECK (node_type IN (
    'script',
    'voice',
    'thumbnail',
    'assembly',
    'publish'
  )),
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(run_id, node_type)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_run_node_configs_run_id ON run_node_configs(run_id);
CREATE INDEX IF NOT EXISTS idx_run_node_configs_node_type ON run_node_configs(node_type);

-- Enable Row Level Security
ALTER TABLE run_node_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for run_node_configs
-- Users can access configs for their own runs
CREATE POLICY "Users can view configs for their own runs"
  ON run_node_configs FOR SELECT
  USING (
    run_id IN (
      SELECT id FROM runs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create configs for their own runs"
  ON run_node_configs FOR INSERT
  WITH CHECK (
    run_id IN (
      SELECT id FROM runs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update configs for their own runs"
  ON run_node_configs FOR UPDATE
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

CREATE POLICY "Users can delete configs for their own runs"
  ON run_node_configs FOR DELETE
  USING (
    run_id IN (
      SELECT id FROM runs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all run node configs"
  ON run_node_configs FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
