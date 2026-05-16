'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { PhoneFrame } from '@/components/phone-frame';
import { UnifiedVoiceRecorder } from '@/components/unified-voice-recorder';
import { UnifiedVoicePlayer } from '@/components/unified-voice-player';
import { SessionStartModal } from '@/components/session-start-modal';
import { supabase, Scenario, Message } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { getAvatarCharacteristics } from '@/lib/voice-utils';
import { Loader as Loader2, Send, Flag, ArrowLeft, Mic, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function PracticePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, subscription, refreshSubscription } = useAuth();
  const isPro = subscription?.plan === 'pro';

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showStartModal, setShowStartModal] = useState(true);
  const [sessionStarted, setSessionStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownVoiceToastRef = useRef(false);

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      const { data: session } = await supabase
        .from('sessions')
        .select('*, scenario:scenarios(*)')
        .eq('id', id)
        .maybeSingle();
      if (!session) {
        toast.error('Session not found');
        router.replace('/dashboard');
        return;
      }
      setScenario(session.scenario as Scenario);

      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', id)
        .order('created_at', { ascending: true });
      setMessages((msgs ?? []) as Message[]);
      setLoading(false);
    })();
  }, [user, id, router]);

  // Call timer - only starts when session begins
  useEffect(() => {
    if (!loading && scenario && sessionStarted) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, scenario, sessionStarted]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  async function onSend() {
    if (!input.trim() || !scenario) return;
    const text = input.trim();
    setInput('');
    setSending(true);

    const { data: userMsg } = await supabase
      .from('messages')
      .insert({ session_id: id, role: 'user', content: text })
      .select()
      .maybeSingle();
    if (userMsg) setMessages((m) => [...m, userMsg as Message]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenarioDoc: scenario.google_doc_content,
          history: [...messages, userMsg as Message].filter(Boolean).map((m) => ({ role: m.role, content: m.content })),
          userMessage: text,
          scenarioId: scenario.id,
          sessionId: id,
        }),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Chat API error:', errorText);
        throw new Error(`Chat API failed: ${errorText}`);
      }
      
      const data = await res.json();
      if (!data.reply) {
        console.error('No reply in response:', data);
        throw new Error('No reply received from AI');
      }
      const reply = data.reply;
      
      // Check if avatar is hanging up - natural human phrases
      const hangUpPhrases = [
        'i have to go',
        'i need to go',
        "i'm hanging up",
        "i've got to run",
        'got to run',
        "gotta run",
        "this isn't going anywhere",
        'not going anywhere',
        "i'm gonna have to let you go",
        'let you go',
        'gotta hop off',
        'hop off',
        "i'm out",
        "i'm done",
        "i'm tapping out",
        'tapping out',
        "i'm bailing",
        'gotta bail',
        "i've got another call",
        'another call coming in',
        "this isn't for me",
        "i'm good, thanks",
        "not interested, bye",
        'goodbye',
        'bye.',
        'bye now',
        "i'm out",
        'this is going nowhere',
        'call drops',
        'line goes quiet',
        '*click*',
        '*beep*',
        '*dial tone*',
        '*line goes dead*',
        'line goes dead',
        'call ended',
        'they hung up',
        "i'm through",
        "we're done here",
        'take care.',
        "i gotta go"
      ];
      const lowerReply = reply.toLowerCase();
      const isHungUp = hangUpPhrases.some(phrase => lowerReply.includes(phrase));
      
      const { data: aiMsg } = await supabase
        .from('messages')
        .insert({ session_id: id, role: 'assistant', content: reply })
        .select()
        .maybeSingle();
      if (aiMsg) {
        setMessages((m) => [...m, aiMsg as Message]);
        // Voice toast shown via useEffect above
        // Auto-play AI response with TTS
        setTimeout(() => {
          // VoicePlayer will handle auto-play when mounted with autoPlay prop
        }, 500);
        
        // If avatar hung up, show end call UI
        if (isHungUp) {
          toast.warning('The prospect hung up. Click the red button to end the call and see your results.');
        }
      }
    } catch (e) {
      console.error('Chat error:', e);
      toast.error(e instanceof Error ? e.message : 'Something went wrong generating the reply.');
    }
    setSending(false);
  }

  async function endSession() {
    if (!id || !user) return;
    setEnding(true);
    try {
      const transcript = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      });
      const feedback = await res.json();
      
      // Update session with feedback
      await supabase
        .from('sessions')
        .update({ feedback, score: feedback.score })
        .eq('id', id);
      
      // Save analytics data
      if (feedback.categoryScores) {
        // Update or insert user_analytics
        const { data: existingAnalytics } = await supabase
          .from('user_analytics')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (existingAnalytics) {
          // Update existing analytics
          const sessionCount = existingAnalytics.session_count + 1;
          const currentScores = existingAnalytics.category_scores || {};
          const newScores: Record<string, number> = {};
          
          // Average the scores
          Object.keys(feedback.categoryScores).forEach((key) => {
            const newScore = feedback.categoryScores[key];
            const oldScore = currentScores[key] || 0;
            newScores[key] = Math.round((oldScore * (sessionCount - 1) + newScore) / sessionCount);
          });
          
          await supabase
            .from('user_analytics')
            .update({
              category_scores: newScores,
              session_count: sessionCount,
              average_score: Math.round((existingAnalytics.average_score * (sessionCount - 1) + feedback.score) / sessionCount),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);
        } else {
          // Create new analytics record
          await supabase
            .from('user_analytics')
            .insert({
              user_id: user.id,
              category_scores: feedback.categoryScores,
              session_count: 1,
              average_score: feedback.score,
            });
        }
        
        // Save skill progression
        const progressionEntries = Object.entries(feedback.categoryScores).map(([category, score]) => ({
          user_id: user.id,
          category,
          score,
          session_id: id,
        }));
        
        await supabase
          .from('skill_progression')
          .insert(progressionEntries);
      }
      
      router.push(`/results/${id}`);
    } catch (error) {
      console.error('End session error:', error);
      toast.error('Could not generate feedback.');
      setEnding(false);
    }
  }

  // Show voice toast once on first user message
  useEffect(() => {
    if (messages.length > 0 && !hasShownVoiceToastRef.current) {
      const hasAssistantMessage = messages.some(m => m.role === 'assistant');
      if (hasAssistantMessage) {
        toast.info('Voice synthesis coming soon', { duration: 3000 });
        hasShownVoiceToastRef.current = true;
      }
    }
  }, [messages]);

  return (
    <AppShell>
      {loading || !scenario ? (
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
        </div>
      ) : (
        <>
          <SessionStartModal
            isOpen={showStartModal}
            onClose={() => router.push('/scenarios')}
            onStart={async () => {
              // Track usage only when user actually starts the session
              if (user && scenario) {
                try {
                  await fetch('/api/subscription/track-usage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      userId: user.id,
                      scenarioId: scenario.id,
                    }),
                  });
                  await refreshSubscription();
                } catch (error) {
                  console.error('Failed to track usage:', error);
                }
              }
              setShowStartModal(false);
              setSessionStarted(true);
            }}
            scenarioName={scenario.name}
            scenarioDescription={scenario.description}
            scenarioContent={scenario.google_doc_content}
          />
          <div className="flex flex-col gap-4 max-w-2xl mx-auto">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/scenarios"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/60 hover:bg-white/5 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="text-sm font-medium text-white">{scenario.name}</h1>
                <p className="text-xs text-white/40">Practice Session</p>
              </div>
            </div>
            <Button
              disabled={ending}
              onClick={endSession}
              className="bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20"
            >
              {ending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Flag className="mr-2 h-4 w-4" />}
              End & get feedback
            </Button>
          </div>

          <PhoneFrame
            scenarioName={scenario.name}
            scenarioAvatar={scenario.avatar_url}
            isMuted={isMuted}
            isSpeakerOn={isSpeakerOn}
            callDuration={callDuration}
            onToggleMute={() => setIsMuted(!isMuted)}
            onToggleSpeaker={() => setIsSpeakerOn(!isSpeakerOn)}
            onEndCall={endSession}
            isMinimized={isMinimized}
            onToggleMinimize={() => setIsMinimized(!isMinimized)}
          >
            <div ref={scrollRef} className="scroll-hide h-full space-y-4 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 ring-1 ring-emerald-400/20">
                    <Mic className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div className="mt-4 text-lg font-semibold text-white">You have the floor</div>
                  <p className="mt-1 max-w-md text-sm text-white/60">
                    Open with whatever you&apos;d say on a real call. Your prospect is listening.
                  </p>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className="space-y-2">
                  <ChatBubble message={m} avatar={scenario.avatar_url} />
                  {m.role === 'assistant' && (
                    <div className="flex justify-end pl-12">
                      <UnifiedVoicePlayer 
                        text={m.content} 
                        autoPlay={true}
                        voice="alloy"
                        avatarUrl={scenario.avatar_url}
                      />
                    </div>
                  )}
                </div>
              ))}
              {sending && (
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-emerald-400/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={scenario.avatar_url} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-white/5 bg-white/[0.03] px-4 py-3">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-300 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-300 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-300" />
                  </div>
                </div>
              )}
            </div>
          </PhoneFrame>

          {/* Text input fallback - moved below phone to avoid interference */}
          <div className="glass glow-border rounded-2xl p-4 mt-4">
            <div className="flex items-end gap-2">
              <UnifiedVoiceRecorder 
                onTranscript={(text: string) => {
                  setInput(text);
                  if (text.trim()) {
                    onSend();
                  }
                }}
              />
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onSend();
                  }
                }}
                rows={1}
                placeholder="Type what you'd say on the call..."
                className="scroll-hide min-h-[44px] max-h-40 flex-1 resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-[15px] text-white placeholder:text-white/30 focus:border-emerald-400/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
              />
              <Button
                onClick={onSend}
                disabled={sending || !input.trim()}
                className="btn-glow h-11 shrink-0 rounded-xl px-5 font-semibold"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
        </>
      )}
    </AppShell>
  );
}

function ChatBubble({ message, avatar }: { message: Message; avatar: string }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex items-start gap-2 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="mt-1 h-8 w-8 shrink-0 overflow-hidden rounded-full ring-2 ring-emerald-400/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatar} alt="" className="h-full w-full object-cover" />
        </div>
      )}
      <div
        className={
          isUser
            ? 'max-w-[80%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-emerald-400 to-emerald-600 px-3 py-2 text-sm leading-relaxed text-emerald-950 shadow-lg shadow-emerald-500/20 break-words'
            : 'max-w-[80%] rounded-2xl rounded-tl-sm border border-white/5 bg-white/[0.03] px-3 py-2 pr-10 text-sm leading-relaxed text-white/90 break-words'
        }
      >
        {message.content}
      </div>
    </div>
  );
}
