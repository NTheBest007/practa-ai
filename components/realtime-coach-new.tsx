'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Message } from '@/lib/supabase';
import { 
  Lightbulb, 
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Mic2
} from 'lucide-react';
import { useDebug } from '@/lib/debug-context';

interface CoachingTip {
  id: string;
  suggestion: string;
  category: 'rapport' | 'discovery' | 'objection' | 'closing' | 'delivery';
  priority: 'high' | 'medium' | 'low';
  timestamp: number;
}

interface RealtimeCoachNewProps {
  messages: Message[];
  scenario: { name: string; avatar_url: string } | null;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export function RealtimeCoachNew({ 
  messages, 
  scenario, 
  isMinimized = false, 
  onToggleMinimize 
}: RealtimeCoachNewProps) {
  const [tips, setTips] = useState<CoachingTip[]>([]);
  const [currentTip, setCurrentTip] = useState<CoachingTip | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const coachingRef = useRef<{ 
    timeout: NodeJS.Timeout | null;
    isActive: boolean;
    lastProcessedHash: string;
  }>({ timeout: null, isActive: false, lastProcessedHash: '' });
  const debug = useDebug();

  // Convert messages to chat format for coaching
  const getConversationHistory = useCallback(() => {
    return messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }));
  }, [messages]);

  // Trigger coaching when new messages arrive (only when messages.length changes)
  useEffect(() => {
    if (!scenario || messages.length === 0) {
      return;
    }
    
    // Get hash of last message
    const lastMsg = messages[messages.length - 1];
    const currentHash = `${lastMsg.id || lastMsg.content}-${messages.length}`;
    
    console.log('[Coach Effect] Checking - messages:', messages.length, 'lastHash:', coachingRef.current.lastProcessedHash);
    
    if (currentHash === coachingRef.current.lastProcessedHash) {
      console.log('[Coach Effect] Skipping - already processed');
      return;
    }
    
    console.log('[Coach Effect] Triggering coaching!');
    const thisHash = currentHash;
    
    // Debounce coaching calls
    if (coachingRef.current.timeout) {
      clearTimeout(coachingRef.current.timeout);
    }
    
    coachingRef.current.timeout = setTimeout(() => {
      debug.updateCoachDebug({ lastTrigger: Date.now(), isRunning: true });
      triggerCoaching(thisHash);
    }, 2000); // 2s debounce

    return () => {
      if (coachingRef.current.timeout) {
        clearTimeout(coachingRef.current.timeout);
      }
    };
  }, [messages.length, scenario, debug]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (coachingRef.current.timeout) {
        clearTimeout(coachingRef.current.timeout);
      }
    };
  }, []);

  const triggerCoaching = async (thisHash: string) => {
    console.log('[Coach] triggerCoaching called with hash:', thisHash);
    if (!scenario || messages.length === 0) {
      console.log('[Coach] No scenario or messages, returning');
      return;
    }
    
    setIsAnalyzing(true);
    coachingRef.current.isActive = true;
    const conversation = getConversationHistory();
    console.log('[Coach] Conversation length:', conversation.length);
    
    // Only coach if we have at least 2 messages (back and forth)
    if (conversation.length < 2) {
      console.log('[Coach] Not enough messages (need 2+), returning');
      setIsAnalyzing(false);
      coachingRef.current.isActive = false;
      debug.updateCoachDebug({ isRunning: false });
      return;
    }

    console.log('[Coach] Triggering analysis via local API...');
    debug.addLog('info', 'Coach', 'Coaching triggered', `${conversation.length} messages`);

    try {
      console.log('[Coach] Calling /api/coach with', conversation.length, 'messages');
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation: conversation,
        }),
      });

      console.log('[Coach] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Coach] API error response:', errorText);
        throw new Error(`Coaching API error: ${errorText}`);
      }

      const data = await response.json();
      console.log('[Coach] Got response:', data);

      // Parse coaching tips from response
      if (data.tips && data.tips.length > 0) {
        const parsedTip: CoachingTip = {
          id: `tip-${Date.now()}`,
          suggestion: data.tips[0].message || data.tips[0].suggestion || 'Keep engaging the prospect',
          category: data.tips[0].category || 'rapport',
          priority: data.tips[0].priority || 'medium',
          timestamp: Date.now(),
        };
        console.log('[Coach] Parsed tip:', parsedTip);

        setIsAnalyzing(false);
        coachingRef.current.isActive = false;
        
        // Update state
        setTips(prev => {
          console.log('[Coach] Updating tips, prev length:', prev.length);
          return [parsedTip, ...prev].slice(0, 5);
        });
        setCurrentTip(parsedTip);
        console.log('[Coach] Set currentTip:', parsedTip.suggestion);
        
        // Mark as successfully processed
        coachingRef.current.lastProcessedHash = thisHash;
        
        debug.updateCoachDebug({ 
          lastResponse: parsedTip, 
          lastError: null, 
          isRunning: false 
        });
        
      } else {
        throw new Error('No coaching tips returned');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Coaching failed';
      console.error('[Coach] Error:', error);
      setIsAnalyzing(false);
      coachingRef.current.isActive = false;
      debug.updateCoachDebug({ 
        lastError: errorMsg, 
        isRunning: false 
      });
      debug.addLog('error', 'Coach', 'Coaching failed', errorMsg);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'rapport':
        return <CheckCircle2 className="h-3 w-3 text-emerald-400" />;
      case 'discovery':
        return <ArrowRight className="h-3 w-3 text-blue-400" />;
      case 'objection':
        return <AlertCircle className="h-3 w-3 text-amber-400" />;
      case 'closing':
        return <CheckCircle2 className="h-3 w-3 text-purple-400" />;
      case 'delivery':
        return <Mic2 className="h-3 w-3 text-cyan-400" />;
      default:
        return <Lightbulb className="h-3 w-3 text-white/60" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'rapport':
        return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300';
      case 'discovery':
        return 'border-blue-400/30 bg-blue-400/10 text-blue-300';
      case 'objection':
        return 'border-amber-400/30 bg-amber-400/10 text-amber-300';
      case 'closing':
        return 'border-purple-400/30 bg-purple-400/10 text-purple-300';
      case 'delivery':
        return 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300';
      default:
        return 'border-white/20 bg-white/5 text-white/70';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-400/20 text-red-300 font-medium">URGENT</span>;
      case 'medium':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-medium">TIP</span>;
      case 'low':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-400/20 text-blue-300 font-medium">NOTE</span>;
      default:
        return null;
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-4 z-40">
        <Button
          onClick={onToggleMinimize}
          className="h-12 w-12 rounded-full border border-purple-400/30 bg-purple-400/10 text-purple-300 hover:bg-purple-400/20 shadow-lg shadow-purple-400/10"
        >
          <Lightbulb className="h-5 w-5" />
        {tips.length > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-400 text-white text-[10px] flex items-center justify-center">
            {tips.length}
          </span>
        )}
        </Button>
      </div>
    );
  }

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80">
      <div className="rounded-2xl border border-purple-400/30 bg-slate-900/95 backdrop-blur-md shadow-xl shadow-purple-400/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
              <Lightbulb className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Live Coach</h3>
              <p className="text-[10px] text-white/50">
                {isAnalyzing ? 'Analyzing...' : coachingRef.current.isActive ? 'Watching' : 'Ready'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isAnalyzing && (
              <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={onToggleMinimize}
              className="h-7 w-7 text-white/50 hover:text-white hover:bg-white/10"
            >
              <span className="text-xs">−</span>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsVisible(false)}
              className="h-7 w-7 text-white/50 hover:text-white hover:bg-white/10"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Current Tip */}
          {currentTip ? (
            <div className={`rounded-xl border p-3 ${getCategoryColor(currentTip.category)}`}>
              <div className="flex items-start gap-2">
                {getCategoryIcon(currentTip.category)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-relaxed">
                    {currentTip.suggestion}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {getPriorityBadge(currentTip.priority)}
                    <span className="text-[10px] opacity-60 capitalize">
                      {currentTip.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <Lightbulb className="h-6 w-6 mx-auto mb-2 text-white/30" />
              <p className="text-sm text-white/50">
                Start the conversation to get live coaching tips
              </p>
            </div>
          )}

          {/* Previous Tips */}
          {tips.length > 1 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-wider">
                <span>Previous Tips</span>
                <span className="flex-1 h-px bg-white/10" />
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin">
                {tips.slice(1).map((tip) => (
                  <div 
                    key={tip.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5"
                  >
                    {getCategoryIcon(tip.category)}
                    <p className="text-xs text-white/70 line-clamp-2 flex-1">
                      {tip.suggestion}
                    </p>
                    {tip.priority === 'high' && (
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversation Status */}
          <div className="flex items-center gap-2 text-[10px] text-white/30 pt-2 border-t border-white/10">
            <div className="flex-1">
              <span>{messages.length} messages</span>
              {tips.length > 0 && (
                <span className="ml-2">• {tips.length} tips given</span>
              )}
            </div>
            {coachingRef.current.isActive && (
              <span className="flex items-center gap-1 text-emerald-400/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
