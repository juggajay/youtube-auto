import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe/client';
import { createServerClient } from '@/lib/db/server';

interface CheckoutRequest {
  planId: 'starter' | 'pro' | 'enterprise';
  successUrl?: string;
  cancelUrl?: string;
}

interface CheckoutResponse {
  success: boolean;
  sessionUrl?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<CheckoutResponse>> {
  try {
    const body: CheckoutRequest = await request.json();
    const { planId, successUrl, cancelUrl } = body;

    // Validate plan ID
    if (!planId || !STRIPE_CONFIG.plans[planId]) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const plan = STRIPE_CONFIG.plans[planId];

    if (!plan.priceId) {
      return NextResponse.json(
        { success: false, error: 'Plan price ID not configured' },
        { status: 500 }
      );
    }

    // Get base URL for redirects
    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      client_reference_id: user.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      // Enable usage-based billing for overages
      subscription_data: {
        metadata: {
          userId: user.id,
          planId: planId,
          includedCredits: plan.credits.toString(),
        },
      },
      metadata: {
        userId: user.id,
        planId: planId,
      },
      success_url: successUrl || `${baseUrl}/settings/billing?success=true`,
      cancel_url: cancelUrl || `${baseUrl}/settings/billing?canceled=true`,
      // Allow promotion codes
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json(
        { success: false, error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionUrl: session.url,
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
