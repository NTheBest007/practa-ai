'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { Users, Copy, DollarSign, TrendingUp, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

type Affiliate = {
  id: string;
  user_id: string;
  stripe_account_id: string | null;
  referral_code: string;
  status: 'pending' | 'active' | 'disabled';
  commission_rate: number;
  total_earned: number;
  created_at: string;
};

type Referral = {
  id: string;
  referred_user_id: string;
  status: string;
  total_commission_earned: number;
  created_at: string;
};

type Balance = {
  available: number;
  pending: number;
  currency: string;
};

export default function AffiliatePage() {
  const { user } = useAuth();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchDashboard();
  }, [user]);

  async function fetchDashboard() {
    if (!user) return;
    try {
      const res = await fetch('/api/affiliate/dashboard', {
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        setAffiliate(data.affiliate);
        setReferrals(data.referrals || []);
        setBalance(data.balance);
      }
    } catch (e) {
      console.error('Error fetching affiliate data:', e);
    }
    setLoading(false);
  }

  async function becomeAffiliate() {
    if (!user) return;
    setCreating(true);
    try {
      const res = await fetch('/api/affiliate/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Failed to start onboarding');
      }
    } catch (e) {
      toast.error('Something went wrong');
    }
    setCreating(false);
  }

  function copyReferralLink() {
    if (!affiliate) return;
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/signup?ref=${affiliate.referral_code}`;
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied!');
  }

  function copyReferralCode() {
    if (!affiliate) return;
    navigator.clipboard.writeText(affiliate.referral_code);
    toast.success('Referral code copied!');
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  // Not an affiliate yet
  if (!affiliate) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-400/10 ring-1 ring-emerald-400/20">
            <Users className="h-8 w-8 text-emerald-300" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">Affiliate Program</h1>
          <p className="mt-3 text-lg text-white/60">
            Earn 20% commission on every payment from users you refer. Get paid automatically via Stripe.
          </p>
          <div className="mt-8 glass glow-border rounded-2xl p-8 text-left">
            <h3 className="text-lg font-semibold">How it works</h3>
            <div className="mt-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-xs font-bold text-emerald-300">1</div>
                <p className="text-white/70">Sign up as an affiliate and connect your bank via Stripe</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-xs font-bold text-emerald-300">2</div>
                <p className="text-white/70">Share your unique referral link with potential users</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-xs font-bold text-emerald-300">3</div>
                <p className="text-white/70">Earn 20% of every payment they make — automatically deposited to your bank</p>
              </div>
            </div>
          </div>
          <Button
            onClick={becomeAffiliate}
            disabled={creating}
            className="btn-glow mt-8 h-12 rounded-xl px-8 text-base font-semibold"
          >
            {creating ? 'Setting up...' : 'Become an Affiliate'}
          </Button>
        </div>
      </AppShell>
    );
  }

  // Affiliate dashboard
  return (
    <AppShell>
      <div>
        <div className="text-sm font-medium text-emerald-400">Affiliate Program</div>
        <h1 className="mt-1 text-4xl font-semibold tracking-tight">Your Referrals</h1>
        <p className="mt-2 text-white/60">Share your link, earn 20% on every payment.</p>
      </div>

      {/* Status banner */}
      {affiliate.status === 'pending' && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
          <Clock className="h-5 w-5 text-amber-300" />
          <div>
            <div className="font-medium text-amber-200">Onboarding incomplete</div>
            <p className="text-sm text-white/50">Complete your Stripe onboarding to start receiving payouts.</p>
          </div>
          <Button onClick={becomeAffiliate} variant="outline" className="ml-auto text-sm">
            Complete Setup <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="glass glow-border rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 ring-1 ring-emerald-400/20">
              <Users className="h-4 w-4 text-emerald-300" />
            </div>
            <div>
              <div className="text-xs text-white/60">Referrals</div>
              <div className="text-xl font-semibold text-white">{referrals.length}</div>
            </div>
          </div>
        </div>
        <div className="glass glow-border rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 ring-1 ring-emerald-400/20">
              <DollarSign className="h-4 w-4 text-emerald-300" />
            </div>
            <div>
              <div className="text-xs text-white/60">Total Earned</div>
              <div className="text-xl font-semibold text-white">${Number(affiliate.total_earned).toFixed(2)}</div>
            </div>
          </div>
        </div>
        <div className="glass glow-border rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/10 ring-1 ring-blue-400/20">
              <TrendingUp className="h-4 w-4 text-blue-300" />
            </div>
            <div>
              <div className="text-xs text-white/60">Available</div>
              <div className="text-xl font-semibold text-white">${balance?.available?.toFixed(2) || '0.00'}</div>
            </div>
          </div>
        </div>
        <div className="glass glow-border rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-400/10 ring-1 ring-purple-400/20">
              <Clock className="h-4 w-4 text-purple-300" />
            </div>
            <div>
              <div className="text-xs text-white/60">Pending</div>
              <div className="text-xl font-semibold text-white">${balance?.pending?.toFixed(2) || '0.00'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Link */}
      <div className="mt-8 glass glow-border rounded-2xl p-6">
        <h3 className="text-base font-semibold">Your Referral Link</h3>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80 font-mono">
            {typeof window !== 'undefined'
              ? `${window.location.origin}/signup?ref=${affiliate.referral_code}`
              : `/signup?ref=${affiliate.referral_code}`}
          </div>
          <Button onClick={copyReferralLink} variant="outline" className="shrink-0">
            <Copy className="mr-2 h-4 w-4" /> Copy Link
          </Button>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-sm text-white/50">Code:</span>
          <code className="rounded bg-white/5 px-2 py-1 text-sm font-mono text-emerald-300">
            {affiliate.referral_code}
          </code>
          <button onClick={copyReferralCode} className="text-xs text-white/40 hover:text-white transition-colors">
            Copy
          </button>
        </div>
      </div>

      {/* Referrals List */}
      <div className="mt-8">
        <h3 className="text-base font-semibold mb-4">Referred Users</h3>
        {referrals.length === 0 ? (
          <div className="glass glow-border rounded-2xl p-8 text-center">
            <p className="text-white/50">No referrals yet. Share your link to start earning!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {referrals.map((r) => (
              <div key={r.id} className="glass glow-border flex items-center justify-between rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400/10">
                    <CheckCircle className="h-4 w-4 text-emerald-300" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{r.referred_user_id.slice(0, 8)}...</div>
                    <div className="text-xs text-white/50">
                      {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-emerald-300">
                    ${Number(r.total_commission_earned).toFixed(2)}
                  </div>
                  <div className={`text-xs ${
                    r.status === 'active' ? 'text-emerald-400' :
                    r.status === 'converted' ? 'text-blue-400' : 'text-white/40'
                  }`}>
                    {r.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
