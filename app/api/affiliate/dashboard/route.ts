import { NextResponse } from 'next/server';
import { getServiceSupabaseClient } from '@/lib/supabase-service';
import { getStripeServer } from '@/lib/stripe-server';

export async function GET(req: Request) {
  try {
    const supabase = getServiceSupabaseClient();
    const userId = req.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    // Get affiliate record
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!affiliate) {
      return NextResponse.json({ affiliate: null, referrals: [], balance: null });
    }

    // Get referrals
    const { data: referrals } = await supabase
      .from('referrals')
      .select('*')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false });

    // Get Stripe balance if active
    let balance = null;
    if (affiliate.stripe_account_id && affiliate.status === 'active') {
      try {
        const stripe = getStripeServer();
        const stripeBalance = await stripe.balance.retrieve(
          {},
          { stripeAccount: affiliate.stripe_account_id }
        );
        balance = {
          available: stripeBalance.available.reduce((sum, b) => sum + b.amount, 0) / 100,
          pending: stripeBalance.pending.reduce((sum, b) => sum + b.amount, 0) / 100,
          currency: stripeBalance.available[0]?.currency || 'usd',
        };
      } catch (e) {
        console.error('[Affiliate] Balance fetch error:', e);
      }
    }

    return NextResponse.json({
      affiliate,
      referrals: referrals || [],
      balance,
    });
  } catch (error: any) {
    console.error('[Affiliate] Dashboard error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch affiliate data' },
      { status: 500 }
    );
  }
}
