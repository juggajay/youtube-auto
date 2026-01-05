# Stripe Integration - Quick Start Checklist

Get your Stripe billing up and running in 15 minutes.

## ☐ Step 1: Stripe Dashboard Setup (5 min)

### 1.1 Get API Keys
- [ ] Go to https://dashboard.stripe.com/test/apikeys
- [ ] Copy **Publishable key** → Save for later
- [ ] Copy **Secret key** → Save for later

### 1.2 Create Products
- [ ] Go to https://dashboard.stripe.com/test/products
- [ ] Click **Add Product** three times:

**Product 1 - Starter:**
- Name: `VidFlow Starter`
- Price: `$29/month` (recurring)
- Copy **Price ID** (price_xxxx) → Save for later

**Product 2 - Pro:**
- Name: `VidFlow Pro`
- Price: `$99/month` (recurring)
- Copy **Price ID** → Save for later

**Product 3 - Enterprise:**
- Name: `VidFlow Enterprise`
- Price: `$299/month` (recurring)
- Copy **Price ID** → Save for later

### 1.3 Enable Customer Portal
- [ ] Go to https://dashboard.stripe.com/test/settings/billing/portal
- [ ] Click **Activate**
- [ ] Enable: Update payment method, Cancel subscription, View invoices

## ☐ Step 2: Environment Setup (2 min)

- [ ] Create `.env.local` file in project root (if it doesn't exist)
- [ ] Add these variables (replace with your values):

```bash
# Supabase (should already be set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe Keys
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Stripe Price IDs
STRIPE_STARTER_PRICE_ID=price_YOUR_STARTER_PRICE_ID
STRIPE_PRO_PRICE_ID=price_YOUR_PRO_PRICE_ID
STRIPE_ENTERPRISE_PRICE_ID=price_YOUR_ENTERPRISE_PRICE_ID
```

Note: We'll get the webhook secret in Step 4

## ☐ Step 3: Database Migration (2 min)

### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Run migration
supabase db push
```

### Option B: Manual SQL Execution

- [ ] Go to Supabase Dashboard → SQL Editor
- [ ] Open file: `supabase/migrations/20260105000000_create_billing_tables.sql`
- [ ] Copy entire contents
- [ ] Paste into SQL Editor
- [ ] Click **Run**
- [ ] Verify tables created: `subscriptions`, `usage_tracking`, `usage_events`, `payments`

## ☐ Step 4: Webhook Setup (3 min)

### For Local Development:

```bash
# Terminal 1: Install Stripe CLI
# macOS
brew install stripe/stripe-cli/stripe

# Windows (Scoop)
scoop install stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

- [ ] Copy the webhook signing secret from terminal output (whsec_xxxx)
- [ ] Update `STRIPE_WEBHOOK_SECRET` in `.env.local`

### For Production:

- [ ] Go to https://dashboard.stripe.com/test/webhooks
- [ ] Click **Add endpoint**
- [ ] Endpoint URL: `https://your-domain.com/api/stripe/webhook`
- [ ] Select events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- [ ] Copy **Signing secret**
- [ ] Update `STRIPE_WEBHOOK_SECRET`

## ☐ Step 5: Test the Integration (3 min)

### 5.1 Start the Application

```bash
npm run dev
```

### 5.2 Visit Pricing Page
- [ ] Open http://localhost:3000/pricing
- [ ] Verify three plans display correctly

### 5.3 Test Checkout
- [ ] Click "Get Started" on any plan
- [ ] Should redirect to Stripe Checkout
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Expiry: Any future date
- [ ] CVC: Any 3 digits
- [ ] Complete checkout
- [ ] Should redirect to `/settings/billing?success=true`

### 5.4 Verify Subscription
- [ ] Check billing page shows active subscription
- [ ] Verify plan details are correct
- [ ] Check credits show "0 / [limit] used"

### 5.5 Test Usage Tracking
- [ ] Go to thumbnail generator
- [ ] Generate an image (3 credits)
- [ ] Return to `/settings/billing`
- [ ] Verify credits updated to "3 / [limit] used"

### 5.6 Test Billing Portal
- [ ] Click "Manage" button
- [ ] Verify Stripe billing portal opens
- [ ] Try viewing payment methods
- [ ] Try canceling subscription (don't confirm)
- [ ] Close portal

## ☐ Step 6: Protect Your API Routes

Add usage tracking to your existing API routes:

```typescript
// Before:
export async function POST(request: NextRequest) {
  // Your code
}

// After:
import { withUsageTracking } from '@/lib/billing/middleware';

export const POST = withUsageTracking('script_generation', async (
  request: NextRequest,
  context: { user: any; subscription: any }
) => {
  // Your code - credits automatically deducted
});
```

Routes to protect:
- [ ] `/api/generate` (already done ✓)
- [ ] Script generation route
- [ ] Voice generation route
- [ ] Video assembly route

## ✅ You're Done!

Your Stripe integration is now live. Users can:
- ✅ Subscribe to plans via `/pricing`
- ✅ Manage subscriptions via `/settings/billing`
- ✅ Automatic credit tracking on each operation
- ✅ View usage and overage costs
- ✅ Self-service billing portal

## Next Steps

### Customize Pricing
Edit `src/lib/stripe/client.ts` and `src/types/billing.ts`

### Add Email Notifications
Set up Stripe email notifications in Dashboard → Settings → Emails

### Go Live
1. Switch Stripe Dashboard to **Live mode**
2. Create products in live mode
3. Get live API keys
4. Update `.env.local` with live keys
5. Set up production webhook

## Troubleshooting

**Checkout not redirecting?**
- Check browser console for errors
- Verify API keys are correct
- Check `.env.local` is loaded

**Webhook not working?**
- For local: Ensure Stripe CLI is running
- Check webhook secret matches
- Review logs: Dashboard → Webhooks → View logs

**Credits not deducting?**
- Verify route uses `withUsageTracking`
- Check user has active subscription
- Review `usage_events` table in Supabase

## Resources

- 📚 Full Guide: `docs/stripe-setup-guide.md`
- 📝 Implementation Details: `STRIPE_IMPLEMENTATION.md`
- 🎯 Stripe Dashboard: https://dashboard.stripe.com
- 🧪 Test Cards: https://stripe.com/docs/testing

## Need Help?

1. Check error logs in browser console
2. Review Stripe Dashboard → Logs
3. Check Supabase Dashboard → Database
4. Review setup guide: `docs/stripe-setup-guide.md`
