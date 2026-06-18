import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServiceSupabaseClient } from '@/lib/supabase-service';
import { getStripeServer } from '@/lib/stripe-server';
import { stripeUnixSecondsToIso } from '@/lib/stripe-period';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_LIVE!;

export async function POST(req: Request) {
  try {
    const stripe = getStripeServer();
    const payload = await req.text();
    const signature = req.headers.get('stripe-signature')!;

    let event: Stripe.Event;
    const supabase = getServiceSupabaseClient();

    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Processing Stripe webhook:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        if (!subscriptionId) {
          console.error('Missing subscriptionId in checkout session');
          break;
        }

        // Get subscription details from Stripe (userId is in subscription metadata)
        const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
        // Handle Stripe Response wrapper
        const subData = (stripeSub as any).object || stripeSub;
        const userId = subData.metadata?.userId;

        if (!userId) {
          console.error('Missing userId in subscription metadata');
          break;
        }

        const periodStart = stripeUnixSecondsToIso(subData.current_period_start);
        const periodEnd = stripeUnixSecondsToIso(subData.current_period_end);
        const upsertRow: Record<string, unknown> = {
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan_type: 'premium',
          status: 'active',
          updated_at: new Date().toISOString(),
        };
        if (periodStart) upsertRow.current_period_start = periodStart;
        if (periodEnd) upsertRow.current_period_end = periodEnd;

        // Update user's subscription to premium
        const { error } = await supabase
          .from('user_subscriptions')
          .upsert(upsertRow, {
            onConflict: 'user_id',
          });

        if (error) {
          console.error('Error updating subscription:', error);
        } else {
          console.log('User upgraded to premium:', userId);

          // Migrate existing usage to new billing period to preserve call counts
          if (periodStart && periodEnd) {
            const { error: migrateError } = await supabase.rpc(
              'migrate_usage_on_upgrade',
              {
                p_user_id: userId,
                p_new_period_start: periodStart,
                p_new_period_end: periodEnd,
              }
            );

            if (migrateError) {
              console.error('Error migrating usage:', migrateError);
            } else {
              console.log('Usage migrated for user:', userId);
            }
          }
        }
        break;
      }

      case 'account.updated': {
        const account: any = event.data.object;
        if (account.charges_enabled && account.details_submitted) {
          await supabase
            .from('affiliates')
            .update({ status: 'active' })
            .eq('stripe_account_id', account.id);
          console.log('Affiliate account activated:', account.id);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice: any = event.data.object;
        const subscriptionId = invoice.subscription;
        const customerId = invoice.customer;

        if (!subscriptionId) break;

        // Get subscription details
        const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
        // Handle Stripe Response wrapper
        const subData = (stripeSub as any).object || stripeSub;

        // Find user by Stripe customer ID
        const { data: userSub } = await supabase
          .from('user_subscriptions')
          .select('user_id, current_period_end')
          .eq('stripe_subscription_id', subscriptionId)
          .maybeSingle();

        if (userSub) {
          const newEndIso = stripeUnixSecondsToIso(subData.current_period_end);
          const oldPeriodEnd = new Date(userSub.current_period_end || 0);
          const newPeriodEnd = newEndIso ? new Date(newEndIso) : null;

          // Check if this is a new billing period (subscription renewed)
          if (newPeriodEnd && newPeriodEnd > oldPeriodEnd) {
            // Reset scenario usage for the new period
            const { error: deleteError } = await supabase
              .from('scenario_usage')
              .delete()
              .eq('user_id', userSub.user_id)
              .lt('period_end', new Date().toISOString());

            if (deleteError) {
              console.error('Error resetting usage:', deleteError);
            } else {
              console.log('Usage reset for new billing period:', userSub.user_id);
            }
          }

          const periodStart = stripeUnixSecondsToIso(subData.current_period_start);
          const updateRow: Record<string, unknown> = {
            status: 'active',
            updated_at: new Date().toISOString(),
          };
          if (periodStart) updateRow.current_period_start = periodStart;
          if (newEndIso) updateRow.current_period_end = newEndIso;

          // Update subscription period
          await supabase
            .from('user_subscriptions')
            .update(updateRow)
            .eq('stripe_subscription_id', subscriptionId);

          // Track affiliate commission if this user was referred
          if (userSub && invoice.amount_paid > 0) {
            const { data: referral } = await supabase
              .from('referrals')
              .select('id, affiliate_id, affiliates!inner(commission_rate, stripe_account_id)')
              .eq('referred_user_id', userSub.user_id)
              .maybeSingle();

            if (referral?.affiliates) {
              const commission = (invoice.amount_paid / 100) * ((referral.affiliates as any).commission_rate || 0.2);
              // Update referral and affiliate earnings
              await supabase
                .from('referrals')
                .update({ status: 'active', total_commission_earned: commission })
                .eq('id', referral.id);
              await supabase
                .from('affiliates')
                .update({ total_earned: commission })
                .eq('id', referral.affiliate_id);
              console.log('Affiliate commission tracked:', commission, 'for referral:', referral.id);
            }
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const failedInvoice: any = event.data.object;
        const failedSubId = failedInvoice.subscription;

        if (failedSubId) {
          await supabase
            .from('user_subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', failedSubId);

          console.log('Payment failed, marked past_due:', failedSubId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const updatedSub = event.data.object as any;

        const periodEnd = stripeUnixSecondsToIso(updatedSub.current_period_end);
        const updateSubRow: Record<string, unknown> = {
          status:
            updatedSub.status === 'active'
              ? 'active'
              : updatedSub.status === 'canceled'
                ? 'canceled'
                : updatedSub.status === 'past_due'
                  ? 'past_due'
                  : 'incomplete',
          updated_at: new Date().toISOString(),
        };
        if (periodEnd) updateSubRow.current_period_end = periodEnd;

        await supabase
          .from('user_subscriptions')
          .update(updateSubRow)
          .eq('stripe_subscription_id', updatedSub.id);

        console.log('Subscription updated:', updatedSub.id, updatedSub.status);
        break;
      }

      case 'customer.subscription.deleted': {
        const deletedSub: any = event.data.object;

        // Downgrade to free when subscription is canceled/deleted
        await supabase
          .from('user_subscriptions')
          .update({
            plan_type: 'free',
            status: 'canceled',
            stripe_subscription_id: null,
            current_period_end: null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', deletedSub.id);

        console.log('Subscription deleted, downgraded to free:', deletedSub.id);
        break;
      }

      default:
        console.log('Unhandled webhook event:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
