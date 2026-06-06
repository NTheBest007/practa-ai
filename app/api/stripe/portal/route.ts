import { NextResponse } from 'next/server';
import { getServiceSupabaseClient } from '@/lib/supabase-service';
import { getStripeServer } from '@/lib/stripe-server';

export async function POST(req: Request) {
  try {
    const stripe = getStripeServer();
    const supabase = getServiceSupabaseClient();
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Get user's Stripe customer ID
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!subscription?.stripe_customer_id) {
      console.error('[stripe/portal] No stripe_customer_id for userId:', userId);
      return NextResponse.json(
        { error: 'No Stripe customer found — complete a purchase first' },
        { status: 404 }
      );
    }

    console.log('[stripe/portal] Creating portal for customer:', subscription.stripe_customer_id);

    // Create customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('[stripe/portal] Error:', error?.message, error?.type, error?.code);
    return NextResponse.json(
      { error: error?.message || 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
