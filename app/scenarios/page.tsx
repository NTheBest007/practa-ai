'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { supabase, Scenario } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useRevenueCat } from '@/hooks/use-revenuecat';
import { generateScenarioEmbeddings, checkScenarioEmbeddings } from '@/lib/embeddings';
import { ArrowRight, Loader as Loader2, Brain, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function ScenariosPage() {
  const { user, subscription, subscriptionLoading } = useAuth();
  const router = useRouter();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const [generatingEmbeddings, setGeneratingEmbeddings] = useState<string | null>(null);
  const [embeddingStatus, setEmbeddingStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('scenarios')
        .select('*')
        .order('created_at', { ascending: true });
      setScenarios(data ?? []);
      
      // Check embedding status for all scenarios
      if (data) {
        const status: Record<string, boolean> = {};
        for (const scenario of data) {
          const hasEmbeddings = await checkScenarioEmbeddings(scenario.id);
          status[scenario.id] = hasEmbeddings;
        }
        setEmbeddingStatus(status);
      }
      
      setLoading(false);
    })();
  }, []);

  async function startSession(scenarioId: string) {
    if (!user) return;
    
    setStarting(scenarioId);
    
    // Track usage
    try {
      await fetch('/api/subscription/track-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          scenarioId: scenarioId,
        }),
      });
      useRevenueCat.track('scenario_started', {
        scenarioId,
      });
    } catch (error) {
      console.error('Failed to track usage:', error);
    }
    
    try {
      const { data: session } = await supabase
        .from('sessions')
        .insert({ scenario_id: scenarioId, user_id: user!.id })
        .select()
        .maybeSingle();
      if (session) router.push(`/practice/${session.id}`);
    } catch {
      toast.error('Could not start session.');
    } finally {
      setStarting(null);
    }
  }
  
  const getUsageForScenario = (scenarioId: string) => {
    if (!subscription) return { used: 0, limit: 1 };
    return {
      used: subscription.usage[scenarioId] || 0,
      limit: subscription.limits[scenarioId] || 1,
    };
  };

  async function generateEmbeddingsForScenario(scenarioId: string, googleDocContent: string) {
    setGeneratingEmbeddings(scenarioId);
    try {
      await generateScenarioEmbeddings(scenarioId, googleDocContent);
      toast.success('Embeddings generated successfully!');
      // Update embedding status for this scenario
      setEmbeddingStatus(prev => ({ ...prev, [scenarioId]: true }));
    } catch (error) {
      console.error('Error generating embeddings:', error);
      toast.error('Failed to generate embeddings.');
    } finally {
      setGeneratingEmbeddings(null);
    }
  }

  return (
    <AppShell>
      <div>
        <div className="text-sm font-medium text-emerald-400">Scenarios</div>
        <h1 className="mt-1 text-4xl font-semibold tracking-tight">Choose your prospect</h1>
        <p className="mt-2 max-w-2xl text-white/60">
          Every scenario is a fully fleshed-out persona with their own objections, personality, and priorities.
        </p>
      </div>

      {loading ? (
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-96 animate-pulse rounded-2xl bg-white/[0.03]" />
          ))}
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((s) => {
            const hasEmbeddings = embeddingStatus[s.id];
            const usage = getUsageForScenario(s.id);
            const isAtLimit = usage.used >= usage.limit;

            return (
              <div
                key={s.id}
                className="group glass glow-border overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-56 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.avatar_url}
                    alt={s.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-medium text-emerald-200 ring-1 ring-emerald-400/25 w-fit backdrop-blur">
                        Live Roleplay
                      </div>
                      {hasEmbeddings === true && (
                        <div className="rounded-full bg-blue-400/15 px-2.5 py-1 text-[11px] font-medium text-blue-200 ring-1 ring-blue-400/25 w-fit backdrop-blur flex items-center gap-1">
                          <Brain className="h-3 w-3" />
                          AI Enhanced
                        </div>
                      )}
                      {!subscriptionLoading && (
                        <div className={`rounded-full px-2.5 py-1 text-[11px] font-medium w-fit backdrop-blur flex items-center gap-1 ${
                          isAtLimit 
                            ? 'bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/25' 
                            : 'bg-white/10 text-white/70 ring-1 ring-white/20'
                        }`}>
                          {usage.used}/{usage.limit} calls
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold">{s.name}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/60">{s.description}</p>
                  
                  {hasEmbeddings === false && (
                    <div className="mt-4 p-3 rounded-lg bg-blue-400/10 border border-blue-400/20">
                      <div className="flex items-center gap-2 text-blue-300 text-sm">
                        <Brain className="h-4 w-4" />
                        <span>Generate AI embeddings for enhanced responses</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 space-y-2">
                    {hasEmbeddings === false && (
                      <Button
                        disabled={generatingEmbeddings === s.id}
                        onClick={() => generateEmbeddingsForScenario(s.id, s.google_doc_content || '')}
                        variant="outline"
                        className="h-9 w-full rounded-lg border-blue-400/30 bg-blue-400/10 text-blue-200 hover:bg-blue-400/20 hover:text-blue-100"
                      >
                        {generatingEmbeddings === s.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Brain className="mr-2 h-4 w-4" />
                            Generate AI Embeddings
                          </>
                        )}
                      </Button>
                    )}
                    
                    <Button
                      disabled={starting === s.id}
                      onClick={() => startSession(s.id)}
                      className={`h-10 w-full rounded-xl font-semibold ${
                        isAtLimit 
                          ? 'bg-amber-500 hover:bg-amber-600' 
                          : 'btn-glow'
                      }`}
                    >
                      {starting === s.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isAtLimit ? (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Start anyway
                        </>
                      ) : (
                        <>
                          Start session <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
