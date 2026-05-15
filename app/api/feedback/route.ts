import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { transcript } = (await req.json()) as { transcript: AIMessage[] };
    
    if (!transcript || transcript.length === 0) {
      return NextResponse.json({ error: 'No transcript provided' }, { status: 400 });
    }

    // Calculate score based on conversation analysis
    const analysis = analyzeTranscript(transcript);
    
    return NextResponse.json(analysis);
  } catch (e) {
    console.error('[Feedback API] Error:', e);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function analyzeTranscript(transcript: AIMessage[]) {
  const userMessages = transcript.filter(m => m.role === 'user');
  const assistantMessages = transcript.filter(m => m.role === 'assistant');
  const allText = transcript.map(m => m.content.toLowerCase()).join(' ');
  const allUserText = userMessages.map(m => m.content.toLowerCase()).join(' ');
  
  // Check for call ending/hang up
  const lastAssistantMessage = assistantMessages[assistantMessages.length - 1]?.content.toLowerCase() || '';
  const didHangUp = /(i'm hanging up|this call is over|goodbye|have to go|dial tone|click)/.test(lastAssistantMessage);
  
  // Check for rude/profane behavior
  const rudeWords = ['fuck', 'shit', 'asshole', 'dumb', 'stupid', 'idiot', 'moron', 'jerk', 'screw you', 'piss off'];
  const wasRude = rudeWords.some(word => allUserText.includes(word));
  
  // Scoring factors - start at 50 base
  let score = 50;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];
  const missedOpportunities: string[] = [];
  
  // === NEGATIVE BEHAVIOR PENALTIES (Must check first) ===
  
  // 1. Prospect hung up - MAJOR penalty (-30 points)
  if (didHangUp) {
    score -= 30;
    weaknesses.push('Prospect hung up - conversation was not productive');
    suggestions.push('Avoid being rude or offensive; prospects will end calls');
    suggestions.push('Focus on building rapport before pitching');
    missedOpportunities.push('Lost the entire opportunity due to poor approach');
  }
  
  // 2. Profanity/Rudeness - Severe penalty (-25 points)
  if (wasRude) {
    score -= 25;
    weaknesses.push('Used inappropriate language/profanity');
    suggestions.push('Always maintain professionalism, even when frustrated');
    suggestions.push('Never insult prospects - it destroys all trust');
    missedOpportunities.push('Professional relationship destroyed by poor behavior');
  }
  
  // 3. Aggressive/Pushy behavior (-15 points)
  const aggressivePhrases = ['you need to', 'you must', 'trust me', 'just buy', 'sign up now', 'close the deal'];
  const wasAggressive = aggressivePhrases.some(phrase => allUserText.includes(phrase));
  if (wasAggressive && !didHangUp) {
    score -= 15;
    weaknesses.push('Came across as pushy or aggressive');
    suggestions.push('Use consultative approach instead of hard selling');
    suggestions.push('Ask permission before making recommendations');
    missedOpportunities.push('Pushy approach creates resistance and damages trust');
  }
  
  // === POSITIVE BEHAVIOR SCORING ===
  
  // 4. Discovery/Qualifying (up to 20 points)
  const discoveryQuestions = countDiscoveryQuestions(userMessages);
  const hasProblemQuestions = /\b(what|how|why|tell me|walk me|describe|explain)\b.*\b(challenge|problem|pain|issue|concern|goal|need|priority)\b/.test(allUserText);
  
  if (discoveryQuestions >= 4 && hasProblemQuestions) {
    score += 20;
    strengths.push('Excellent discovery - asked targeted questions about pain points and goals');
  } else if (discoveryQuestions >= 2) {
    score += 12;
    strengths.push('Good discovery - asked questions to understand needs');
  } else if (discoveryQuestions >= 1) {
    score += 5;
    strengths.push('Some discovery attempts');
  } else if (!didHangUp) {
    score -= 10;
    weaknesses.push('No discovery questions - jumped straight to pitch');
    suggestions.push('Start with questions about their situation before presenting solutions');
    missedOpportunities.push('Missed chance to uncover specific pain points and tailor your pitch');
  }
  
  // 5. Listening Ratio (up to 15 points)
  const userToAssistantRatio = userMessages.length / (assistantMessages.length || 1);
  const userWordCount = allUserText.split(/\s+/).length;
  const assistantWordCount = assistantMessages.map(m => m.content).join(' ').split(/\s+/).length;
  const listeningRatio = assistantWordCount / (userWordCount || 1);
  
  if (userToAssistantRatio >= 0.5 && listeningRatio > 1.2) {
    score += 15;
    strengths.push('Great listening - let prospect express themselves fully');
  } else if (userToAssistantRatio >= 0.4) {
    score += 8;
    strengths.push('Good balance - engaged in two-way conversation');
  } else if (userToAssistantRatio < 0.3 && userMessages.length > 2) {
    score -= 8;
    weaknesses.push('Talked too much, dominated the conversation');
    suggestions.push('Follow 70/30 rule - prospect should talk 70% of the time');
    missedOpportunities.push('Missed valuable information by not listening enough');
  }
  
  // 6. Handling Objections (up to 15 points)
  const objections = detectObjections(transcript);
  if (objections.handledWell.length > 0) {
    score += 15;
    strengths.push(`Handled ${objections.handledWell.length} objection(s) professionally by agreeing first`);
  } else if (objections.present.length > 0) {
    score -= 5;
    weaknesses.push('Objections were raised but not properly addressed');
    suggestions.push('Always agree with objections before addressing them');
    suggestions.push('Use "I understand" or "That makes sense" before responding');
    missedOpportunities.push('Objections left unresolved - prospect likely lost');
  }
  
  // 7. Value Communication (up to 15 points)
  const valueScore = calculateValueScore(allUserText);
  if (valueScore >= 3) {
    score += 15;
    strengths.push('Strong value communication - connected solution to business outcomes');
  } else if (valueScore >= 2) {
    score += 8;
    strengths.push('Mentioned benefits and value');
  } else if (valueScore >= 1) {
    score += 3;
  } else if (!didHangUp && userMessages.length > 2) {
    score -= 10;
    weaknesses.push('No clear value proposition presented');
    suggestions.push('Always articulate how your solution solves their specific problem');
    suggestions.push('Quantify value when possible (ROI, time saved, revenue gained)');
    missedOpportunities.push('Failed to differentiate from competitors by showing unique value');
  }
  
  // 8. Next Steps/Closing (up to 15 points)
  const closingScore = calculateClosingScore(allUserText, didHangUp);
  if (closingScore === 'committed') {
    score += 15;
    strengths.push('Secured clear commitment with specific next steps');
  } else if (closingScore === 'attempted') {
    score += 5;
    strengths.push('Attempted to establish next steps');
    weaknesses.push('Did not get firm commitment from prospect');
    suggestions.push('Always confirm specific date, time, and agenda for follow-up');
    missedOpportunities.push('Soft commitment often leads to no-shows and lost deals');
  } else if (closingScore === 'none' && !didHangUp && userMessages.length > 3) {
    score -= 12;
    weaknesses.push('No closing attempt - conversation ended without direction');
    suggestions.push('Every sales conversation needs a clear next step');
    suggestions.push('Ask: "When would be a good time to schedule a follow-up?"');
    missedOpportunities.push('Conversation drifted to a close without advancing the sale');
  }
  
  // 9. Rapport & Agreement (up to 10 points)
  const rapportScore = calculateRapportScore(transcript);
  if (rapportScore >= 3) {
    score += 10;
    strengths.push('Built strong rapport through agreement and validation');
  } else if (rapportScore >= 2) {
    score += 5;
    strengths.push('Established good connection');
  } else if (rapportScore === 0 && !didHangUp && userMessages.length > 2) {
    score -= 8;
    weaknesses.push('Little rapport building - too transactional');
    suggestions.push('Start conversations with agreement and validation');
    suggestions.push('Find common ground before diving into business');
    missedOpportunities.push('People buy from people they like and trust');
  }
  
  // 10. Professional Frame (up to 10 points)
  const frameScore = calculateFrameScore(allUserText);
  if (frameScore === 'expert') {
    score += 10;
    strengths.push('Positioned as trusted expert, not just another salesperson');
  } else if (frameScore === 'consultant') {
    score += 5;
    strengths.push('Consultative approach showed expertise');
  } else if (frameScore === 'needy') {
    score -= 12;
    weaknesses.push('Came across as needy or desperate for the sale');
    suggestions.push('Project confidence - you are the expert with valuable solutions');
    suggestions.push('Avoid phrases like "I really need this" or "Please just try it"');
    missedOpportunities.push('Neediness destroys perceived value and repels prospects');
  }
  
  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));
  
  // Generate summary
  const summary = generateSummary(score, strengths, weaknesses, didHangUp, wasRude);
  
  return {
    score,
    summary,
    strengths,
    weaknesses,
    suggestions,
    missedOpportunities
  };
}

