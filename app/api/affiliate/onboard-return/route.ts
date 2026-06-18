import { NextResponse } from 'next/server';
import { getServiceSupabaseClient } from '@/lib/supabase-service';
import { getStripeServer } from '@/lib/stripe-server';

export async function GET(req: Request) {
  try {
    const stripe = getStripeServer();
    const supabase = getServiceSupabaseClient();
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('account_id');

    if (!accountId) {
      return NextResponse.redirect(new URL('/affiliate?error=missing_account', req.url));
    }

    // Check if the account has completed onboarding
    const account = await stripe.accounts.retrieve(accountId);

    if (account.charges_enabled || account.details_submitted) {
      // Mark affiliate as active
      await supabase
        .from('affiliates')
        .update({ status: 'active' })
        .eq('stripe_account_id', accountId);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${baseUrl}/affiliate?onboarded=true`);
  } catch (error: any) {
    console.error('[Affiliate] Onboard return error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${baseUrl}/affiliate?error=onboard_failed`);
  }
}
