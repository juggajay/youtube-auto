import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createServerClient } from '@/lib/db/server';
import Stripe from 'stripe';

// Disable body parsing for webhook verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not set');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabase = await createServerClient();

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session, supabase);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription, supabase);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription, supabase);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice, supabase);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice, supabase);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Handle checkout session completed
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  supabase: any
) {
  const userId = session.metadata?.userId || session.client_reference_id;

  if (!userId) {
    console.error('No user ID found in checkout session');
    return;
  }

  // Update user profile with Stripe customer ID
  const { error } = await supabase
    .from('profiles')
    .update({
      stripe_customer_id: session.customer as string,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating profile with customer ID:', error);
  }
}

// Handle subscription created/updated
async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription,
  supabase: any
) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('No user ID found in subscription metadata');
    return;
  }

  const planId = subscription.metadata?.planId;
  const includedCredits = parseInt(subscription.metadata?.includedCredits || '0', 10);

  // Get period dates from subscription items (Stripe v20+ API)
  const subscriptionItem = subscription.items?.data?.[0];
  const currentPeriodStart = subscriptionItem?.current_period_start
    ?? (subscription as unknown as { current_period_start?: number }).current_period_start
    ?? Math.floor(Date.now() / 1000);
  const currentPeriodEnd = subscriptionItem?.current_period_end
    ?? (subscription as unknown as { current_period_end?: number }).current_period_end
    ?? Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

  // Upsert subscription record
  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      status: subscription.status,
      plan_id: planId,
      included_credits: includedCredits,
      current_period_start: new Date(currentPeriodStart * 1000).toISOString(),
      current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'stripe_subscription_id',
    });

  if (error) {
    console.error('Error upserting subscription:', error);
  }

  // Reset usage credits at period start
  if (subscription.status === 'active') {
    const { error: usageError } = await supabase
      .from('usage_tracking')
      .upsert({
        user_id: userId,
        period_start: new Date(currentPeriodStart * 1000).toISOString(),
        period_end: new Date(currentPeriodEnd * 1000).toISOString(),
        credits_used: 0,
        credits_included: includedCredits,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,period_start',
      });

    if (usageError) {
      console.error('Error resetting usage tracking:', usageError);
    }
  }
}

// Handle subscription deleted
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: any
) {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription status:', error);
  }
}

// Handle successful payment
async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabase: any
) {
  // Type assertion for subscription property (varies by Stripe API version)
  const invoiceData = invoice as unknown as {
    subscription?: string | { id: string };
    customer?: string | { id: string };
    created?: number;
  };

  const subscriptionId = typeof invoiceData.subscription === 'string'
    ? invoiceData.subscription
    : invoiceData.subscription?.id;

  if (!subscriptionId) {
    return;
  }

  const customerId = typeof invoiceData.customer === 'string'
    ? invoiceData.customer
    : invoiceData.customer?.id;

  // Record payment
  const { error } = await supabase
    .from('payments')
    .insert({
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
      created_at: new Date((invoiceData.created ?? Date.now() / 1000) * 1000).toISOString(),
    });

  if (error) {
    console.error('Error recording payment:', error);
  }
}

// Handle failed payment
async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: any
) {
  // Type assertion for subscription property (varies by Stripe API version)
  const invoiceData = invoice as unknown as {
    subscription?: string | { id: string };
    customer?: string | { id: string };
    created?: number;
  };

  const subscriptionId = typeof invoiceData.subscription === 'string'
    ? invoiceData.subscription
    : invoiceData.subscription?.id;

  if (!subscriptionId) {
    return;
  }

  const customerId = typeof invoiceData.customer === 'string'
    ? invoiceData.customer
    : invoiceData.customer?.id;

  // Record failed payment
  const { error } = await supabase
    .from('payments')
    .insert({
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: 'failed',
      created_at: new Date((invoiceData.created ?? Date.now() / 1000) * 1000).toISOString(),
    });

  if (error) {
    console.error('Error recording failed payment:', error);
  }

  // TODO: Send notification to user about failed payment
}
