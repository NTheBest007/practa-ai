import { NextResponse } from 'next/server';
import { getServiceSupabaseClient } from '@/lib/supabase-service';

export async function POST(req: Request) {
  try {
    const supabase = getServiceSupabaseClient();
    const { userId, scenarioId } = await req.json();

    console.log('[track-usage] Called with:', { userId, scenarioId });

    if (!userId || !scenarioId) {
      return NextResponse.json(
        { error: 'Missing userId or scenarioId' },
        { status: 400 }
      );
    }

    // Get user's subscription to determine period
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('plan_type, current_period_end')
      .eq('user_id', userId)
      .maybeSingle();

    console.log('[track-usage] Subscription:', subscription);

    const isPremium = subscription?.plan_type === 'premium';
    
    // Set period dates
    let periodStart: string;
    let periodEnd: string;
    
    if (isPremium && subscription?.current_period_end) {
      // Premium: Use Stripe billing period
      const endDate = new Date(subscription.current_period_end);
      periodEnd = endDate.toISOString();
      periodStart = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days before
    } else {
      // Free: Just track all time (or could reset monthly)
      periodStart = new Date(0).toISOString(); // Beginning of time
      periodEnd = new Date(8640000000000000).toISOString(); // Far future
    }

    console.log('[track-usage] Period:', { periodStart, periodEnd, isPremium });

    // Check if usage record exists for this period
    const { data: existingUsage } = await supabase
      .from('scenario_usage')
      .select('id, sessions_count')
      .eq('user_id', userId)
      .eq('scenario_id', scenarioId)
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)
      .maybeSingle();

    console.log('[track-usage] Existing usage:', existingUsage);

    if (existingUsage) {
      // Update existing record
      const { error } = await supabase
        .from('scenario_usage')
        .update({
          sessions_count: existingUsage.sessions_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUsage.id);

      if (error) {
        console.error('[track-usage] Error updating usage:', error);
        return NextResponse.json(
          { error: 'Failed to track usage' },
          { status: 500 }
        );
      }
      console.log('[track-usage] Updated usage to:', existingUsage.sessions_count + 1);
    } else {
      // Create new usage record
      const { error } = await supabase
        .from('scenario_usage')
        .insert({
          user_id: userId,
          scenario_id: scenarioId,
          sessions_count: 1,
          period_start: periodStart,
          period_end: periodEnd,
        });

      if (error) {
        console.error('[track-usage] Error creating usage:', error);
        return NextResponse.json(
          { error: 'Failed to track usage' },
          { status: 500 }
        );
      }
      console.log('[track-usage] Created new usage record');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track usage error:', error);
    return NextResponse.json(
      { error: 'Failed to track usage' },
      { status: 500 }
    );
  }
}
