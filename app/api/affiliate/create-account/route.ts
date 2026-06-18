import { NextResponse } from 'next/server';
import { getServiceSupabaseClient } from '@/lib/supabase-service';
import { getStripeServer } from '@/lib/stripe-server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const stripe = getStripeServer();
    const supabase = getServiceSupabaseClient();
    const { userId, email } = await req.json();

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 });
    }

    // Check if user already has an affiliate record
    const { data: existing } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing?.stripe_account_id && existing.status === 'active') {
      return NextResponse.json({ error: 'Already an active affiliate' }, { status: 400 });
    }

    // Create Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      metadata: { userId },
      capabilities: {
        transfers: { requested: true },
      },
    });

    // Generate unique referral code
    const referralCode = `REF-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Upsert affiliate record
    await supabase.from('affiliates').upsert(
      {
        user_id: userId,
        stripe_account_id: account.id,
        referral_code: referralCode,
        status: 'pending',
      },
      { onConflict: 'user_id' }
    );

    // Create onboarding link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${baseUrl}/affiliate?refresh=true`,
      return_url: `${baseUrl}/api/affiliate/onboard-return?account_id=${account.id}`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error('[Affiliate] Create account error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create affiliate account' },
      { status: 500 }
    );
  }
}
