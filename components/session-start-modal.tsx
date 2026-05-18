'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Brain, 
  Target, 
  BarChart3,
  X,
  Zap,
  MessageSquare,
  TrendingUp,
  Shield
} from 'lucide-react';

interface SessionStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
  scenarioName: string;
  scenarioDescription?: string;
  scenarioContent?: string;
}

function extractScenarioDetails(content: string): { role: string; background: string; personality: string; situation: string; objections: string[]; offer: string } {
  if (!content) return { role: '', background: '', personality: '', situation: '', objections: [], offer: '' };
  
  // Extract Role - get full line
  const roleMatch = content.match(/Role[:\s]+(.+?)(?=\n|$)/i);
  const role = roleMatch ? roleMatch[1].trim() : '';
  
  // Extract Name
  const nameMatch = content.match(/Name[:\s]+(.+?)(?=\n|$)/i);
  const name = nameMatch ? nameMatch[1].trim() : '';
  
  // Extract Background - full content
  const backgroundMatch = content.match(/Background[:\s]+([\s\S]+?)(?=\n\s*(?:Name|Role|Situation|Objections|Goals|Personality|Current|Company)[:\s]|\n\n|Objections[:\s]|$)/i);
  let background = '';
  if (backgroundMatch) {
    background = backgroundMatch[1].trim().replace(/\n+/g, ' ');
  }
  
  // Extract Situation - full content
  const situationMatch = content.match(/Situation[:\s]+([\s\S]+?)(?=\n\s*(?:Name|Role|Objections|Goals|Personality|Background|Company)[:\s]|\n\n|Objections[:\s]|$)/i);
  let situation = '';
  if (situationMatch) {
    situation = situationMatch[1].trim().replace(/\n+/g, ' ');
  }
  
  // Extract Personality - full content
  const personalityMatch = content.match(/Personality[:\s]+([\s\S]+?)(?=\n\s*(?:Name|Role|Situation|Objections|Goals|Background|Tone)[:\s]|\n\n|Objections[:\s]|$)/i);
  let personality = '';
  if (personalityMatch) {
    personality = personalityMatch[1].trim().replace(/\n+/g, ' ');
  }
  
  // Extract Tone (if exists)
  const toneMatch = content.match(/Tone[:\s]+([\s\S]+?)(?=\n\s*(?:Name|Role|Situation|Objections|Goals|Personality|Background)[:\s]|\n\n|$)/i);
  let tone = '';
  if (toneMatch) {
    tone = toneMatch[1].trim().replace(/\n+/g, ' ');
  }
  
  // Combine personality and tone
  if (tone && !personality.includes(tone)) {
    personality = personality ? `${personality}. Tone: ${tone}` : tone;
  }
  
  // Extract Objections - get all bullet points or lines after Objections:
  const objectionsMatch = content.match(/Objections[:\s]+([\s\S]+?)(?=\n\s*(?:Name|Role|Goals|Victory|Background|Win)[:\s]|\n\n[A-Z]|$)/i);
  let objections: string[] = [];
  if (objectionsMatch) {
    const objText = objectionsMatch[1];
    // Split by newlines, bullets, or numbers
    objections = objText
      .split(/\n|(?:^|\n)[-\*•]|\d+\.\s/)
      .map(o => o.trim())
      .filter(o => o.length > 5 && !o.match(/^(Objections?|Background|Role|Goals)/i))
      .slice(0, 3);
  }
  
  // Extract Offer / Why We're Calling / Product
  const offerMatch = content.match(/(?:Offer|Our Offer|Product|Why We(?:'re| Are) Calling|Value Proposition|What We(?:'re| Are) Selling|Pitch)[:\s]+([\'\s\S]+?)(?=\n\s*(?:Name|Role|Situation|Objections|Goals|Personality|Background|Tone|Company|Victory|Win)[:\s]|\n\n[A-Z]|$)/i);
  let offer = '';
  if (offerMatch) {
    offer = offerMatch[1].trim().replace(/\n+/g, ' ');
  }

  // Combine all background info
  let fullBackground = background;
  if (situation && !fullBackground.includes(situation.substring(0, 40))) {
    fullBackground += (fullBackground ? ' ' : '') + situation;
  }
  
  return { role: role || name, background: fullBackground, personality, situation, objections, offer };
}

export function SessionStartModal({ 
  isOpen, 
  onClose, 
  onStart, 
  scenarioName,
  scenarioDescription,
  scenarioContent
}: SessionStartModalProps) {
  const [mounted, setMounted] = useState(false);
  
  const details = extractScenarioDetails(scenarioContent || '');
  // Build rich description combining multiple fields for more depth
  let richDescription = '';
  if (details.background) richDescription += details.background + ' ';
  if (details.situation && !richDescription.includes(details.situation.substring(0, 30))) {
    richDescription += details.situation + ' ';
  }
  if (details.personality) {
    richDescription += 'Personality: ' + details.personality;
  }
  
  const displayDescription = scenarioDescription || richDescription || details.role;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal - Perfect Fit */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-5xl overflow-hidden"
          >
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 rounded-3xl opacity-20 blur-xl" />
            
            {/* Main Card */}
            <div className="relative bg-gradient-to-b from-[#0a0f0e] to-[#070b0a] rounded-3xl border border-white/10 overflow-hidden">
              {/* Top Gradient Line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
              
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors z-10"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header Section */}
                <div className="relative px-8 pt-5 pb-3 text-center">
                  {/* Logo/Icon */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="mx-auto mb-4"
                  >
                    <div className="relative inline-flex">
                      <div className="absolute inset-0 bg-emerald-400/20 blur-xl rounded-full" />
                      <div className="relative h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </motion.div>

                  {/* Title */}
                  <motion.h2
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="text-2xl font-bold text-white mb-2"
                  >
                    AI Training Session
                  </motion.h2>

                  {/* Subtitle */}
                  <motion.p
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25, duration: 0.4 }}
                    className="text-sm text-white/60"
                  >
                    Practice realistic sales conversations with adaptive AI
                  </motion.p>

                  {/* Scenario Badge */}
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10"
                  >
                    <Target className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-white/80">{scenarioName}</span>
                  </motion.div>

                  {/* Scenario Details - Summarized */}
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.32, duration: 0.4 }}
                    className="mt-4 mx-auto px-10"
                  >
                    <div className="grid grid-cols-2 gap-4 text-left">
                      {/* Who You're Calling */}
                      <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
                        <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Who You&apos;re Calling</h4>
                        <p className="text-sm text-white/80 leading-relaxed">
                          {details.role || 'Business prospect'}
                        </p>
                      </div>

                      {/* Background */}
                      <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
                        <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Background</h4>
                        <p className="text-sm text-white/80 leading-relaxed">
                          {(details.background || scenarioDescription || displayDescription).split('.').slice(0, 3).join('.') + '.'}
                        </p>
                      </div>

                      {/* Personality */}
                      <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
                        <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Personality</h4>
                        <p className="text-sm text-white/80 leading-relaxed">
                          {details.personality
                            ? details.personality.split('.').slice(0, 4).join('.') + '.'
                            : 'No personality details available for this scenario.'}
                        </p>
                      </div>

                      {/* Our Offer */}
                      <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
                        <h4 className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-2">Our Offer</h4>
                        <p className="text-sm text-white/80 leading-relaxed">
                          {details.offer
                            ? details.offer.split('.').slice(0, 3).join('.') + '.'
                            : scenarioDescription || 'Review the scenario details for the full offer context.'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* AI Explanation - Compact */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35, duration: 0.4 }}
                  className="px-6 py-3 bg-white/[0.02] border-y border-white/5"
                >
                  <p className="text-[11px] text-white/50 leading-relaxed text-center">
                    AI uses <span className="text-emerald-400">contextual embeddings</span> to understand flow, tone, and intent in real-time. 
                    Adapts dynamically, remembers context, avoids repetitive questions.
                  </p>
                </motion.div>

                {/* Key Features */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="px-10 py-4"
                >
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                      <div className="h-10 w-10 rounded-lg bg-emerald-400/10 flex items-center justify-center mx-auto mb-2">
                        <MessageSquare className="h-5 w-5 text-emerald-400" />
                      </div>
                      <h4 className="text-sm font-semibold text-white">Adaptive Memory</h4>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                      <div className="h-10 w-10 rounded-lg bg-emerald-400/10 flex items-center justify-center mx-auto mb-2">
                        <Zap className="h-5 w-5 text-emerald-400" />
                      </div>
                      <h4 className="text-sm font-semibold text-white">Dynamic Objections</h4>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                      <div className="h-10 w-10 rounded-lg bg-emerald-400/10 flex items-center justify-center mx-auto mb-2">
                        <TrendingUp className="h-5 w-5 text-emerald-400" />
                      </div>
                      <h4 className="text-sm font-semibold text-white">Elite Feedback</h4>
                    </div>
                  </div>
                </motion.div>

                {/* Footer Buttons */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.45, duration: 0.4 }}
                  className="px-8 pb-5 pt-2 flex gap-3"
                >
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 h-12 rounded-xl border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={onStart}
                    className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Start Session
                  </Button>
                </motion.div>

                {/* Bottom Trust Indicators */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  className="px-8 pb-4 flex items-center justify-center gap-4 text-[10px] text-white/30"
                >
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    <span>Conversations are private</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5" />
                    <span>Detailed analytics included</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
      )}
    </AnimatePresence>
  );
}
