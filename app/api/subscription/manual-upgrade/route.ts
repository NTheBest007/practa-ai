import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Manually upgrade user to premium
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        plan_type: 'premium',
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error manually upgrading subscription:', error);
      return NextResponse.json(
        { error: 'Failed to upgrade subscription' },
        { status: 500 }
      );
    }

    console.log('Manually upgraded user to premium:', userId);
    return NextResponse.json({ success: true, message: 'Upgraded to premium' });
  } catch (error) {
    console.error('Manual upgrade error:', error);
    return NextResponse.json(
      { error: 'Manual upgrade failed' },
      { status: 500 }
    );
  }
}
