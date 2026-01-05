import { createServerClient } from '@/lib/db/server';
import { UsageEventType, CreditCheck, CREDIT_COSTS } from '@/types/billing';

/**
 * Check if user has sufficient credits for an operation
 */
export async function checkUserCredits(
  userId: string,
  eventType: UsageEventType
): Promise<CreditCheck> {
  const supabase = createServerClient();
  const creditsNeeded = CREDIT_COSTS[eventType];

  // Get active subscription
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gt('current_period_end', new Date().toISOString())
    .single();

  if (subError || !subscription) {
    return {
      hasCredits: false,
      creditsRemaining: 0,
      willIncurOverage: false,
    };
  }

  // Get current usage for this period
  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .eq('period_start', subscription.current_period_start)
    .single();

  const creditsUsed = usage?.credits_used || 0;
  const creditsIncluded = subscription.included_credits;
  const creditsRemaining = Math.max(0, creditsIncluded - creditsUsed);

  // In hybrid model, we allow overages (user will be charged)
  const willIncurOverage = creditsUsed + creditsNeeded > creditsIncluded;

  return {
    hasCredits: true, // Always true for active subscriptions
    subscription,
    usage: usage || undefined,
    creditsRemaining,
    willIncurOverage,
  };
}

/**
 * Record usage for an operation
 */
export async function recordUsage(
  userId: string,
  eventType: UsageEventType,
  metadata?: Record<string, any>
): Promise<void> {
  const supabase = createServerClient();
  const credits = CREDIT_COSTS[eventType];

  // Call the database function
  const { error } = await supabase.rpc('record_usage', {
    p_user_id: userId,
    p_event_type: eventType,
    p_credits: credits,
    p_metadata: metadata || null,
  });

  if (error) {
    console.error('Failed to record usage:', error);
    throw new Error('Failed to record usage');
  }
}

/**
 * Get usage summary for current period
 */
export async function getUsageSummary(userId: string) {
  const supabase = createServerClient();

  // Get active subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gt('current_period_end', new Date().toISOString())
    .single();

  if (!subscription) {
    return null;
  }

  // Get current usage
  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .eq('period_start', subscription.current_period_start)
    .single();

  // Get usage events breakdown
  const { data: events } = await supabase
    .from('usage_events')
    .select('event_type, credits_consumed')
    .eq('user_id', userId)
    .gte('created_at', subscription.current_period_start)
    .lte('created_at', subscription.current_period_end);

  // Calculate breakdown by event type
  const breakdown = events?.reduce((acc, event) => {
    acc[event.event_type] = (acc[event.event_type] || 0) + event.credits_consumed;
    return acc;
  }, {} as Record<UsageEventType, number>);

  const creditsUsed = usage?.credits_used || 0;
  const creditsIncluded = subscription.included_credits;
  const overage = Math.max(0, creditsUsed - creditsIncluded);

  return {
    subscription,
    usage,
    breakdown: breakdown || {},
    creditsUsed,
    creditsIncluded,
    creditsRemaining: Math.max(0, creditsIncluded - creditsUsed),
    overage,
    overageCost: overage * 0.01, // $0.01 per credit
  };
}

/**
 * Check and record usage in one operation
 */
export async function checkAndRecordUsage(
  userId: string,
  eventType: UsageEventType,
  metadata?: Record<string, any>
): Promise<{ success: boolean; willIncurOverage: boolean; error?: string }> {
  try {
    // Check if user has an active subscription
    const creditCheck = await checkUserCredits(userId, eventType);

    if (!creditCheck.hasCredits) {
      return {
        success: false,
        willIncurOverage: false,
        error: 'No active subscription found',
      };
    }

    // Record the usage
    await recordUsage(userId, eventType, metadata);

    return {
      success: true,
      willIncurOverage: creditCheck.willIncurOverage,
    };
  } catch (error) {
    console.error('Error in checkAndRecordUsage:', error);
    return {
      success: false,
      willIncurOverage: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
