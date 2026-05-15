import { NextResponse } from 'next/server';
import { getServiceSupabaseClient } from '@/lib/supabase-service';

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

    const supabase = getServiceSupabaseClient();

    // Get user's subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // DB uses plan_type 'premium'; client expects plan 'pro'
    const rawPlan = subscription?.plan_type ?? 'free';
    const isPro = rawPlan === 'premium' || rawPlan === 'pro';
    const plan: 'free' | 'pro' = isPro ? 'pro' : 'free';
    const limit = isPro ? 50 : 1;

    // Get all scenarios to calculate usage per scenario
    const { data: scenarios } = await supabase
      .from('scenarios')
      .select('id');

    console.log('[subscription/check] Scenarios:', scenarios);

    // Get usage for current period
    const now = new Date().toISOString();
    console.log('[subscription/check] Current time:', now);
    
    // Try a simpler query first - just get all usage for this user
    const { data: allUsage } = await supabase
      .from('scenario_usage')
      .select('scenario_id, sessions_count, period_start, period_end')
      .eq('user_id', userId);
    
    console.log('[subscription/check] All usage records:', allUsage);
    
    // For now, use all usage records (we can filter by period later if needed)
    const usage = allUsage;

    // Build usage map
    const usageMap: Record<string, number> = {};
    const limitsMap: Record<string, number> = {};
    
    scenarios?.forEach(scenario => {
      const scenarioUsage = usage?.find(u => u.scenario_id === scenario.id);
      usageMap[scenario.id] = scenarioUsage?.sessions_count || 0;
      limitsMap[scenario.id] = limit;
    });

    console.log('[subscription/check] Usage map:', usageMap);

    // Calculate totals (if no scenario rows exist yet, avoid 0/0 in the UI)
    const totalUsed = Object.values(usageMap).reduce((sum, count) => sum + count, 0);
    const scenarioCount = scenarios?.length ?? 0;
    const totalLimit = scenarioCount > 0 ? scenarioCount * limit : limit;

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
