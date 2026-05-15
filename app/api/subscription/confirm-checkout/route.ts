import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripeServer } from '@/lib/stripe-server';
import { getServiceSupabaseClient } from '@/lib/supabase-service';
import { stripeUnixSecondsToIso } from '@/lib/stripe-period';

export const runtime = 'nodejs';

/**
 * After Stripe Checkout redirects back, the browser calls this with the session id.
 * Upserts Pro in Supabase so upgrades work even if the webhook is delayed or misconfigured.
 * Security: session must belong to the same user (metadata or client_reference_id).
 */
export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as { sessionId?: string };
    const sessionId = body.sessionId?.trim();
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const stripe = getStripeServer();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    if (session.status !== 'complete') {
      return NextResponse.json(
        { error: `Checkout not complete (${session.status})` },
        { status: 400 }
      );
    }

    if (session.mode !== 'subscription') {
      return NextResponse.json({ error: 'Not a subscription checkout' }, { status: 400 });
    }

    const subField = session.subscription;
    let subscriptionId: string;
    if (typeof subField === 'string') {
      subscriptionId = subField;
    } else if (subField && typeof subField === 'object' && 'id' in subField) {
      subscriptionId = (subField as Stripe.Subscription).id;
    } else {
      return NextResponse.json(
        { error: 'No subscription on checkout session' },
        { status: 400 }
      );
    }

    // Full retrieve — expanded subscription often lacks period_* timestamps
    const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
    // Handle Stripe Response wrapper
    const subData = (stripeSub as any).object || stripeSub;

    const metaUserId = subData.metadata?.userId;
    const refUserId = session.client_reference_id;
    if (metaUserId !== userId && refUserId !== userId) {
      return NextResponse.json(
        { error: 'This checkout does not belong to your account' },
        { status: 403 }
      );
    }

    const customerId =
      typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id;
    if (!customerId) {
      return NextResponse.json({ error: 'No customer on session' }, { status: 400 });
    }

    const periodStart = stripeUnixSecondsToIso(subData.current_period_start);
    const periodEnd = stripeUnixSecondsToIso(subData.current_period_end);

    const row: Record<string, unknown> = {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subData.id,
      plan_type: 'premium',
      status: 'active',
      updated_at: new Date().toISOString(),
    };
    if (periodStart) row.current_period_start = periodStart;
    if (periodEnd) row.current_period_end = periodEnd;

    const supabase = getServiceSupabaseClient();
    const { error } = await supabase
      .from('user_subscriptions')
      .upsert(row, { onConflict: 'user_id' });

    if (error) {
      console.error('[confirm-checkout] upsert error:', error);
      return NextResponse.json(
        { error: 'Failed to save subscription', detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, plan: 'pro' });
  } catch (e) {
    console.error('[confirm-checkout]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
