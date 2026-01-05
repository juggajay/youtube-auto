export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'trialing'
  | 'unpaid';

export type PlanId = 'starter' | 'pro' | 'enterprise';

export type UsageEventType =
  | 'script_generation'
  | 'voice_generation'
  | 'thumbnail_generation'
  | 'video_assembly';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: SubscriptionStatus;
  plan_id: PlanId;
  included_credits: number;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsageTracking {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  credits_used: number;
  credits_included: number;
  created_at: string;
  updated_at: string;
}

export interface UsageEvent {
  id: string;
  user_id: string;
  event_type: UsageEventType;
  credits_consumed: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Payment {
  id: string;
  stripe_invoice_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending';
  created_at: string;
}

export interface CreditCheck {
  hasCredits: boolean;
  subscription?: Subscription;
  usage?: UsageTracking;
  creditsRemaining: number;
  willIncurOverage: boolean;
}

export const CREDIT_COSTS: Record<UsageEventType, number> = {
  script_generation: 5,
  voice_generation: 10,
  thumbnail_generation: 3,
  video_assembly: 20,
};
