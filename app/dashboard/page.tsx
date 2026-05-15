'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { supabase, Scenario, Session } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { ArrowRight, Play, Clock, Sparkles, Crown, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

type SessionWithScenario = Session & { scenario: Scenario | null };

export default function DashboardPage() {
  const { user, subscription, subscriptionLoading, refreshSubscription } =
    useAuth();
  const [sessions, setSessions] = useState<SessionWithScenario[]>([]);
  const [loading, setLoading] = useState(true);

  // After Stripe Checkout: confirm session server-side (sets Pro even if webhook failed), then refresh plan
  useEffect(() => {
    if (!user || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('subscription') !== 'success') return;

    let cancelled = false;
    const sync = async () => {
      const sessionId = params.get('session_id');
      try {
        if (sessionId) {
          const res = await fetch('/api/subscription/confirm-checkout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': user.id,
            },
            body: JSON.stringify({ sessionId }),
          });
          if (res.ok) {
            toast.success('You are on Pro — subscription activated.');
          } else {
            const t = await res.text();
            console.error('[dashboard] confirm-checkout', res.status, t);
            toast.error('Could not confirm subscription. Check console / try Refresh.');
          }
        }
      } finally {
        if (!cancelled) await refreshSubscription();
        if (!cancelled) await new Promise((r) => setTimeout(r, 1500));
        if (!cancelled) await refreshSubscription();
        if (!cancelled) {
          window.history.replaceState({}, '', '/dashboard');
        }
      }
    };
    void sync();
    return () => {
      cancelled = true;
    };
  }, [user, refreshSubscription]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('sessions')
        .select('*, scenario:scenarios(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(12);
      setSessions((data ?? []) as SessionWithScenario[]);
      setLoading(false);
    })();
  }, [user]);

  return (
    <AppShell>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm font-medium text-emerald-400">Dashboard</div>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
          </h1>
          <p className="mt-2 text-white/60">Pick up where you left off, or start a fresh rep.</p>
        </div>
        <Link href="/scenarios">
          <Button className="btn-glow h-11 rounded-xl px-5 font-semibold">
            <Play className="mr-2 h-4 w-4" /> Start New Session
          </Button>
        </Link>
      </div>

      {/* Subscription Status Card */}
      {!subscriptionLoading && subscription && (
        <div className="mt-8">
          <div className={`glass glow-border rounded-2xl p-5 ${
            subscription.plan === 'pro' ? 'border-emerald-400/30' : ''
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  subscription.plan === 'pro' 
                    ? 'bg-emerald-500/20 ring-1 ring-emerald-500/30' 
                    : 'bg-white/5 ring-1 ring-white/10'
                }`}>
                  {subscription.plan === 'pro' ? (
                    <Crown className="h-6 w-6 text-emerald-400" />
                  ) : (
                    <Zap className="h-6 w-6 text-white/60" />
                  )}
                </div>
                <div>
                  <div className="font-semibold">
                    {subscription.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
                  </div>
                  <div className="text-sm text-white/50">
                    {subscription.totalUsed}/{subscription.totalLimit} total calls used
                    {subscription.currentPeriodEnd && subscription.plan === 'pro' && (
                      <span className="ml-2">
                        • Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href="/pricing">
                  <Button 
                    variant={subscription.plan === 'pro' ? 'outline' : 'default'}
                    className={subscription.plan === 'pro' ? '' : 'btn-glow'}
                  >
                    {subscription.plan === 'pro' ? 'Manage' : 'Upgrade'}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent sessions</h2>
          <div className="text-sm text-white/50">{sessions.length} sessions</div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-white/[0.03]" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((s) => (
              <Link
                key={s.id}
                href={`/results/${s.id}`}
                className="group glass glow-border flex flex-col rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-emerald-400/20">
                    {s.scenario?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.scenario.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-emerald-400 to-teal-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{s.scenario?.name ?? 'Session'}</div>
                    <div className="flex items-center gap-1.5 text-xs text-white/50">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                <p className="mt-4 line-clamp-2 text-sm text-white/60">{s.scenario?.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-400/20">
                    {s.score > 0 ? `Score ${s.score}` : 'In progress'}
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/40 transition-transform group-hover:translate-x-1 group-hover:text-emerald-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function EmptyState() {
  return (
    <div className="glass glow-border rounded-2xl p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10 ring-1 ring-emerald-400/20">
        <Sparkles className="h-6 w-6 text-emerald-300" />
      </div>
      <h3 className="mt-5 text-xl font-semibold">No sessions yet</h3>
      <p className="mt-2 text-white/60">Pick a scenario and start your first practice rep.</p>
      <Link href="/scenarios" className="mt-6 inline-block">
        <Button className="btn-glow h-11 rounded-xl px-5 font-semibold">Browse scenarios</Button>
      </Link>
    </div>
  );
}
