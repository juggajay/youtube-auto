import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/db/server';
import { checkAndRecordUsage } from './usage';
import { UsageEventType } from '@/types/billing';

/**
 * Middleware to check if user has an active subscription
 * In demo mode (no auth), allows limited access
 */
export async function requireSubscription(request: NextRequest) {
  const supabase = await createServerClient();

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // DEMO MODE: Allow unauthenticated access with demo user context
  if (authError || !user) {
    // Return demo context instead of 401
    return {
      user: { id: 'demo-user', email: 'demo@vidflow.app' },
      subscription: {
        id: 'demo-subscription',
        status: 'active',
        plan_id: 'demo',
        current_period_end: new Date(Date.now() + 86400000).toISOString()
      }
    };
  }

  // Check for active subscription
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .gt('current_period_end', new Date().toISOString())
    .single();

  if (subError || !subscription) {
    return NextResponse.json(
      {
        success: false,
        error: 'Active subscription required',
        requiresSubscription: true
      },
      { status: 403 }
    );
  }

  return { user, subscription };
}

/**
 * Wrapper for API routes that require subscription and track usage
 */
export function withUsageTracking(
  eventType: UsageEventType,
  handler: (
    request: NextRequest,
    context: { user: any; subscription: any }
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    // Check subscription
    const authResult = await requireSubscription(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, subscription } = authResult;

    // Check and record usage
    const usageResult = await checkAndRecordUsage(user.id, eventType);

    if (!usageResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: usageResult.error || 'Failed to record usage'
        },
        { status: 403 }
      );
    }

    // Add usage info to response headers
    const response = await handler(request, { user, subscription });

    if (usageResult.willIncurOverage) {
      response.headers.set('X-VidFlow-Overage', 'true');
    }

    return response;
  };
}

/**
 * Check subscription status without recording usage
 */
export async function getSubscriptionStatus(userId: string) {
  const supabase = await createServerClient();

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gt('current_period_end', new Date().toISOString())
    .single();

  return {
    hasActiveSubscription: !!subscription,
    subscription: subscription || null,
  };
}
