import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    // Get user ID from request headers (set by auth middleware or client)
    const userId = req.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // Default to free if no subscription record
    const plan = subscription?.plan_type || 'free';
    const limit = plan === 'premium' ? 50 : 1;

    // Get all scenarios to calculate usage per scenario
    const { data: scenarios } = await supabase
      .from('scenarios')
      .select('id');

    // Get usage for current period
    const now = new Date().toISOString();
    const { data: usage } = await supabase
      .from('scenario_usage')
      .select('scenario_id, sessions_count')
      .eq('user_id', userId)
      .lte('period_start', now)
      .gte('period_end', now);

    // Build usage map
    const usageMap: Record<string, number> = {};
    const limitsMap: Record<string, number> = {};
    
    scenarios?.forEach(scenario => {
      const scenarioUsage = usage?.find(u => u.scenario_id === scenario.id);
      usageMap[scenario.id] = scenarioUsage?.sessions_count || 0;
      limitsMap[scenario.id] = limit;
    });

    // Calculate totals
    const totalUsed = Object.values(usageMap).reduce((sum, count) => sum + count, 0);
    const totalLimit = (scenarios?.length || 0) * limit;

    return NextResponse.json({
      plan,
      status: subscription?.status || 'active',
      usage: usageMap,
      limits: limitsMap,
      totalUsed,
      totalLimit,
      currentPeriodEnd: subscription?.current_period_end,
      canStart: true // User said "nothing" happens at limit
    });
  } catch (error) {
    console.error('Subscription check error:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription' },
      { status: 500 }
    );
  }
}
