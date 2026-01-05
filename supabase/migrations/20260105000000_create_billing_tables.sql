-- Create profiles table extension for Stripe
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN (
    'active',
    'canceled',
    'incomplete',
    'incomplete_expired',
    'past_due',
    'trialing',
    'unpaid'
  )),
  plan_id TEXT NOT NULL CHECK (plan_id IN ('starter', 'pro', 'enterprise')),
  included_credits INTEGER NOT NULL DEFAULT 0,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create usage tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  credits_used INTEGER DEFAULT 0,
  credits_included INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_start)
);

-- Create usage events table (detailed tracking)
CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'script_generation',
    'voice_generation',
    'thumbnail_generation',
    'video_assembly'
  )),
  credits_consumed INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending')),
  created_at TIMESTAMPTZ NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_period ON usage_tracking(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_usage_events_user_id ON usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_created_at ON usage_events(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_events_event_type ON usage_events(event_type);

CREATE INDEX IF NOT EXISTS idx_payments_stripe_subscription ON payments(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_customer ON payments(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for usage_tracking
CREATE POLICY "Users can view their own usage"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage tracking"
  ON usage_tracking FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for usage_events
CREATE POLICY "Users can view their own usage events"
  ON usage_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage events"
  ON usage_events FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (
    stripe_customer_id IN (
      SELECT stripe_customer_id
      FROM subscriptions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage payments"
  ON payments FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to check if user has credits available
CREATE OR REPLACE FUNCTION check_user_credits(
  p_user_id UUID,
  p_credits_needed INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription RECORD;
  v_usage RECORD;
  v_credits_available INTEGER;
BEGIN
  -- Get active subscription
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
    AND current_period_end > NOW()
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Get current usage
  SELECT * INTO v_usage
  FROM usage_tracking
  WHERE user_id = p_user_id
    AND period_start = v_subscription.current_period_start
  LIMIT 1;

  -- Calculate available credits (included + unlimited for overage)
  IF v_usage IS NULL THEN
    v_credits_available := v_subscription.included_credits;
  ELSE
    -- In hybrid model, we allow overages (charged later)
    -- So we return TRUE as long as subscription is active
    RETURN TRUE;
  END IF;

  RETURN v_credits_available >= p_credits_needed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to record usage
CREATE OR REPLACE FUNCTION record_usage(
  p_user_id UUID,
  p_event_type TEXT,
  p_credits INTEGER,
  p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_subscription RECORD;
BEGIN
  -- Get active subscription
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
    AND current_period_end > NOW()
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active subscription found';
  END IF;

  -- Insert usage event
  INSERT INTO usage_events (user_id, event_type, credits_consumed, metadata)
  VALUES (p_user_id, p_event_type, p_credits, p_metadata);

  -- Update usage tracking
  INSERT INTO usage_tracking (
    user_id,
    period_start,
    period_end,
    credits_used,
    credits_included
  )
  VALUES (
    p_user_id,
    v_subscription.current_period_start,
    v_subscription.current_period_end,
    p_credits,
    v_subscription.included_credits
  )
  ON CONFLICT (user_id, period_start)
  DO UPDATE SET
    credits_used = usage_tracking.credits_used + p_credits,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
