'use client';

import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { useRevenueCat } from '@/hooks/use-revenuecat';
import { toast } from 'sonner';
import Paywall from '@/components/paywall';

export default function PricingPage() {
  const { user, subscription, subscriptionLoading } = useAuth();
  const { status, offerings, purchase } = useRevenueCat();
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      toast.error('Please sign in first');
      return;
    }
    
    // Show custom paywall
    setShowPaywall(true);
  };

  const handleManage = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Use RevenueCat's management URL for subscription management
      if (status.managementURL) {
        window.location.href = status.managementURL;
      } else {
        toast.error('No management portal available');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
    setLoading(false);
  };

  const isPro = subscription?.plan === 'pro';
  const isLoading = subscriptionLoading || loading;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Simple, transparent pricing</h1>
          <p className="mt-4 text-lg text-white/60">
            Start free, upgrade when you need more practice
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* Free Plan */}
          <Card className="glass glow-border p-6">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                <Sparkles className="h-5 w-5 text-white/60" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Free</h3>
                <p className="text-sm text-white/50">Get started</p>
              </div>
            </div>

            <div className="mt-4">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-white/50">/month</span>
            </div>

            <ul className="mt-6 space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-emerald-400" />
                1 call per scenario
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-emerald-400" />
                All scenarios included
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-emerald-400" />
                Basic feedback & scoring
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-emerald-400" />
                Analytics dashboard
              </li>
            </ul>

            <Button
              className="mt-6 w-full"
              variant="outline"
              disabled={isLoading || isPro}
            >
              {isPro ? 'Included with Pro' : 'Current Plan'}
            </Button>
          </Card>

          {/* Pro Plan */}
          <Card className="glass glow-border glow-border-green relative p-6">
            <div className="absolute -top-3 right-6 rounded-full bg-emerald-500 px-3 py-1 text-xs font-medium text-white">
              Most Popular
            </div>

            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 ring-1 ring-emerald-500/30">
                <Sparkles className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Pro</h3>
                <p className="text-sm text-white/50">Unlimited practice</p>
              </div>
            </div>

            <div className="mt-4">
              <span className="text-4xl font-bold">$19.99</span>
              <span className="text-white/50">/month</span>
            </div>

            <ul className="mt-6 space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="font-medium">50 calls per scenario</span> / month
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-emerald-400" />
                All scenarios included
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-emerald-400" />
                Advanced feedback & coaching
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-emerald-400" />
                Detailed analytics & insights
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-emerald-400" />
                Priority support
              </li>
            </ul>

            {isPro ? (
              <Button
                className="mt-6 w-full"
                onClick={handleManage}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Manage Subscription'
                )}
              </Button>
            ) : (
              <Button
                className="btn-glow mt-6 w-full"
                onClick={handleUpgrade}
                disabled={isLoading || !user}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : !user ? (
                  'Sign in to Upgrade'
                ) : (
                  'Upgrade to Pro'
                )}
              </Button>
            )}
          </Card>
        </div>

        {subscription && (
          <div className="mt-8 text-center text-sm text-white/50">
            Current plan: <span className="font-medium text-white">{subscription.plan}</span>
            {subscription.currentPeriodEnd && (
              <span className="ml-2">
                (Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()})
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Custom Paywall */}
      <Paywall 
        isOpen={showPaywall} 
        onClose={() => setShowPaywall(false)} 
      />
    </AppShell>
  );
}
