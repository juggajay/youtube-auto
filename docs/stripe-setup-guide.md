# Stripe Integration Setup Guide

This guide will walk you through setting up the Stripe integration for VidFlow's hybrid subscription billing model.

## Overview

VidFlow uses a **hybrid billing model** with:
- **Base subscription** with included API credits
- **Usage-based overages** charged at $0.01 per credit
- **Stripe Checkout** for seamless payment flow
- **Billing Portal** for self-service subscription management

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Supabase project configured
3. VidFlow application running locally or deployed

## Step 1: Stripe Dashboard Setup

### 1.1 Get API Keys

1. Log in to your Stripe Dashboard
2. Go to **Developers** → **API keys**
3. Copy your **Publishable key** and **Secret key** (use test keys for development)

### 1.2 Create Products and Prices

Create three subscription products in Stripe Dashboard:

1. Go to **Products** → **Add Product**
2. Create the following products:

#### Starter Plan
- **Name:** VidFlow Starter
- **Description:** 100 API credits per month
- **Pricing:** $29/month (recurring)
- Copy the **Price ID** (starts with `price_`)

#### Pro Plan (Recommended)
- **Name:** VidFlow Pro
- **Description:** 500 API credits per month
- **Pricing:** $99/month (recurring)
- Copy the **Price ID**

#### Enterprise Plan
- **Name:** VidFlow Enterprise
- **Description:** 2000 API credits per month
- **Pricing:** $299/month (recurring)
- Copy the **Price ID**

### 1.3 Enable Customer Portal

1. Go to **Settings** → **Billing** → **Customer portal**
2. Click **Activate** to enable the billing portal
3. Configure allowed features:
   - ✅ Update payment method
   - ✅ Cancel subscription
   - ✅ View invoice history
   - ✅ Apply promotion codes

### 1.4 Set Up Webhooks

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL: `https://your-domain.com/api/stripe/webhook`
   - For local development: Use Stripe CLI (see below)
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)

## Step 2: Environment Variables

Add the following to your `.env.local` file:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs from Step 1.2
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...
```

## Step 3: Database Setup

Run the Supabase migration to create the billing tables:

```bash
# If using Supabase CLI locally
supabase db push

# Or apply the migration directly in Supabase dashboard
# Copy contents of: supabase/migrations/20260105000000_create_billing_tables.sql
# Run in SQL Editor
```

This creates the following tables:
- `subscriptions` - Active subscriptions
- `usage_tracking` - Current period usage
- `usage_events` - Detailed usage history
- `payments` - Payment records

## Step 4: Local Development with Stripe CLI

For testing webhooks locally:

### 4.1 Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows (using Scoop)
scoop install stripe

# Or download from: https://stripe.com/docs/stripe-cli
```

### 4.2 Login to Stripe

```bash
stripe login
```

### 4.3 Forward Webhooks

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This will output a webhook signing secret (starts with `whsec_`). Add it to your `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4.4 Trigger Test Events

In another terminal, trigger test events:

```bash
# Test successful checkout
stripe trigger checkout.session.completed

# Test subscription update
stripe trigger customer.subscription.updated
```

## Step 5: Testing the Integration

### 5.1 Test Card Numbers

Use these test cards (any future expiry, any 3-digit CVC):

- **Successful payment:** `4242 4242 4242 4242`
- **Requires authentication:** `4000 0025 0000 3155`
- **Declined:** `4000 0000 0000 9995`

More test cards: https://stripe.com/docs/testing

### 5.2 Test Flow

1. **Sign up for a plan:**
   - Visit `/pricing`
   - Click "Get Started" on any plan
   - Complete checkout with test card
   - Verify redirect to `/settings/billing?success=true`

2. **Check subscription status:**
   - Visit `/settings/billing`
   - Verify plan details appear correctly
   - Check usage shows 0 credits used

3. **Generate content (consume credits):**
   - Generate a thumbnail (3 credits)
   - Return to `/settings/billing`
   - Verify usage updated to 3 credits

4. **Manage subscription:**
   - Click "Manage" button
   - Verify Stripe billing portal opens
   - Try canceling subscription
   - Verify cancellation notice appears

## Step 6: Going Live

### 6.1 Switch to Live Mode

1. In Stripe Dashboard, toggle to **Live mode**
2. Get your **live** API keys
3. Create products and prices in live mode
4. Update environment variables with live keys

### 6.2 Update Webhook Endpoint

1. In Stripe Dashboard (live mode)
2. Add webhook endpoint with your production URL
3. Update `STRIPE_WEBHOOK_SECRET` with live signing secret

### 6.3 Verify Compliance

Before going live, ensure:
- ✅ Clear pricing displayed to users
- ✅ Terms of service and privacy policy linked
- ✅ Cancellation policy clearly stated
- ✅ Email notifications configured
- ✅ Customer support contact available

## Usage in Code

### Protecting API Routes

Wrap your API routes with usage tracking:

```typescript
import { withUsageTracking } from '@/lib/billing/middleware';

