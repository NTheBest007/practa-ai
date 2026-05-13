import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const payload = await req.text();
    const signature = req.headers.get('stripe-signature')!;

    let event: Stripe.Event;

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
        const stripeSub: any = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = stripeSub.metadata?.userId;

        if (!userId) {
          console.error('Missing userId in subscription metadata');
          break;
        }

        // Update user's subscription to premium
        const { error } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan_type: 'premium',
            status: 'active',
            current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          });

        if (error) {
          console.error('Error updating subscription:', error);
        } else {
          console.log('User upgraded to premium:', userId);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice: any = event.data.object;
        const subscriptionId = invoice.subscription;
        const customerId = invoice.customer;

        if (!subscriptionId) break;

        // Get subscription details
        const stripeSub: any = await stripe.subscriptions.retrieve(subscriptionId);

        // Find user by Stripe customer ID
        const { data: userSub } = await supabase
          .from('user_subscriptions')
          .select('user_id, current_period_end')
          .eq('stripe_subscription_id', subscriptionId)
          .maybeSingle();

        if (userSub) {
          const oldPeriodEnd = new Date(userSub.current_period_end || 0);
          const newPeriodEnd = new Date(stripeSub.current_period_end * 1000);

          // Check if this is a new billing period (subscription renewed)
          if (newPeriodEnd > oldPeriodEnd) {
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

          // Update subscription period
          await supabase
            .from('user_subscriptions')
            .update({
              status: 'active',
              current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
              current_period_end: newPeriodEnd.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId);
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
        const updatedSub: any = event.data.object;

        await supabase
          .from('user_subscriptions')
          .update({
            status: updatedSub.status === 'active' ? 'active' : 
                    updatedSub.status === 'canceled' ? 'canceled' : 
                    updatedSub.status === 'past_due' ? 'past_due' : 'incomplete',
            current_period_end: new Date(updatedSub.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
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
