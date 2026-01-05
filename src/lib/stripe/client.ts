import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

// Initialize Stripe with the latest API version
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Stripe configuration constants
export const STRIPE_CONFIG = {
  currency: 'usd',
  // Subscription plan IDs - these should match your Stripe dashboard
  plans: {
    starter: {
      priceId: process.env.STRIPE_STARTER_PRICE_ID || '',
      name: 'Starter',
      credits: 100, // included API credits per month
    },
    pro: {
      priceId: process.env.STRIPE_PRO_PRICE_ID || '',
      name: 'Pro',
      credits: 500,
    },
    enterprise: {
      priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
      name: 'Enterprise',
      credits: 2000,
    },
  },
  // Usage metering for overages
  usageMeter: {
    // Cost per credit when exceeding plan limits
    pricePerCredit: 0.01, // $0.01 per credit
  },
} as const;
