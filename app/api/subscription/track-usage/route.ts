import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { userId, scenarioId } = await req.json();

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

    // Check if usage record exists for this period
    const { data: existingUsage } = await supabase
      .from('scenario_usage')
      .select('id, sessions_count')
      .eq('user_id', userId)
      .eq('scenario_id', scenarioId)
      .lte('period_start', periodStart)
      .gte('period_end', periodEnd)
      .maybeSingle();

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
        console.error('Error updating usage:', error);
        return NextResponse.json(
          { error: 'Failed to track usage' },
          { status: 500 }
        );
      }
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
        console.error('Error creating usage:', error);
        return NextResponse.json(
          { error: 'Failed to track usage' },
          { status: 500 }
        );
      }
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
