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
  
  // Scoring factors
  let score = 50; // Base score
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];
  const missedOpportunities: string[] = [];
  
  // 1. Discovery/Qualifying (20 points)
  const discoveryQuestions = countDiscoveryQuestions(userMessages);
  if (discoveryQuestions >= 3) {
    score += 15;
    strengths.push('Asked excellent discovery questions to understand needs');
  } else if (discoveryQuestions >= 1) {
    score += 8;
    strengths.push('Asked some discovery questions');
  } else {
    weaknesses.push('Failed to ask discovery questions');
    suggestions.push('Ask more open-ended questions about their business needs');
    missedOpportunities.push('Could have uncovered pain points by asking about challenges');
  }
  
  // 2. Listening vs Talking (15 points)
  const userToAssistantRatio = userMessages.length / (assistantMessages.length || 1);
  if (userToAssistantRatio > 0.7) {
    score += 10;
    strengths.push('Great listening - let prospect talk more than selling');
  } else if (userToAssistantRatio > 0.4) {
    score += 5;
    strengths.push('Balanced conversation');
  } else {
    weaknesses.push('Talked too much, didn\'t listen enough');
    suggestions.push('Ask more questions and talk less');
    missedOpportunities.push('Could have built more rapport by listening');
  }
  
  // 3. Handling Objections (15 points)
  const objectionHandling = analyzeObjectionHandling(transcript);
  if (objectionHandling.handled) {
    score += 12;
    strengths.push('Handled objections professionally by agreeing first');
  } else if (objectionHandling.present) {
    score += 5;
    weaknesses.push('Missed opportunity to handle objection properly');
    suggestions.push('Always agree with objections before addressing them');
    missedOpportunities.push('Could have built trust by agreeing with concerns');
  }
  
  // 4. Value Communication (15 points)
  const valueMentioned = /(value|benefit|save|increase|reduce|improve|roi|return)/.test(allText);
  if (valueMentioned) {
    score += 10;
    strengths.push('Communicated value and benefits');
  } else {
    weaknesses.push('Didn\'t communicate clear value proposition');
    suggestions.push('Always connect your solution to business value');
    missedOpportunities.push('Could have shown ROI or business impact');
  }
  
  // 5. Next Steps/Closing (15 points)
  const nextSteps = analyzeNextSteps(transcript);
  if (nextSteps.clear) {
    score += 12;
    strengths.push('Established clear next steps');
  } else if (nextSteps.mentioned) {
    score += 6;
    weaknesses.push('Mentioned next steps but didn\'t get commitment');
    suggestions.push('Always secure specific, time-bound next steps');
    missedOpportunities.push('Could have scheduled follow-up or next meeting');
  } else {
    weaknesses.push('No clear next steps or closing');
    suggestions.push('Always end with specific next steps');
    missedOpportunities.push('Lost opportunity to advance the sale');
  }
  
  // 6. Rapport Building (10 points)
  const rapportBuilt = analyzeRapport(transcript);
  if (rapportBuilt) {
    score += 8;
    strengths.push('Built good rapport through agreement and small talk');
  } else {
    weaknesses.push('Could have built better rapport');
    suggestions.push('Start with agreement and build personal connection');
    missedOpportunities.push('Could have established stronger connection');
  }
  
  // 7. Professional Frame (10 points)
  const professionalFrame = analyzeFrame(transcript);
  if (professionalFrame) {
    score += 8;
    strengths.push('Maintained confident, professional frame');
  } else {
    weaknesses.push('Frame could be more confident');
    suggestions.push('Project confidence and act as the expert');
    missedOpportunities.push('Could have positioned self more strongly');
  }
  
  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));
  
  // Generate summary
  const summary = generateSummary(score, strengths, weaknesses);
  
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

function generateSummary(score: number, strengths: string[], weaknesses: string[]): string {
  if (score >= 85) {
    return 'Excellent sales execution. Strong fundamentals with minimal areas for improvement.';
  } else if (score >= 70) {
    return 'Good overall performance with clear strengths. Focus on the identified areas to reach excellence.';
  } else if (score >= 55) {
    return 'Developing sales skills present. Address the key weaknesses to significantly improve performance.';
  } else {
    return 'Major gaps in sales fundamentals. Focus on building core skills before advanced techniques.';
  }
}

type AIMessage = { role: 'user' | 'assistant'; content: string };
