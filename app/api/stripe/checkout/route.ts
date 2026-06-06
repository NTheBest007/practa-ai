import { NextResponse } from 'next/server';
import { getServiceSupabaseClient } from '@/lib/supabase-service';
import { getStripeServer } from '@/lib/stripe-server';

export async function POST(req: Request) {
  try {
    const stripe = getStripeServer();
    const supabase = getServiceSupabaseClient();
    const { userId, email, userName } = await req.json();

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

    let customerId = subscription?.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        name: userName || email,
        metadata: {
          userId,
        },
      });
      customerId = customer.id;

      // Update subscription record with customer ID
      await supabase
        .from('user_subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', userId);
    }

    const priceId = process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID;
    
    if (!priceId) {
      console.error('Premium price ID not configured');
      return NextResponse.json(
        { error: 'Premium price ID not configured' },
        { status: 500 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: userId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/dashboard?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      subscription_data: {
        metadata: {
          userId,
        },
      },
    });

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
