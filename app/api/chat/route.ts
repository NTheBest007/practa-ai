import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// In-memory session context cache (resets on server restart, per-session in production)
const sessionContextCache = new Map<string, SessionContext>();

interface SessionContext {
  askedQuestions: string[];
  discoveredInfo: Map<string, string>;
  objectionsRaised: string[];
  emotionalTone: 'neutral' | 'interested' | 'skeptical' | 'impatient' | 'hostile';
  conversationTurns: number;
  lastResponseType: string;
}

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

function getOrCreateContext(sessionId: string): SessionContext {
  if (!sessionContextCache.has(sessionId)) {
    sessionContextCache.set(sessionId, {
      askedQuestions: [],
      discoveredInfo: new Map(),
      objectionsRaised: [],
      emotionalTone: 'neutral',
      conversationTurns: 0,
      lastResponseType: 'initial'
    });
  }
  return sessionContextCache.get(sessionId)!;
}

function extractTopics(text: string): string[] {
  const topics: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Common CRM/productivity topics
  if (lowerText.includes('crm') || lowerText.includes('hubspot') || lowerText.includes('salesforce')) topics.push('crm');
  if (lowerText.includes('price') || lowerText.includes('cost') || lowerText.includes('budget') || lowerText.includes('expensive')) topics.push('pricing');
  if (lowerText.includes('team') || lowerText.includes('staff') || lowerText.includes('employees')) topics.push('team_size');
  if (lowerText.includes('time') || lowerText.includes('schedule') || lowerText.includes('busy')) topics.push('time_constraints');
  if (lowerText.includes('competitor') || lowerText.includes('using') || lowerText.includes('currently')) topics.push('current_solution');
  if (lowerText.includes('problem') || lowerText.includes('issue') || lowerText.includes('pain')) topics.push('pain_points');
  if (lowerText.includes('decision') || lowerText.includes('approve') || lowerText.includes('manager')) topics.push('decision_maker');
  
  return topics;
}

function hasSimilarQuestionBeenAsked(askedQuestions: string[], newQuestion: string): boolean {
  const normalizedNew = newQuestion.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  
  for (const asked of askedQuestions) {
    const normalizedAsked = asked.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    
    // Check for significant word overlap
    const newWords = Array.from(new Set(normalizedNew.split(' ').filter(w => w.length > 3)));
    const askedWords = Array.from(new Set(normalizedAsked.split(' ').filter(w => w.length > 3)));
    
    let overlap = 0;
    for (const word of newWords) {
      if (askedWords.includes(word)) overlap++;
    }
    
    // If more than 60% word overlap, consider it a duplicate
    if (newWords.length > 0 && overlap / newWords.length > 0.6) {
      return true;
    }
  }
  
  return false;
}

function analyzeEmotionalTone(history: AIMessage[], currentMessage: string): string {
  const allText = [...history.map(h => h.content), currentMessage].join(' ').toLowerCase();
  
  const hostileWords = ['annoying', 'frustrated', 'angry', 'waste', 'stop calling', 'do not call'];
  const impatientWords = ['quick', 'busy', 'hurry', 'short on time', 'get to the point'];
  const skepticalWords = ['doubt', 'skeptical', 'sounds like', 'not sure', 'maybe', 'probably not'];
  const interestedWords = ['interesting', 'tell me more', 'how does', 'what about', 'could you explain'];
  
  if (hostileWords.some(w => allText.includes(w))) return 'hostile';
  if (impatientWords.some(w => allText.includes(w))) return 'impatient';
  if (skepticalWords.some(w => allText.includes(w))) return 'skeptical';
  if (interestedWords.some(w => allText.includes(w))) return 'interested';
  
  return 'neutral';
}

