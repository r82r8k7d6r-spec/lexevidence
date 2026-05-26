import Stripe from 'stripe';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2026-04-22.dahlia' as any,
});

export const PRICE_FIRST  = 1980; // 初回
export const PRICE_REPEAT = 2980; // 2回目以降
