'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Message, Scenario } from '@/lib/supabase';
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  X,
  Loader2 
} from 'lucide-react';
import { toast } from 'sonner';

interface CoachingTip {
  category: string;
  priority: 'high' | 'medium' | 'low';
  message: string;
  framework?: string;
  stage?: string;
}

interface CoachingData {
  tips: CoachingTip[];
  current_stage: string;
  next_step: string;
  score_this_exchange: number;
}

interface RealTimeCoachProps {
  messages: Message[];
  scenario: Scenario | null;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export function RealTimeCoach({ 
  messages, 
  scenario, 
  isMinimized = false, 
  onToggleMinimize 
}: RealTimeCoachProps) {
  const [coaching, setCoaching] = useState<CoachingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const hasInitializedRef = useRef(false);

  // Show coach immediately when scenario loads
  const hasStarted = !!scenario;

  // Initialize default coaching immediately
  useEffect(() => {
    if (scenario && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      setCoaching({
        tips: [
          {
            category: 'rapport',
            priority: 'high',
            message: 'Start by stating your intent clearly - who you are and why you\'re calling',
            framework: 'Opening',
            stage: 'Intent'
          }
        ],
        current_stage: 'Opening',
        next_step: 'Build rapport with a genuine compliment or connection',
        score_this_exchange: 70
      });
    }
  }, [scenario]);

  // Get coaching tips when messages change - start analyzing immediately
  useEffect(() => {
    if (!scenario) return;
    if (messages.length === 0) return; // Don't call API if no messages yet
    
    const getCoaching = async () => {
      setLoading(true);
      toast.info('Coach is analyzing...', { duration: 2000 });
      
      try {
        console.log('[Coach] Sending request with', messages.length, 'messages');
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/coaching`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            conversation: messages.map(m => ({ role: m.role, content: m.content })),
            // Frameworks are backend-internal, not sent from UI
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Coach] API error:', errorText);
          toast.error(`Coach error: ${errorText.substring(0, 100)}`);
          throw new Error(`Failed to get coaching: ${errorText}`);
        }

        const coachingData = await response.json();
        console.log('[Coach] Data received:', coachingData);
        
        // Only update if we got valid data
        if (coachingData && (coachingData.tips || coachingData.current_stage)) {
          setCoaching(coachingData);
          toast.success('Coach updated!');
        } else {
          console.warn('[Coach] Invalid data received:', coachingData);
          toast.error('Coach returned invalid data');
        }
      } catch (error) {
        console.error('[Coach] Error:', error);
        toast.error('Coach failed - using fallback');
        // Keep previous coaching or use default
        if (!coaching) {
          setCoaching({
            tips: [{
              category: 'system',
              priority: 'medium',
              message: 'Coach temporarily unavailable. Focus on building rapport and asking discovery questions.',
              framework: 'Opening',
              stage: 'Intent'
            }],
            current_stage: 'Opening',
            next_step: 'Start with rapport building',
            score_this_exchange: 70
          });
        }
      } finally {
        setLoading(false);
      }
    };

    // Analyze immediately when conversation updates
    console.log('[Coach] Triggered with', messages.length, 'messages');
    getCoaching();
  }, [messages.length, scenario]);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'medium':
        return <Lightbulb className="h-4 w-4 text-amber-400" />;
      case 'low':
        return <Info className="h-4 w-4 text-blue-400" />;
      default:
        return <Info className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-400/30 bg-red-400/10 text-red-300';
      case 'medium':
        return 'border-amber-400/30 bg-amber-400/10 text-amber-300';
      case 'low':
        return 'border-blue-400/30 bg-blue-400/10 text-blue-300';
      default:
        return 'border-gray-400/30 bg-gray-400/10 text-gray-300';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-4 z-40">
        <Button
          onClick={onToggleMinimize}
          className="glass glow-border h-12 w-12 rounded-full border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20"
        >
          <Lightbulb className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-96">
      {isVisible && (
        <div className="glass glow-border rounded-2xl border-purple-400/30 bg-purple-400/5 p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-purple-300" />
              <h3 className="font-semibold text-white">Real-Time Coach</h3>
              {loading && <Loader2 className="h-4 w-4 animate-spin text-purple-300" />}
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={onToggleMinimize}
                className="h-6 w-6 text-white/60 hover:text-white"
              >
                <span className="text-xs">_</span>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 text-white/60 hover:text-white"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Welcome Message - Shows immediately when session starts */}
          {hasStarted && !coaching && !loading && messages.length === 0 && (
            <div className="rounded-xl border border-purple-400/20 bg-purple-400/10 p-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-purple-300" />
                <span className="text-sm font-medium text-purple-200">Ready to coach!</span>
              </div>
              <p className="mt-2 text-xs text-white/70">
                Start the conversation with your prospect. I'll watch and give you real-time tips on:
              </p>
              <ul className="mt-1 text-xs text-white/60 list-disc list-inside">
                <li>Rapport building & opening</li>
                <li>Discovery questions</li>
                <li>Objection handling</li>
                <li>Closing techniques</li>
              </ul>
            </div>
          )}

          {/* Analyzing State */}
          {hasStarted && !coaching && loading && messages.length > 0 && (
            <div className="rounded-xl border border-purple-400/20 bg-purple-400/10 p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-purple-300" />
                <span className="text-sm text-purple-200">Analyzing your approach...</span>
              </div>
            </div>
          )}

          {/* Current Stage */}
          {coaching && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-white/60">Current Stage</div>
                  <div className="text-sm font-medium text-white">{coaching.current_stage}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/60">Last Exchange</div>
                  <div className={`text-lg font-bold ${getScoreColor(coaching.score_this_exchange)}`}>
                    {coaching.score_this_exchange}
                  </div>
                </div>
              </div>

              {/* Next Step */}
              {coaching.next_step && (
                <div className="p-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">Next Step</span>
                  </div>
                  <div className="text-xs text-emerald-200 mt-1">{coaching.next_step}</div>
                </div>
              )}

              {/* Coaching Tips */}
              {coaching.tips.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-white/60">Coaching Tips</div>
                  {coaching.tips.slice(0, 3).map((tip, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded-lg border ${getPriorityColor(tip.priority)}`}
                    >
                      <div className="flex items-start gap-2">
                        {getPriorityIcon(tip.priority)}
                        <div className="flex-1">
                          <div className="text-xs font-medium">{tip.category}</div>
                          <div className="text-xs mt-1 leading-relaxed">{tip.message}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!coaching && !loading && messages.length > 0 && (
            <div className="text-center py-4 text-white/60">
              <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <div className="text-sm">Coach analyzing conversation...</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