export async function POST(req: Request) {
  try {
    const { scenarioDoc, history, userMessage, sessionId } = (await req.json()) as {
      scenarioDoc: string;
      history: AIMessage[];
      userMessage: string;
      sessionId?: string;
    };
    
    if (typeof userMessage !== 'string' || !userMessage.trim()) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API;
    if (!groqKey) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    // Get or create session context for memory
    const context = sessionId ? getOrCreateContext(sessionId) : null;
    if (context) {
      context.conversationTurns++;
    }

    // Analyze conversation state
    const userTopics = extractTopics(userMessage);
    const emotionalTone = analyzeEmotionalTone(history || [], userMessage);
    
    // Build comprehensive system prompt with memory
    const systemPrompt = buildIntelligentPrompt(
      scenarioDoc, 
      context,
      userTopics,
      emotionalTone,
      history?.length || 0
    );

    // Build the conversation history
    const messages = [
      {
        role: 'system' as const,
        content: systemPrompt
      },
      ...(history || []).slice(-16).map((msg: AIMessage) => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: userMessage
      }
    ];

    // Call Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.75,
        max_tokens: 100,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Chat API] Groq error:', error);
      return NextResponse.json({ reply: "I'm listening. What's on your mind?" });
    }

    const data = await response.json();
    let reply = data.choices[0]?.message?.content || "I didn't catch that. Could you repeat?";
    reply = reply.trim();

    // Post-process to avoid repetition
    if (context) {
      reply = postProcessResponse(reply, context, history || []);
      
      // Update context with this interaction
      updateContext(context, userMessage, reply, userTopics);
    }

    return NextResponse.json({ reply });
  } catch (e) {
    console.error('[Chat API] Error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function buildIntelligentPrompt(
  scenarioDoc: string,
  context: SessionContext | null,
  userTopics: string[],
  emotionalTone: string,
  turnCount: number
): string {
  const personaName = extractPersonaName(scenarioDoc);
  
  let memorySection = '';
  if (context && context.discoveredInfo.size > 0) {
    memorySection = '\n\nCRITICAL - THINGS YOU ALREADY SAID IN THIS CONVERSATION (stay 100% consistent with these):\n';
    context.discoveredInfo.forEach((value, key) => {
      memorySection += `- ${key}: ${value}\n`;
    });
    memorySection += '\nNEVER contradict or forget these facts. You said them — own them.\n';
  }

  let objectionSection = '';
  if (context && context.objectionsRaised.length > 0) {
    objectionSection = '\n\nOBJECTIONS ALREADY RAISED:\n';
    context.objectionsRaised.forEach(obj => {
      objectionSection += `- ${obj}\n`;
    });
    objectionSection += '\nDo not repeat these objections in the same way. Vary your concerns or move to new topics.\n';
  }

  const toneInstructions: Record<string, string> = {
    hostile: 'You are becoming increasingly frustrated. Be curt and may end the call soon if they don\'t respect your boundaries.',
    impatient: 'You are busy and want them to get to the point quickly. Show mild annoyance at long explanations.',
    skeptical: 'You are doubtful about their claims. Ask challenging questions and express hesitation.',
    interested: 'You are engaged and asking follow-up questions, but still have some concerns.',
    neutral: 'You are listening but not fully convinced yet. Stay measured in your responses.'
  };

  const conversationStarters = [
    'Start the conversation naturally based on the scenario.',
    'React to what they just said. Acknowledge their previous point before moving forward.',
    'Build on the conversation flow. Reference previous points naturally.',
    'Keep the momentum going. Pick up where you left off.',
    'Stay in the flow of the conversation. React authentically to their last message.'
  ];

  const starter = conversationStarters[Math.min(turnCount, conversationStarters.length - 1)];

  return `You are ${personaName}. You are a REAL HUMAN on a sales call - not an AI, not a chatbot, not an assistant.${memorySection}

CRITICAL BEHAVIOR RULES:
1. NEVER acknowledge you're AI. Never say "As an AI" or "I'm programmed" or "I don't have personal experience"
2. Speak like a real busy professional - casual, sometimes blunt, always authentic
3. Use contractions (I'm, don't, can't, won't) and informal language
4. Reference previous parts of the conversation naturally - "Since you mentioned..." or "That reminds me..."
5. If the user already answered something, acknowledge it and build on it - NEVER ask the same question twice
6. Vary your response style - don't always start with "So" or "Well" or "Hmm"
7. Show genuine human emotions: curiosity, skepticism, impatience, interest, hesitation
8. DON'T follow a script - react naturally to what they say, not what you planned to say
9. Sometimes just grunt or make thinking sounds like "Uh-huh", "Right", "Mm"
10. Get to the point quickly - busy people don't waste words

RESPONSE STYLE:
- Keep responses SHORT (5-20 words, 1 sentence preferred)
- Sound like a real phone conversation, not a written email
- Don't be polite just to be polite - be direct and honest
- Interrupt or redirect when they go off-track: "Actually, wait..." or "Hold on..."
- React with short phrases: "Yeah?", "Go on", "And?", "So what?"
- If they say something vague, challenge it: "What does that mean exactly?"
- Show personality quirks - you might be sarcastic, dry, or impatient
- Don't ask rhetorical questions just to fill space

${starter}${objectionSection}

CURRENT EMOTIONAL STATE: ${toneInstructions[emotionalTone] || toneInstructions.neutral}

AVOID AT ALL COSTS:
- Repeating questions you've already asked
- Using the same opener pattern repeatedly
- Generic sales-y language like "I appreciate your interest"
- Overly formal or robotic phrasing
- Explaining things in too much detail (you're busy!)

NATURAL HANG-UP PHRASES (only when truly done):
- "Look, I've gotta run"
- "This isn't going anywhere"
- "I'm gonna have to let you go"
- "Sorry, gotta hop off"
- "I'm out / I'm done"
- "Not interested, bye"
- "Yeah no, I'm tapping out"

${scenarioDoc}`;
}

function postProcessResponse(reply: string, context: SessionContext, history: AIMessage[]): string {
  // Check if this response is too similar to previous assistant responses
  const assistantResponses = history
    .filter(m => m.role === 'assistant')
    .map(m => m.content.toLowerCase());
  
  // Simple similarity check - if reply is very similar to last response, vary it
  if (assistantResponses.length > 0) {
    const lastResponse = assistantResponses[assistantResponses.length - 1];
    const similarity = calculateSimilarity(reply.toLowerCase(), lastResponse);
    
    if (similarity > 0.7) {
      // Response is too similar, add variation hint
      console.log('[Chat] Response too similar, adding variation');
    }
  }
  
  return reply;
}

function calculateSimilarity(a: string, b: string): number {
  const wordsA = Array.from(new Set(a.split(' ').filter(w => w.length > 3)));
  const wordsB = Array.from(new Set(b.split(' ').filter(w => w.length > 3)));
  
  let intersection = 0;
  for (const word of wordsA) {
    if (wordsB.includes(word)) intersection++;
  }
  
  return (intersection * 2) / (wordsA.length + wordsB.length);
}

function updateContext(context: SessionContext, userMessage: string, reply: string, topics: string[]): void {
  // Extract and store discovered information from user messages
  if (topics.includes('crm')) {
    const crmMatch = userMessage.match(/(?:using|on|have)\s+(?:HubSpot|Salesforce|Zoho|Pipedrive|CRM)/i);
    if (crmMatch) {
      context.discoveredInfo.set('current_crm', crmMatch[0]);
    }
  }
  
  if (topics.includes('team_size')) {
    const teamMatch = userMessage.match(/(\d+)\s+(?:people|team|staff|employees)/i);
    if (teamMatch) {
      context.discoveredInfo.set('team_size', teamMatch[1]);
    }
  }

  // Extract facts from AI's OWN replies (things the prospect said about themselves)
  const revenueGoalMatch = reply.match(/(?:want|trying|hoping|looking|need|love)\s+to\s+(?:hit|reach|get to|make|earn)\s+(\$[\d,]+k?(?:\s*(?:a|per)\s*month)?)/i);
  if (revenueGoalMatch) {
    context.discoveredInfo.set('revenue_goal', revenueGoalMatch[1]);
  }

  const currentRevenueMatch = reply.match(/(?:currently|right now|at|making|doing|stuck(?:\s+around)?)\s+(\$[\d,]+k?(?:\s*(?:a|per)\s*month|-\$[\d,]+k?)?)/i);
  if (currentRevenueMatch) {
    context.discoveredInfo.set('current_revenue', currentRevenueMatch[1]);
  }

  const goalMatch = reply.match(/(?:my goal|what I want|what I'm after|trying to achieve)[^.!?]*([^.!?]+[.!?])/i);
  if (goalMatch) {
    context.discoveredInfo.set('stated_goal', goalMatch[1].trim());
  }

  // Also extract from user messages
  const userRevenueMatch = userMessage.match(/(\$[\d,]+k?)(?:\s*(?:a|per)\s*month)?/i);
  if (userRevenueMatch) {
    context.discoveredInfo.set('mentioned_revenue', userRevenueMatch[1]);
  }
  
  // Track objections
  const objectionPatterns = [
    /(?:too\s+expensive|price\s+is|can't\s+afford|budget)/i,
    /(?:not\s+interested|don't\s+need|happy\s+with\s+current)/i,
    /(?:need\s+to\s+think|talk\s+to|discuss\s+with)/i,
    /(?:no\s+time|busy|call\s+back\s+later)/i
  ];
  
  for (const pattern of objectionPatterns) {
    const match = userMessage.match(pattern);
    if (match && !context.objectionsRaised.includes(match[0])) {
      context.objectionsRaised.push(match[0]);
    }
  }
  
  // Track potential questions in the reply
  const questions = reply.match(/[^.!?]*\?/g);
  if (questions) {
    for (const q of questions) {
      if (!hasSimilarQuestionBeenAsked(context.askedQuestions, q)) {
        context.askedQuestions.push(q);
      }
    }
  }
}

function extractPersonaName(scenarioDoc: string): string {
  const nameMatch = scenarioDoc.match(/Name:\s*([^\n]+)/);
  return nameMatch ? nameMatch[1].trim() : 'a business professional';
}