export const POST = withUsageTracking('thumbnail_generation', async (
  request: NextRequest,
  context: { user: any; subscription: any }
): Promise<NextResponse> => {
  // Your handler code
  // Usage is automatically tracked
});
```

### Manual Usage Recording

For custom tracking:

```typescript
import { checkAndRecordUsage } from '@/lib/billing/usage';

const result = await checkAndRecordUsage(
  userId,
  'script_generation',
  { videoId: '123' } // optional metadata
);

if (!result.success) {
  // No active subscription
  return NextResponse.json({ error: result.error }, { status: 403 });
}

if (result.willIncurOverage) {
  // Notify user about overage
}
```

### Checking Subscription Status

```typescript
import { getSubscriptionStatus } from '@/lib/billing/middleware';

const { hasActiveSubscription, subscription } = await getSubscriptionStatus(userId);

if (!hasActiveSubscription) {
  // Redirect to pricing page
}
```

## Credit Costs

Current credit costs per operation:

| Operation | Credits | Cost (if overage) |
|-----------|---------|-------------------|
| Script Generation | 5 | $0.05 |
| Voice Generation | 10 | $0.10 |
| Thumbnail Generation | 3 | $0.03 |
| Video Assembly | 20 | $0.20 |

Modify costs in `src/types/billing.ts`:

```typescript
export const CREDIT_COSTS: Record<UsageEventType, number> = {
  script_generation: 5,
  voice_generation: 10,
  thumbnail_generation: 3,
  video_assembly: 20,
};
```

## Monitoring and Analytics

### Stripe Dashboard

Monitor in real-time:
- **Payments** → View all transactions
- **Subscriptions** → Active subscriptions
- **Customers** → Customer list
- **Revenue** → MRR, churn rate, etc.

### Database Queries

Get insights from your database:

```sql
-- Total active subscriptions by plan
SELECT plan_id, COUNT(*) as count
FROM subscriptions
WHERE status = 'active'
GROUP BY plan_id;

-- Top users by usage
SELECT user_id, SUM(credits_consumed) as total_credits
FROM usage_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY user_id
ORDER BY total_credits DESC
LIMIT 10;

-- Overage revenue this month
SELECT
  SUM((credits_used - credits_included) * 0.01) as overage_revenue
FROM usage_tracking
WHERE period_start >= DATE_TRUNC('month', NOW());
```

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook URL is correct and accessible
2. Verify webhook secret in environment variables
3. Check Stripe Dashboard → Webhooks → View logs
4. For local development, ensure Stripe CLI is running

### Subscription Not Updating

1. Check webhook handler logs for errors
2. Verify database permissions (RLS policies)
3. Check Supabase service role key is set
4. Review subscription metadata in Stripe Dashboard

### Credits Not Deducting

1. Verify API route is using `withUsageTracking`
2. Check user has active subscription
3. Review `usage_events` table for records
4. Check database function `record_usage` works

### Common Errors

**"No active subscription found"**
- User needs to subscribe via `/pricing`
- Check subscription status in database
- Verify subscription is in `active` state

**"Failed to create checkout session"**
- Verify price IDs in environment variables
- Check Stripe API key is valid
- Ensure user is authenticated

**"Webhook signature verification failed"**
- Check webhook secret matches Stripe Dashboard
- For local dev, use Stripe CLI webhook secret
- Verify raw body is being passed to webhook handler

## Support

For issues:
1. Check Stripe Dashboard → Logs
2. Review application logs
3. Check Supabase database for data consistency
4. Contact Stripe support for payment issues

## Resources

- [Stripe Docs](https://stripe.com/docs)
- [Stripe Billing Guide](https://stripe.com/docs/billing)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
