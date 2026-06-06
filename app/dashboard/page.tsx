'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { supabase, Scenario, Session, UserAnalytics, SkillProgression } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { ArrowRight, Play, Clock, Sparkles, Crown, Zap, TrendingUp, TrendingDown, Target, Award } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

type SessionWithScenario = Session & { scenario: Scenario | null };

type ExtendedUserAnalytics = UserAnalytics & { skill_trends?: Record<string, number> };

const CATEGORY_LABELS: Record<string, string> = {
  frameMindset: 'Frame & Mindset',
  qualifying: 'Qualifying',
  rapportBuilding: 'Always Agreeing',
  pasAida: 'PAS/AIDA Formula',
  objectionHandling: 'Objection Handling',
  closingNextSteps: 'Closing & Next Steps',
};

const CATEGORY_COLORS: Record<string, string> = {
  frameMindset: '#10b981',
  qualifying: '#3b82f6',
  rapportBuilding: '#f59e0b',
  pasAida: '#8b5cf6',
  objectionHandling: '#ef4444',
  closingNextSteps: '#06b6d4',
};

export default function DashboardPage() {
  const { user, subscription, subscriptionLoading, refreshSubscription } =
    useAuth();
  const [sessions, setSessions] = useState<SessionWithScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<ExtendedUserAnalytics | null>(null);
  const [skillProgression, setSkillProgression] = useState<SkillProgression[]>([]);

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
      const [{ data: sessionsData }, { data: analyticsData }, { data: progressionData }] =
        await Promise.all([
          supabase
            .from('sessions')
            .select('*, scenario:scenarios(*)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3),
          supabase.from('user_analytics').select('*').eq('user_id', user.id).maybeSingle(),
          supabase
            .from('skill_progression')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })
            .limit(50),
        ]);
      setSessions((sessionsData ?? []) as SessionWithScenario[]);
      setAnalytics(analyticsData as ExtendedUserAnalytics);
      setSkillProgression(progressionData || []);
      setLoading(false);
    })();
  }, [user]);

  const skillTrendData = skillProgression.reduce((acc: any[], item) => {
    const existingDate = acc.find((d) => d.date === new Date(item.created_at).toLocaleDateString());
    if (existingDate) {
      existingDate[item.category] = item.score;
    } else {
      acc.push({ date: new Date(item.created_at).toLocaleDateString(), [item.category]: item.score });
    }
    return acc;
  }, []);

  const categoryScores = Object.entries(analytics?.category_scores || {}).map(
    ([key, value]: [string, any]) => ({
      category: CATEGORY_LABELS[key] || key,
      score: value.score || 0,
    })
  );

  const averageScore = analytics?.average_score || 0;
  const totalSessions = analytics?.total_sessions || 0;
  const totalPracticeTime = analytics?.total_practice_time || 0;
  const practiceTimeText =
    totalPracticeTime < 60
      ? `${totalPracticeTime} min`
      : `${Math.floor(totalPracticeTime / 60)}h ${totalPracticeTime % 60}min`;

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
          <Link href="/scenarios" className="text-sm text-white/50 hover:text-white transition-colors">View all →</Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-white/[0.03]" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
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

      {/* Analytics Section */}
      <div className="mt-12">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-emerald-400">Analytics</div>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Your Performance</h2>
          </div>
          <Link href="/analytics" className="text-sm text-white/50 hover:text-white transition-colors">
            Full analytics →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="glass glow-border rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 ring-1 ring-emerald-400/20">
                <Target className="h-4 w-4 text-emerald-300" />
              </div>
              <div>
                <div className="text-xs text-white/60">Avg Score</div>
                <div className="text-xl font-semibold text-white">{averageScore.toFixed(0)}</div>
              </div>
            </div>
          </div>
          <div className="glass glow-border rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/10 ring-1 ring-blue-400/20">
                <Award className="h-4 w-4 text-blue-300" />
              </div>
              <div>
                <div className="text-xs text-white/60">Sessions</div>
                <div className="text-xl font-semibold text-white">{totalSessions}</div>
              </div>
            </div>
          </div>
          <div className="glass glow-border rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-400/10 ring-1 ring-purple-400/20">
                <Clock className="h-4 w-4 text-purple-300" />
              </div>
              <div>
                <div className="text-xs text-white/60">Practice Time</div>
                <div className="text-xl font-semibold text-white">{practiceTimeText || '0 min'}</div>
              </div>
            </div>
          </div>
          <div className="glass glow-border rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 ring-1 ring-amber-400/20">
                {averageScore >= 70 ? (
                  <TrendingUp className="h-4 w-4 text-emerald-300" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-amber-300" />
                )}
              </div>
              <div>
                <div className="text-xs text-white/60">Performance</div>
                <div className="text-xl font-semibold text-white">
                  {averageScore >= 70 ? 'Strong' : averageScore >= 50 ? 'Good' : 'Developing'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="glass glow-border rounded-2xl p-6">
            <h3 className="mb-4 text-base font-semibold text-white">Skill Progression</h3>
            {skillTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={skillTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                  {Object.keys(CATEGORY_LABELS).map((category) => (
                    <Line key={category} type="monotone" dataKey={category} stroke={CATEGORY_COLORS[category]} strokeWidth={2} dot={{ fill: CATEGORY_COLORS[category], r: 3 }} name={CATEGORY_LABELS[category]} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[260px] items-center justify-center text-sm text-white/50">
                Complete more sessions to see your progress
              </div>
            )}
          </div>
          <div className="glass glow-border rounded-2xl p-6">
            <h3 className="mb-4 text-base font-semibold text-white">Category Breakdown</h3>
            {categoryScores.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={categoryScores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="category" stroke="#9ca3af" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                  <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[260px] items-center justify-center text-sm text-white/50">
                No data available yet
              </div>
            )}
          </div>
        </div>
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
