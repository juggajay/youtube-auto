-- Create youtube_connections table
-- Stores OAuth tokens for connected YouTube channels

CREATE TABLE IF NOT EXISTS youtube_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  channel_title TEXT,
  channel_thumbnail TEXT,
  access_token TEXT NOT NULL, -- encrypted via Supabase Vault
  refresh_token TEXT NOT NULL, -- encrypted via Supabase Vault
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, channel_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_youtube_connections_user_id ON youtube_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_youtube_connections_channel_id ON youtube_connections(channel_id);
CREATE INDEX IF NOT EXISTS idx_youtube_connections_is_primary ON youtube_connections(is_primary);

-- Enable Row Level Security
ALTER TABLE youtube_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for youtube_connections
CREATE POLICY "Users can view their own youtube connections"
  ON youtube_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own youtube connections"
  ON youtube_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own youtube connections"
  ON youtube_connections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own youtube connections"
  ON youtube_connections FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all youtube connections"
  ON youtube_connections FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Create trigger for updated_at
CREATE TRIGGER update_youtube_connections_updated_at
  BEFORE UPDATE ON youtube_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to ensure only one primary connection per user
CREATE OR REPLACE FUNCTION ensure_single_primary_youtube_connection()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = TRUE THEN
    UPDATE youtube_connections
    SET is_primary = FALSE
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_primary = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce single primary connection
CREATE TRIGGER enforce_single_primary_youtube_connection
  AFTER INSERT OR UPDATE OF is_primary ON youtube_connections
  FOR EACH ROW
  WHEN (NEW.is_primary = TRUE)
  EXECUTE FUNCTION ensure_single_primary_youtube_connection();
