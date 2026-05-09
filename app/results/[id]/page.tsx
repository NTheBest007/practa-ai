'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { supabase, Scenario, Session, Message } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import {
  Loader as Loader2,
  Trophy,
  TrendingUp,
  TriangleAlert as AlertTriangle,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  Target,
  CircleDot,
} from 'lucide-react';

type SessionWithScenario = Session & { scenario: Scenario };

interface CategoryScores {
  rapportBuilding: number;
  discoveryUnderstanding: number;
  objectionHandling: number;
  valueCommunication: number;
  conversationControl: number;
  closingNextSteps: number;
}

const CATEGORY_LABELS: Record<keyof CategoryScores, string> = {
  rapportBuilding: 'Rapport Building',
  discoveryUnderstanding: 'Discovery / Understanding',
  objectionHandling: 'Objection Handling',
  valueCommunication: 'Value Communication',
  conversationControl: 'Conversation Control',
  closingNextSteps: 'Closing / Next Steps',
};

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [session, setSession] = useState<SessionWithScenario | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      const { data: s } = await supabase
        .from('sessions')
        .select('*, scenario:scenarios(*)')
        .eq('id', id)
        .maybeSingle();
      setSession(s as SessionWithScenario | null);
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', id)
        .order('created_at', { ascending: true });
      setMessages((msgs ?? []) as Message[]);
      setLoading(false);
    })();
  }, [user, id]);

  const feedback = session?.feedback as Record<string, unknown> | undefined;
  const categoryScores = (feedback?.categoryScores ?? null) as CategoryScores | null;
  const missedOpportunities = (feedback?.missedOpportunities ?? []) as string[];

  return (
    <AppShell>
      {loading || !session ? (
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-medium text-emerald-400">Session Feedback</div>
              <h1 className="mt-1 text-4xl font-semibold tracking-tight">{session.scenario.name}</h1>
              <p className="mt-2 text-white/60">{session.scenario.description}</p>
            </div>
            <div className="flex gap-2">
              <Link href="/scenarios">
                <Button variant="outline" className="h-11 rounded-xl border-white/10 bg-white/[0.02] hover:bg-white/5">
                  <RotateCcw className="mr-2 h-4 w-4" /> Run again
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button className="btn-glow h-11 rounded-xl font-semibold">
                  Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Overall Score + Category Breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <ScoreCard score={session.score} summary={(feedback?.summary as string) ?? ''} />
            {categoryScores && <CategoryBreakdown scores={categoryScores} />}
            <FeedbackList
              title="Strengths"
              icon={<TrendingUp className="h-4 w-4 text-emerald-300" />}
              items={(feedback?.strengths as string[]) ?? []}
              accent="emerald"
            />
          </div>

          {/* Weaknesses + Missed Opportunities + Suggestions */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <FeedbackList
              title="Weaknesses"
              icon={<AlertTriangle className="h-4 w-4 text-amber-300" />}
              items={(feedback?.weaknesses as string[]) ?? []}
              accent="amber"
            />
            <FeedbackList
              title="Missed Opportunities"
              icon={<Target className="h-4 w-4 text-rose-300" />}
              items={missedOpportunities}
              accent="rose"
            />
            <FeedbackList
              title="Suggestions"
              icon={<Lightbulb className="h-4 w-4 text-sky-300" />}
              items={(feedback?.suggestions as string[]) ?? []}
              accent="sky"
            />
          </div>

          {/* Transcript */}
          <div className="glass glow-border rounded-2xl p-6">
            <h3 className="text-lg font-semibold">Transcript</h3>
            <div className="scroll-hide mt-4 max-h-[500px] space-y-4 overflow-y-auto pr-2">
              {messages.length === 0 ? (
                <div className="text-sm text-white/50">No messages were exchanged.</div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex items-start gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}
                  >
                    {m.role === 'assistant' && (
                      <div className="mt-1 h-8 w-8 shrink-0 overflow-hidden rounded-full ring-2 ring-emerald-400/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={session.scenario.avatar_url} alt="" className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div
                      className={
                        m.role === 'user'
                          ? 'max-w-[78%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-emerald-400 to-emerald-600 px-4 py-2.5 text-sm text-emerald-950'
                          : 'max-w-[78%] rounded-2xl rounded-tl-sm border border-white/5 bg-white/[0.03] px-4 py-2.5 text-sm text-white/85'
                      }
                    >
                      {m.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function ScoreCard({ score, summary }: { score: number; summary: string }) {
  const band =
    score >= 85 ? 'Excellent' : score >= 70 ? 'Strong' : score >= 55 ? 'Developing' : 'Needs work';
  return (
    <div className="glass glow-border relative overflow-hidden rounded-2xl p-6">
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="relative flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/10 ring-1 ring-emerald-400/20">
          <Trophy className="h-6 w-6 text-emerald-300" />
        </div>
        <div>
          <div className="text-sm text-white/50">Overall Score</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-semibold text-gradient">{score}</span>
            <span className="text-sm text-white/50">/ 100</span>
          </div>
        </div>
      </div>
      <div className="relative mt-5">
        <div className="h-2 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700"
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-white/50">
          <span>{band}</span>
          <span>{score}%</span>
        </div>
      </div>
      {summary && <p className="relative mt-5 text-sm leading-relaxed text-white/70">{summary}</p>}
    </div>
  );
}

function CategoryBreakdown({ scores }: { scores: CategoryScores }) {
  return (
    <div className="glass glow-border rounded-2xl p-6">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/10 ring-1 ring-emerald-400/20">
          <CircleDot className="h-4 w-4 text-emerald-300" />
        </div>
        <h3 className="text-lg font-semibold">Category Scores</h3>
      </div>
      <div className="mt-4 space-y-3">
        {(Object.keys(CATEGORY_LABELS) as (keyof CategoryScores)[]).map((key) => {
          const value = scores[key] ?? 0;
          const color =
            value >= 80
              ? 'from-emerald-400 to-emerald-500'
              : value >= 60
              ? 'from-sky-400 to-sky-500'
              : value >= 40
              ? 'from-amber-400 to-amber-500'
              : 'from-rose-400 to-rose-500';
          return (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-white/70">{CATEGORY_LABELS[key]}</span>
                <span className="font-medium text-white/90">{value}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FeedbackList({
  title,
  icon,
  items,
  accent,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  accent: 'emerald' | 'amber' | 'rose' | 'sky';
}) {
  const styles: Record<string, { ring: string; bg: string }> = {
    emerald: { ring: 'ring-emerald-400/20', bg: 'bg-emerald-400/10' },
    amber: { ring: 'ring-amber-400/20', bg: 'bg-amber-400/10' },
    rose: { ring: 'ring-rose-400/20', bg: 'bg-rose-400/10' },
    sky: { ring: 'ring-sky-400/20', bg: 'bg-sky-400/10' },
  };
  const { ring, bg } = styles[accent];
  return (
    <div className="glass glow-border rounded-2xl p-6">
      <div className="flex items-center gap-2.5">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg} ring-1 ${ring}`}>
          {icon}
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <ul className="mt-4 space-y-2">
        {items.length === 0 ? (
          <li className="text-sm text-white/50">Nothing captured here.</li>
        ) : (
          items.map((item, idx) => (
            <li
              key={idx}
              className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 text-sm text-white/80"
            >
              {item}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
