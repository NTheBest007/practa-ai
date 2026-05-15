import Stripe from 'stripe';

/** Same key selection as checkout: test key in dev when set. */
export function getStripeServer(): Stripe {
  const key =
    process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('Missing STRIPE_SECRET_KEY or STRIPE_SECRET_KEY_TEST');
  }
  return new Stripe(key);
}
