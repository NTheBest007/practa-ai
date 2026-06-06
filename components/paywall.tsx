'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Loader2, Sparkles, X, Crown, Zap, Shield, Star } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

interface PaywallProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Paywall({ isOpen, onClose }: PaywallProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      // Direct Stripe checkout for localhost debugging
      if (!user) {
        toast.error('Please sign in first');
        setLoading(false);
        return;
      }

      // Call Stripe checkout API directly
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          userName: user.user_metadata?.full_name || user.email,
        }),
      });

      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        // Display detailed error for localhost debugging
        const errorMessage = data.error || 'Failed to create checkout session';
        const errorDetails = data.type ? ` (${data.type}: ${data.code || data.details || ''})` : '';
        
        console.error('Stripe checkout failed:', data);
        
        // Show detailed error in development mode
        if (process.env.NODE_ENV === 'development') {
          toast.error(`Stripe Error: ${errorMessage}${errorDetails}`, {
            duration: 8000,
          });
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 rounded-full bg-white/10 p-2 text-white/60 hover:bg-white/20 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Paywall Content */}
        <Card className="glass glow-border glow-border-green p-8 text-center">
          {/* Header */}
          <div className="mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Upgrade to Practa.ai Pro</h2>
            <p className="text-white/60 text-lg">
              Unlock unlimited practice and advanced features
            </p>
          </div>

          {/* Price Display */}
          <div className="mb-8">
            <div className="mb-2">
              <span className="text-5xl font-bold text-white">
                $19.99
              </span>
              <span className="text-white/50 text-xl">/month</span>
            </div>
            <div className="inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-1 text-sm text-emerald-400 ring-1 ring-emerald-500/30">
              <Zap className="mr-1 h-3 w-3" />
              Most Popular
            </div>
          </div>

          {/* Features */}
          <div className="mb-8 space-y-4">
            <div className="grid gap-4 text-left">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 ring-1 ring-emerald-500/30">
                  <Check className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <div className="font-medium text-white">50 calls per scenario</div>
                  <div className="text-sm text-white/50">Per month, reset automatically</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 ring-1 ring-emerald-500/30">
                  <Check className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <div className="font-medium text-white">Advanced feedback & coaching</div>
                  <div className="text-sm text-white/50">Detailed insights and improvements</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 ring-1 ring-emerald-500/30">
                  <Check className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <div className="font-medium text-white">Detailed analytics & insights</div>
                  <div className="text-sm text-white/50">Track your progress over time</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 ring-1 ring-emerald-500/30">
                  <Check className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <div className="font-medium text-white">Priority support</div>
                  <div className="text-sm text-white/50">Get help when you need it</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 ring-1 ring-emerald-500/30">
                  <Check className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <div className="font-medium text-white">All scenarios included</div>
                  <div className="text-sm text-white/50">Access to every practice scenario</div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mb-8 flex justify-center gap-6">
            <div className="flex items-center gap-2 text-white/40">
              <Shield className="h-4 w-4" />
              <span className="text-sm">Secure payment</span>
            </div>
            <div className="flex items-center gap-2 text-white/40">
              <Star className="h-4 w-4" />
              <span className="text-sm">Cancel anytime</span>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handlePurchase}
            disabled={loading}
            className="btn-glow w-full py-4 text-lg font-semibold"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Crown className="mr-2 h-5 w-5" />
                Continue to Secure Checkout
              </>
            )}
          </Button>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-white/40">
              30-day money-back guarantee • No hidden fees
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
