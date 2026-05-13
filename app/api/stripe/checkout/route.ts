import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

// Use test key for development, live key for production
const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY!
);

export async function POST(req: Request) {
  try {
    // Debug: Log environment variables (localhost only)
    console.log('=== STRIPE CHECKOUT DEBUG ===');
    console.log('STRIPE_SECRET_KEY_TEST exists:', !!process.env.STRIPE_SECRET_KEY_TEST);
    console.log('STRIPE_SECRET_KEY_TEST prefix:', process.env.STRIPE_SECRET_KEY_TEST?.substring(0, 7));
    console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
    console.log('STRIPE_SECRET_KEY prefix:', process.env.STRIPE_SECRET_KEY?.substring(0, 7));
    console.log('Using key:', process.env.STRIPE_SECRET_KEY_TEST ? 'TEST' : 'LIVE');
    console.log('NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID:', process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID);
    console.log('NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID_TEST:', process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID_TEST);
    console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
    console.log('===========================');

    const { userId, email, userName } = await req.json();

    console.log('Stripe checkout request:', { userId, email, userName });

    if (!userId || !email) {
      console.error('Missing userId or email');
      return NextResponse.json(
        { error: 'Missing userId or email' },
        { status: 400 }
      );
    }

    // Check if user already has a Stripe customer ID
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();

    console.log('Existing subscription:', subscription);

    let customerId = subscription?.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      console.log('Creating new Stripe customer');
      const customer = await stripe.customers.create({
        email,
        name: userName || email,
        metadata: {
          userId,
        },
      });
      customerId = customer.id;
      console.log('Created customer:', customerId);

      // Update subscription record with customer ID
      await supabase
        .from('user_subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', userId);
    }

    // Create checkout session - use test price ID if available
    const priceId = process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID_TEST || process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID;
    console.log('Price ID from env:', priceId);
    
    if (!priceId) {
      console.error('Premium price ID not configured');
      return NextResponse.json(
        { error: 'Premium price ID not configured' },
        { status: 500 }
      );
    }

    console.log('Creating checkout session with price:', priceId);
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing?canceled=true`,
      subscription_data: {
        metadata: {
          userId,
        },
      },
    });

    console.log('Checkout session created:', session.url);
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('=== STRIPE CHECKOUT ERROR ===');
    console.error('Error type:', error.type);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    console.error('===========================');
    
    // Return detailed error for localhost debugging
    const detailedError = {
      error: error.message || 'Failed to create checkout session',
      type: error.type,
      code: error.code,
      details: error.raw?.message || error.raw?.error?.message || null,
    };
    
    return NextResponse.json(detailedError, { status: 500 });
  }
}