function countDiscoveryQuestions(messages: AIMessage[]): number {
  const discoveryPatterns = [
    /\bwhat\b.*\b(challenge|problem|need|goal|looking for|trying to)\b/,
    /\bhow\b.*\b(currently|working|handling|managing)\b/,
    /\bwhy\b.*\b(important|necessary|looking|considering)\b/,
    /\btell me\b.*\b(more|about|challenge|situation)\b/,
    /\bwalk me\b.*\b(through|process|workflow)\b/,
    /\bcan you\b.*\b(describe|explain|share)\b/
  ];
  
  return messages.reduce((count, msg) => {
    const text = msg.content.toLowerCase();
    const hasDiscovery = discoveryPatterns.some(pattern => pattern.test(text));
    return count + (hasDiscovery ? 1 : 0);
  }, 0);
}

function analyzeObjectionHandling(transcript: AIMessage[]): { handled: boolean; present: boolean } {
  const objectionPatterns = [
    /(too much|expensive|cost|price|budget)/,
    /(think about it|consider|need time)/,
    /(send info|more information|details)/,
    /(not interested|don't need|already have)/,
    /(too busy|no time|later)/
  ];
  
  let objectionPresent = false;
  let objectionHandled = false;
  
  for (let i = 0; i < transcript.length; i++) {
    const msg = transcript[i];
    if (msg.role === 'assistant' && objectionPatterns.some(p => p.test(msg.content.toLowerCase()))) {
      objectionPresent = true;
      
      // Check if next user message agrees
      if (i + 1 < transcript.length) {
        const nextMsg = transcript[i + 1];
        if (nextMsg.role === 'user') {
          const agreePatterns = [
            /(i understand|i get it|that makes sense|good point|you're right)/,
            /(completely|totally|absolutely)\s+(understand|agree)/
          ];
          if (agreePatterns.some(p => p.test(nextMsg.content.toLowerCase()))) {
            objectionHandled = true;
          }
        }
      }
    }
  }
  
  return { handled: objectionHandled, present: objectionPresent };
}

function analyzeNextSteps(transcript: AIMessage[]): { clear: boolean; mentioned: boolean } {
  const nextStepPatterns = [
    /(next step|follow up|schedule|calendar|meeting)/,
    /(call tomorrow|next week|in.*days)/,
    /(send proposal|demo|presentation)/,
    /(let's.*connect|talk again|discuss further)/
  ];
  
  const commitmentPatterns = [
    /(yes|sure|sounds good|let's do it|confirmed)/,
    /(what time|when works|schedule it)/,
    /(looking forward to|can't wait to)/
  ];
  
  let mentioned = false;
  let clear = false;
  
  for (const msg of transcript) {
    if (nextStepPatterns.some(p => p.test(msg.content.toLowerCase()))) {
      mentioned = true;
    }
    if (commitmentPatterns.some(p => p.test(msg.content.toLowerCase()))) {
      clear = true;
    }
  }
  
  return { clear, mentioned };
}

function analyzeRapport(transcript: AIMessage[]): boolean {
  const rapportPatterns = [
    /(i understand|i get it|that makes sense|good point)/,
    /(agree|you're right|exactly|absolutely)/,
    /(weather|location|weekend|how are you)/,
    /(appreciate|thank you|great|wonderful)/
  ];
  
  return transcript.some(msg => 
    rapportPatterns.some(p => p.test(msg.content.toLowerCase()))
  );
}

function analyzeFrame(transcript: AIMessage[]): boolean {
  const confidentPatterns = [
    /(help you|solve|solution|expert|specialist)/,
    /(recommend|suggest|advise|guidance)/,
    /(experience|worked with|helped similar)/
  ];
  
  const needyPatterns = [
    /(please|really need|desperate|urgent)/,
    /(only.*day|last chance|special offer)/,
    /(discount|cheap|lower price)/
  ];
  
  const hasConfident = transcript.some(msg => 
    confidentPatterns.some(p => p.test(msg.content.toLowerCase()))
  );
  
  const hasNeedy = transcript.some(msg => 
    needyPatterns.some(p => p.test(msg.content.toLowerCase()))
  );
  
  return hasConfident && !hasNeedy;
}

function detectObjections(transcript: AIMessage[]): { handledWell: string[]; present: string[] } {
  const objectionPatterns = [
    { pattern: /(too much|expensive|cost|price|budget|money)/, type: 'price' },
    { pattern: /(think about it|consider|need time|let me think)/, type: 'stalling' },
    { pattern: /(send info|more information|email me details)/, type: 'info_request' },
    { pattern: /(not interested|don't need|already have|happy with current)/, type: 'not_interested' },
    { pattern: /(too busy|no time|call back later|in a meeting)/, type: 'busy' },
    { pattern: /(not looking|not searching|no budget)/, type: 'no_budget' }
  ];
  
  const handledWell: string[] = [];
  const present: string[] = [];
  
  for (let i = 0; i < transcript.length; i++) {
    const msg = transcript[i];
    if (msg.role === 'assistant') {
      const objection = objectionPatterns.find(o => o.pattern.test(msg.content.toLowerCase()));
      if (objection) {
        // Check if next user message shows agreement
        if (i + 1 < transcript.length) {
          const nextMsg = transcript[i + 1];
          if (nextMsg.role === 'user') {
            const agreed = /(i understand|i get it|that makes sense|you're right|completely agree)/.test(nextMsg.content.toLowerCase());
            if (agreed) {
              handledWell.push(objection.type);
            } else {
              present.push(objection.type);
            }
          }
        } else {
          present.push(objection.type);
        }
      }
    }
  }
  
  return { handledWell, present };
}

function calculateValueScore(userText: string): number {
  let score = 0;
  const valueIndicators = [
    /\b(save|cut|reduce|decrease|lower)\b.*\b(cost|expense|spending|time)\b/,
    /\b(increase|boost|grow|improve|enhance)\b.*\b(revenue|sales|profit|roi|return)\b/,
    /\b(value|benefit|advantage|gain|outcome|result)\b/,
    /\b(roi|return on investment|payback|break even)\b/,
    /\b(\d+%|\$\d+|\d+ dollars|times|x more)\b/
  ];
  
  valueIndicators.forEach(pattern => {
    if (pattern.test(userText)) score++;
  });
  
  return score;
}

function calculateClosingScore(userText: string, didHangUp: boolean): 'committed' | 'attempted' | 'none' {
  if (didHangUp) return 'none';
  
  const commitmentPatterns = [
    /\b(yes|sure|absolutely|definitely|let's do it|sounds good)\b.*\b(schedule|book|set up|next|tomorrow|monday|tuesday|wednesday|thursday|friday)\b/,
    /\b(send|email)\b.*\b(proposal|contract|agreement|details|information)\b/,
    /\b(calendly|calendar|appointment|meeting|call)\b.*\b(next|tomorrow|this week|next week)\b/
  ];
  
  const attemptedPatterns = [
    /\b(next step|follow up|touch base|check in|get back to you)\b/,
    /\b(when|what time)\b.*\b(work|good for you|available|free)\b/
  ];
  
  const isCommitted = commitmentPatterns.some(p => p.test(userText));
  const isAttempted = attemptedPatterns.some(p => p.test(userText));
  
  if (isCommitted) return 'committed';
  if (isAttempted) return 'attempted';
  return 'none';
}

function calculateRapportScore(transcript: AIMessage[]): number {
  let score = 0;
  const agreementPatterns = [
    /\b(i understand|i get it|that makes sense|you're right|exactly|absolutely|totally)\b/,
    /\b(i agree|good point|well said|that's true)\b/
  ];
  
  const personalPatterns = [
    /\b(how are you|how's your|how was your|how is the)\b/,
    /\b(great to connect|nice to meet|pleasure speaking|appreciate your time)\b/,
    /\b(your business|your company|your team|your situation)\b/
  ];
  
  transcript.forEach(msg => {
    if (msg.role === 'user') {
      if (agreementPatterns.some(p => p.test(msg.content.toLowerCase()))) score++;
      if (personalPatterns.some(p => p.test(msg.content.toLowerCase()))) score++;
    }
  });
  
  return Math.min(score, 5);
}

function calculateFrameScore(userText: string): 'expert' | 'consultant' | 'needy' | 'neutral' {
  const expertPatterns = [
    /\b(based on my experience|what i've seen|typically|in my work with)\b/,
    /\b(recommend|suggest|advise|guide|help you)\b/,
    /\b(expert|specialist|consultant|professional|solution)\b/,
    /\b(best practice|industry standard|proven|effective approach)\b/
  ];
  
  const needyPatterns = [
    /\b(i really need|please|if you could just|just give me a chance)\b/,
    /\b(desperate|struggling|really hoping|counting on you)\b/,
    /\b(discount|cheaper|lower price|match|beat)\b/,
    /\b(special deal|one time offer|limited time|act now)\b/
  ];
  
  const expertCount = expertPatterns.filter(p => p.test(userText)).length;
  const needyCount = needyPatterns.filter(p => p.test(userText)).length;
  
  if (needyCount >= 2) return 'needy';
  if (expertCount >= 2) return 'expert';
  if (expertCount >= 1) return 'consultant';
  return 'neutral';
}

function generateSummary(score: number, strengths: string[], weaknesses: string[], didHangUp: boolean, wasRude: boolean): string {
  if (wasRude) {
    return 'Professionalism is non-negotiable in sales. Using inappropriate language or displaying negative attitude destroys trust instantly and damages your reputation. In real sales situations, this behavior would result in lost opportunities and potential blacklisting. Practice maintaining composure even in challenging conversations.';
  }
  if (didHangUp) {
    return 'The prospect hung up during your call, which signals a breakdown in rapport or value delivery. Prospects hang up when they feel pressured, disrespected, or when the conversation isn\'t worth their time. To prevent this: start with genuine curiosity about their situation, respect their time constraints, and ensure every statement adds value. A hung-up call is a lost opportunity - focus on keeping prospects engaged through relevance and respect.';
  }
  if (score >= 85) {
    return 'Outstanding performance! You demonstrated sophisticated sales skills across multiple dimensions. Your discovery questions uncovered real needs, you maintained excellent listening balance, and communicated value effectively. You positioned yourself as a trusted advisor rather than just another salesperson. To reach elite level: practice handling objections even more smoothly, work on creating urgency without pressure, and refine your closing techniques for higher conversion rates.';
  } else if (score >= 70) {
    return 'Strong performance with solid sales fundamentals in place. You showed capability in key areas like discovery and value communication, while demonstrating professional rapport-building skills. Your approach was consultative and customer-focused. Focus areas for improvement: dig deeper in discovery (ask follow-up questions), improve your listening ratio further, and work on securing firmer next-step commitments. With refinement in these areas, you\'ll see significant improvement in conversion rates.';
  } else if (score >= 55) {
    return 'Developing competency with clear growth trajectory. You demonstrated some effective sales behaviors while having specific areas needing attention. The foundation is there - now it\'s about strengthening execution. Priority improvements: start every call with strong discovery before pitching, focus on understanding needs over talking about features, and work on handling objections with agreement-first approach. Consistent practice in these areas will significantly improve your results within weeks.';
  } else if (score >= 40) {
    return 'Several core sales fundamentals need development. The good news: these are learnable skills that improve with focused practice. Immediate priorities: (1) Never pitch before understanding their situation - ask 3-4 discovery questions first, (2) Listen 70% of the time - if you\'re talking more than the prospect, you\'re losing, (3) Connect every feature to a specific benefit they care about. Study successful sales calls, practice your opening, and focus on being genuinely curious about your prospects.';
  } else {
    return 'This call revealed significant gaps in sales approach that are holding back your effectiveness. Sales success requires a fundamental mindset shift: stop trying to sell and start trying to help. Immediate action items: (1) Master the discovery phase - ask questions about their challenges, goals, and current situation before mentioning your solution, (2) Build rapport through genuine interest and agreement, not forced friendliness, (3) Communicate value in terms they understand - ROI, time saved, problems solved. Consider working through basic sales training modules and practicing with simpler scenarios first.';
  }
}

type AIMessage = { role: 'user' | 'assistant'; content: string };
