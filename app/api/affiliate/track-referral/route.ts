import { NextResponse } from 'next/server';
import { getServiceSupabaseClient } from '@/lib/supabase-service';

export async function POST(req: Request) {
  try {
    const supabase = getServiceSupabaseClient();
    const { referralCode, userId } = await req.json();

    if (!referralCode || !userId) {
      return NextResponse.json({ error: 'Missing referralCode or userId' }, { status: 400 });
    }

    // Look up the affiliate by referral code
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('id, user_id')
      .eq('referral_code', referralCode)
      .maybeSingle();

    if (!affiliate) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    // Don't allow self-referral
    if (affiliate.user_id === userId) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
    }

    // Check if user already has a referral
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_user_id', userId)
      .maybeSingle();

    if (existingReferral) {
      return NextResponse.json({ error: 'User already referred' }, { status: 400 });
    }

    // Create referral record
    const { error } = await supabase.from('referrals').insert({
      affiliate_id: affiliate.id,
      referred_user_id: userId,
      status: 'signed_up',
    });

    if (error) {
      console.error('[Affiliate] Track referral error:', error);
      return NextResponse.json({ error: 'Failed to track referral' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Affiliate] Track referral error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to track referral' },
      { status: 500 }
    );
  }
}
