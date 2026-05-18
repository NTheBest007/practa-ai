import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { transcript } = (await req.json()) as { transcript: AIMessage[] };
    
    if (!transcript || transcript.length === 0) {
      return NextResponse.json({ error: 'No transcript provided' }, { status: 400 });
    }

    // Perform comprehensive conversation analysis
    const analysis = performEliteCoachingAnalysis(transcript);
    
    return NextResponse.json(analysis);
  } catch (e) {
    console.error('[Feedback API] Error:', e);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ConversationMoment {
  timestamp: number;
  speaker: 'user' | 'assistant';
  message: string;
  type: 'discovery' | 'objection' | 'value_prop' | 'closing' | 'rapport' | 'pivot' | 'missed_signal';
  impact: 'positive' | 'negative' | 'neutral';
  coaching_note?: string;
}

interface DetailedIssue {
  category: string;
  moment: string;
  transcriptSnippet: string;
  userResponse: string;
  whyItWasWeak: string;
  betterApproach: string;
  eliteExample: string;
}

interface CategoryScore {
  score: number;
  maxScore: number;
  explanation: string;
  specificExamples: string[];
}

function performEliteCoachingAnalysis(transcript: AIMessage[]) {
  const userMessages = transcript.filter(m => m.role === 'user');
  const assistantMessages = transcript.filter(m => m.role === 'assistant');
  
  // Build conversation timeline with moments
  const timeline = buildConversationTimeline(transcript);
  
  // Find strongest and weakest moments
  const strongestMoment = findStrongestMoment(timeline);
  const weakestMoment = findWeakestMoment(timeline);
  
  // Detect missed buying signals
  const missedSignals = detectMissedBuyingSignals(transcript);
  
  // Calculate detailed category scores
  const categoryScores = calculateCategoryScores(transcript, userMessages, assistantMessages);
  
  // Generate detailed issues with specific feedback
  const detailedIssues = generateDetailedIssues(transcript, timeline);
  
  // Calculate overall metrics
  const metrics = calculateConversationMetrics(userMessages, assistantMessages, transcript);
  
  // Calculate final score
  const overallScore = calculateOverallScore(categoryScores);
  
  // Generate executive summary
  const summary = generateExecutiveSummary(overallScore, categoryScores, metrics, strongestMoment, weakestMoment);
  
  // Generate strengths, weaknesses, suggestions from category scores
  const { strengths, weaknesses, suggestions, missedOpportunities } = generateLegacyFeedback(categoryScores, detailedIssues, metrics);

  return {
    score: overallScore,
    summary,
    timeline,
    strongestMoment,
    weakestMoment,
    missedSignals,
    categoryScores,
    detailedIssues,
    metrics,
    coachingInsights: generateCoachingInsights(categoryScores, detailedIssues),
    nextSessionFocus: generateNextSessionFocus(categoryScores, detailedIssues),
    strengths,
    weaknesses,
    suggestions,
    missedOpportunities
  };
}

function buildConversationTimeline(transcript: AIMessage[]): ConversationMoment[] {
  const timeline: ConversationMoment[] = [];
  
  transcript.forEach((msg, index) => {
    const content = msg.content.toLowerCase();
    
    // Detect discovery questions
    if (msg.role === 'user' && /\b(what|how|why|tell me|walk me|describe|explain)\b.*\b(challenge|problem|pain|issue|concern|goal|need|priority|situation|current)\b/.test(content)) {
      timeline.push({
        timestamp: index,
        speaker: msg.role,
        message: msg.content,
        type: 'discovery',
        impact: 'positive',
        coaching_note: 'Good discovery question to understand prospect needs'
      });
    }
    
    // Detect objections
    if (msg.role === 'assistant' && /\b(too expensive|price|cost|budget|not interested|don't need|already have|happy with|think about it|need time|busy|call back later)\b/.test(content)) {
      const nextMsg = transcript[index + 1];
      const handledWell = nextMsg?.role === 'user' && 
        /\b(i understand|that makes sense|you're right|i get it|totally agree|completely understand)\b/.test(nextMsg.content.toLowerCase());
      
      timeline.push({
        timestamp: index,
        speaker: msg.role,
        message: msg.content,
        type: 'objection',
        impact: handledWell ? 'positive' : 'negative',
        coaching_note: handledWell ? 'Objection acknowledged and agreed with' : 'Objection not properly addressed - missed agreement step'
      });
    }
    
    // Detect value propositions
    if (msg.role === 'user' && /\b(save|increase|improve|reduce|roi|value|benefit|result|outcome|help you|solution)\b/.test(content)) {
      timeline.push({
        timestamp: index,
        speaker: msg.role,
        message: msg.content,
        type: 'value_prop',
        impact: 'positive',
        coaching_note: 'Value communication detected'
      });
    }
    
    // Detect closing attempts
    if (msg.role === 'user' && /\b(schedule|next step|follow up|calendar|meeting|demo|trial|get started|move forward)\b/.test(content)) {
      timeline.push({
        timestamp: index,
        speaker: msg.role,
        message: msg.content,
        type: 'closing',
        impact: 'positive',
        coaching_note: 'Closing/next steps attempt'
      });
    }
    
    // Detect missed buying signals
    if (msg.role === 'assistant') {
      const buyingSignals = [
        /\b(that sounds good|interesting|tell me more|how does that work|what would that look like|when can we|how soon|how much)\b/,
        /\b(i like|that makes sense|we could use that|that would help|that solves)\b/
      ];
      
      const hasBuyingSignal = buyingSignals.some(pattern => pattern.test(content));
      const nextUserMsg = transcript[index + 1];
      
      if (hasBuyingSignal && nextUserMsg?.role === 'user') {
        const userResponse = nextUserMsg.content.toLowerCase();
        const missedOpportunity = !/\b(close|deal|schedule|next step|move forward|get started)\b/.test(userResponse);
        
        if (missedOpportunity) {
          timeline.push({
            timestamp: index,
            speaker: 'assistant',
            message: msg.content,
            type: 'missed_signal',
            impact: 'negative',
            coaching_note: 'Buying signal detected but not capitalized on'
          });
        }
      }
    }
  });
  
  return timeline;
}

function findStrongestMoment(timeline: ConversationMoment[]): ConversationMoment | null {
  const positiveMoments = timeline.filter(m => m.impact === 'positive');
  if (positiveMoments.length === 0) return null;
  
  // Prioritize certain types
  const priorityTypes = ['closing', 'value_prop', 'discovery'];
  for (const type of priorityTypes) {
    const moment = positiveMoments.find(m => m.type === type);
    if (moment) return moment;
  }
  
  return positiveMoments[0];
}

function findWeakestMoment(timeline: ConversationMoment[]): ConversationMoment | null {
  const negativeMoments = timeline.filter(m => m.impact === 'negative');
  if (negativeMoments.length === 0) return null;
  
  // Prioritize missed signals and objections
  const priorityTypes = ['missed_signal', 'objection'];
  for (const type of priorityTypes) {
    const moment = negativeMoments.find(m => m.type === type);
    if (moment) return moment;
  }
  
  return negativeMoments[0];
}

function detectMissedBuyingSignals(transcript: AIMessage[]): string[] {
  const missedSignals: string[] = [];
  
  const buyingSignalPatterns = [
    { pattern: /\b(that sounds? (good|interesting)|tell me more|how does (that|this) work)\b/, signal: 'Interest/Engagement signal' },
    { pattern: /\b(what would (that|this) look like|when can we|how soon|timeline)\b/, signal: 'Implementation interest' },
    { pattern: /\b(how much|pricing|cost|investment|budget for)\b/, signal: 'Pricing inquiry (hot signal)' },
    { pattern: /\b(i like|that makes sense|we could use that|that would help)\b/, signal: 'Value recognition' },
    { pattern: /\b(who else|other teams|department|company-wide)\b/, signal: 'Expansion interest' }
  ];
  
  for (let i = 0; i < transcript.length; i++) {
    const msg = transcript[i];
    if (msg.role === 'assistant') {
      for (const { pattern, signal } of buyingSignalPatterns) {
        if (pattern.test(msg.content.toLowerCase())) {
          const nextMsg = transcript[i + 1];
          if (nextMsg?.role === 'user') {
            const userResponse = nextMsg.content.toLowerCase();
            // Check if they moved toward close or stayed in information mode
            const movedTowardClose = /\b(schedule|next step|move forward|get started|proceed|close|deal)\b/.test(userResponse);
            
            if (!movedTowardClose) {
              missedSignals.push(`"${msg.content.substring(0, 60)}..." - ${signal}. You responded with information instead of advancing the sale.`);
            }
          }
        }
      }
    }
  }
  
  return missedSignals;
}

function calculateCategoryScores(
  transcript: AIMessage[],
  userMessages: AIMessage[],
  assistantMessages: AIMessage[]
): Record<string, CategoryScore> {
  const allUserText = userMessages.map(m => m.content).join(' ').toLowerCase();
  const allAssistantText = assistantMessages.map(m => m.content).join(' ').toLowerCase();
  
  // Discovery Score
  const discoveryQuestions = userMessages.filter(m => 
    /\b(what|how|why|tell me|walk me|describe|explain)\b.*\b(challenge|problem|pain|issue|concern|goal|need|priority|situation|current|process|workflow)\b/.test(m.content.toLowerCase())
  ).length;
  
  const discoveryScore: CategoryScore = {
    score: Math.min(discoveryQuestions * 5, 20),
    maxScore: 20,
    explanation: discoveryQuestions >= 3 
      ? 'Strong discovery phase with multiple targeted questions about prospect situation'
      : discoveryQuestions >= 1
      ? 'Some discovery attempted but could dig deeper'
      : 'No discovery questions - jumped straight to pitch',
    specificExamples: userMessages
      .filter(m => /\b(what|how|why)\b.*\b(challenge|problem|goal)\b/.test(m.content.toLowerCase()))
      .slice(0, 2)
      .map(m => `"${m.content.substring(0, 80)}..."`)
  };
  
  // Listening Ratio Score
  // ratio = userWords / assistantWords (salesperson / prospect)
  // target: salesperson talks < 0.43 (30% of words), prospect talks > 70%
  const userWordCount = allUserText.split(/\s+/).length;
  const assistantWordCount = allAssistantText.split(/\s+/).length;
  const salespersonRatio = userWordCount / (assistantWordCount || 1);
  
  let listeningScore = 10;
  let listeningExplanation = 'Reasonable balance - aim for prospect to talk 70% of the time';
  
  if (salespersonRatio > 1.5) {
    // Salesperson talked significantly more than prospect
    listeningScore = 3;
    listeningExplanation = 'You dominated the conversation - prospect should talk more (70/30 rule violated)';
  } else if (salespersonRatio > 1.0) {
    // Salesperson talked more than prospect
    listeningScore = 6;
    listeningExplanation = 'You talked more than the prospect - work on asking more questions';
  } else if (salespersonRatio < 0.43) {
    // Salesperson talked < 30% — excellent
    listeningScore = 20;
    listeningExplanation = 'Outstanding - you let the prospect do most of the talking';
  } else if (salespersonRatio < 0.6) {
    // Salesperson talked < 40%
    listeningScore = 15;
    listeningExplanation = 'Excellent listening ratio - prospect dominated the conversation';
  }
  
  const listeningRatioScore: CategoryScore = {
    score: listeningScore,
    maxScore: 20,
    explanation: listeningExplanation,
    specificExamples: [
      `You: ~${userWordCount} words | Prospect: ~${assistantWordCount} words`,
      `You spoke ${Math.round(salespersonRatio * 100)}% of words (target: <30%)`
    ]
  };
  
  // Objection Handling Score
  const objectionsRaised = assistantMessages.filter(m => 
    /\b(too expensive|price|cost|budget|not interested|don't need|think about it|busy|call back)\b/.test(m.content.toLowerCase())
  ).length;
  
  const objectionsHandled = transcript.filter((m, i) => {
    if (m.role !== 'assistant') return false;
    const hasObjection = /\b(too expensive|price|cost|not interested|think about it)\b/.test(m.content.toLowerCase());
    const nextMsg = transcript[i + 1];
    return hasObjection && nextMsg?.role === 'user' && 
      /\b(i understand|that makes sense|you're right|totally|completely understand)\b/.test(nextMsg.content.toLowerCase());
  }).length;
  
  // Only claim strength if objections actually occurred and were handled.
  // If no objections at all, score is neutral (10/20) — not a strength, not a weakness.
  let objectionScoreValue: number;
  let objectionExplanation: string;
  if (objectionsRaised === 0) {
    objectionScoreValue = 10; // neutral — no data to evaluate
    objectionExplanation = 'No objections raised - not enough data to evaluate objection handling';
  } else if (objectionsHandled === objectionsRaised) {
    objectionScoreValue = 20;
    objectionExplanation = 'Perfect objection handling - acknowledged every concern before responding';
  } else if (objectionsHandled > 0) {
    objectionScoreValue = Math.round((objectionsHandled / objectionsRaised) * 20);
    objectionExplanation = `Handled ${objectionsHandled}/${objectionsRaised} objections with agreement-first approach`;
  } else {
    objectionScoreValue = 0;
    objectionExplanation = `${objectionsRaised} objection(s) raised but none acknowledged first - missed agreement step`;
  }
  
  const objectionScore: CategoryScore = {
    score: objectionScoreValue,
    maxScore: 20,
    explanation: objectionExplanation,
    specificExamples: objectionsRaised > 0 
      ? [`${objectionsHandled} of ${objectionsRaised} objections properly acknowledged`]
      : ['No objections encountered - cannot evaluate this skill']
  };
  
  // Value Communication Score
  const valueIndicators = [
    /\b(save|cut|reduce|decrease)\b.*\b(cost|expense|time|hours)\b/,
    /\b(increase|boost|grow|improve)\b.*\b(revenue|sales|profit|roi)\b/,
    /\b(roi|return|payback|break even)\b/,
    /\b(\d+%|\$\d+|\d+ percent)\b/,
    /\b(value|benefit|advantage|outcome|result)\b.*\b(you|your|team|company)\b/
  ];
  
  const valueMentions = valueIndicators.filter(p => p.test(allUserText)).length;
  
  const valueScore: CategoryScore = {
    score: Math.min(valueMentions * 5, 20),
    maxScore: 20,
    explanation: valueMentions >= 3
      ? 'Strong value communication with specific benefits and outcomes'
      : valueMentions >= 1
      ? 'Some value mentioned but could be more specific'
      : 'No clear value proposition - focused on features instead of outcomes',
    specificExamples: valueMentions > 0
      ? [`${valueMentions} value indicators detected in your messaging`]
      : ['Add specific ROI, time savings, or revenue impact to strengthen value']
  };
  
  // Confidence & Control Score
  const confidentPatterns = [
    /\b(based on my experience|what i've seen|typically|recommend|suggest|advise)\b/,
    /\b(expert|specialist|professional|solution|help you|work with)\b/,
    /\b(best practice|proven|effective approach|industry standard)\b/
  ];
  
  const needyPatterns = [
    /\b(please|if you could|just|maybe|possibly|hopefully)\b/,
    /\b(i really need|desperate|counting on|would mean a lot)\b/,
    /\b(sorry to bother|sorry for|apologize)\b/
  ];
  
  const confidentCount = confidentPatterns.filter(p => p.test(allUserText)).length;
  const needyCount = needyPatterns.filter(p => p.test(allUserText)).length;

  // Profanity/slur detection — automatically disqualifies confidence as a strength
  const profanityPatterns = [
    /\b(fuck|shit|asshole|bitch|bastard|cunt|dick|prick|twat|wanker|bullshit)\b/i,
    /\b(pussy|nigger|nigga|faggot|retard|spastic|chink|kike|wetback|cracker)\b/i
  ];
  const hasProfanity = profanityPatterns.some(p => p.test(allUserText));

  let confidenceScore = 10;
  let confidenceExplanation = 'Neutral confidence level';

  if (hasProfanity) {
    confidenceScore = 0;
    confidenceExplanation = 'Unprofessional language used - this disqualifies any confidence positioning';
  } else if (needyCount >= 2) {
    confidenceScore = 5;
    confidenceExplanation = 'Signs of neediness detected - avoid phrases like "just" or "hopefully"';
  } else if (confidentCount >= 2) {
    confidenceScore = 20;
    confidenceExplanation = 'Strong expert positioning with confident language';
  } else if (confidentCount >= 1) {
    confidenceScore = 15;
    confidenceExplanation = 'Good confidence but could project more authority';
  }
  
  const confidenceCategoryScore: CategoryScore = {
    score: confidenceScore,
    maxScore: 20,
    explanation: confidenceExplanation,
    specificExamples: confidentCount > 0
      ? [`${confidentCount} confidence indicators vs ${needyCount} neediness indicators`]
      : ['Use more expert positioning: "Based on my experience..." or "What I typically recommend..."']
  };
  
  return {
    discovery: discoveryScore,
    listening: listeningRatioScore,
    objectionHandling: objectionScore,
    valueCommunication: valueScore,
    confidence: confidenceCategoryScore
  };
}

function generateDetailedIssues(transcript: AIMessage[], timeline: ConversationMoment[]): DetailedIssue[] {
  const issues: DetailedIssue[] = [];
  const userMessages = transcript.filter(m => m.role === 'user');
  const assistantMessages = transcript.filter(m => m.role === 'assistant');
  const allUserText = userMessages.map(m => m.content.toLowerCase()).join(' ');
  
  // Check for objections not handled with agreement
  for (let i = 0; i < transcript.length; i++) {
    const msg = transcript[i];
    if (msg.role === 'assistant') {
      const objectionKeywords = /\b(too expensive|the price|costs?|budget|not interested|don't need|already have|think about it|need time|busy|call me back|not looking|we're good|happy with what we have)\b/i;
      
      if (objectionKeywords.test(msg.content)) {
        const nextMsg = transcript[i + 1];
        if (nextMsg?.role === 'user') {
          const userResponse = nextMsg.content;
          const acknowledged = /\b(i understand|that makes sense|you're right|i get it|completely|totally|absolutely|fair enough|i hear you|i see what you mean)\b/i.test(userResponse);
          
          if (!acknowledged) {
            issues.push({
              category: 'Objection Handling',
              moment: `When prospect objected: "${msg.content.substring(0, 60)}${msg.content.length > 60 ? '...' : ''}"`,
              transcriptSnippet: `Prospect: "${msg.content}"\nYou: "${userResponse}"`,
              userResponse: userResponse.substring(0, 80),
              whyItWasWeak: `You jumped straight to addressing the concern without first acknowledging the prospect's position. This creates resistance because they don't feel heard.`,
              betterApproach: 'Lead with agreement: "That makes complete sense" or "I totally get that" - validate their position before addressing it.',
              eliteExample: '"That makes total sense - usually when people say that, it\'s because they\'ve had bad experiences before. Can I ask what happened?"'
            });
          }
        }
      }
    }
  }
  
  // Check for missed buying signals (prospect shows interest, user doesn't advance)
  const buyingSignals = [
    { pattern: /\b(how much|what.*cost|pricing|price|investment)\b/i, signal: 'Asked about pricing', type: 'Closing' },
    { pattern: /\b(when can we|how soon|timeline|get started|implement|set up|onboard)\b/i, signal: 'Showed implementation interest', type: 'Closing' },
    { pattern: /\b(that sounds good|that makes sense|we could use that|interesting|tell me more|worth exploring)\b/i, signal: 'Expressed value recognition', type: 'Closing' },
    { pattern: /\b(sounds like|seems like|looks like|appears like).*\b(could help|would help|might work)\b/i, signal: 'Connected your solution to their need', type: 'Closing' }
  ];
  
  for (let i = 0; i < transcript.length; i++) {
    const msg = transcript[i];
    if (msg.role === 'assistant') {
      for (const { pattern, signal, type } of buyingSignals) {
        if (pattern.test(msg.content)) {
          const nextMsg = transcript[i + 1];
          if (nextMsg?.role === 'user') {
            const movedTowardClose = /\b(schedule|next step|move forward|proceed|close|get started|sign up|book|set up|when works for you|what time|send over|email me|calendar)\b/i.test(nextMsg.content);
            
            if (!movedTowardClose) {
              issues.push({
                category: type,
                moment: `Missed ${signal}`,
                transcriptSnippet: `Prospect: "${msg.content}"\nYou: "${nextMsg.content}"`,
                userResponse: nextMsg.content.substring(0, 80),
                whyItWasWeak: `The prospect gave you a ${signal.toLowerCase()} - this was your cue to move toward next steps. Instead, you continued the conversation without advancing the sale.`,
                betterApproach: 'When you hear buying signals, immediately move toward scheduling or next steps.',
                eliteExample: '"Perfect question - before we get into specifics, when would be a good time for a proper demo? I\'m free Thursday afternoon."'
              });
            }
          }
        }
      }
    }
  }
  
  // Check for talking too much without discovery
  const discoveryQuestions = userMessages.filter(m => 
    /\b(what|how|why|tell me|walk me through|describe|explain|curious about|interested in learning)\b.*\b(you|your|situation|challenge|pain|problem|issue|goal|objective|priority|current process)\b/i.test(m.content)
  );
  
  const discoveryCount = discoveryQuestions.length;
  
  if (discoveryCount === 0 && userMessages.length > 3) {
    const earlyMessages = userMessages.slice(0, 3).map(m => m.content).join('; ').substring(0, 100);
    issues.push({
      category: 'Discovery',
      moment: 'First 3 responses showed no discovery',
      transcriptSnippet: earlyMessages,
      userResponse: earlyMessages,
      whyItWasWeak: 'You started pitching without understanding their situation first. The prospect has no reason to care about your solution until they feel you understand their problem.',
      betterApproach: 'Spend the first 3-4 minutes asking about their current situation, challenges, and goals. Only then mention your solution.',
      eliteExample: '"Before I share what we do, I\'m curious - how are you handling [X] right now? What\'s working and what\'s not working about your current approach?"'
    });
  } else if (discoveryCount === 1 && userMessages.length > 5) {
    issues.push({
      category: 'Discovery',
      moment: 'Only 1 discovery question asked',
      transcriptSnippet: `You asked: "${discoveryQuestions[0]?.content?.substring(0, 60) || 'one question'}"`,
      userResponse: discoveryQuestions[0]?.content?.substring(0, 60) || '',
      whyItWasWeak: 'You asked one question then pivoted to pitching. That\'s not enough to understand their full situation and tailor your approach.',
      betterApproach: 'Ask 3-4 follow-up questions. Go deeper: "Tell me more about that" or "What happens when [X] occurs?"',
      eliteExample: '"Interesting - when you say it\'s frustrating, what specifically is the biggest pain point? How much time is that costing you?"'
    });
  }
  
  // Check for no value articulation
  const valueIndicators = /\b(save|cut|reduce|increase|improve|better|faster|ROI|return|worth|benefit|result|outcome|help you|solve|fix|address)\b.*\b(time|money|cost|revenue|sales|efficiency|problem|issue)\b/i;
  const hasValueCommunication = valueIndicators.test(allUserText);
  
  if (!hasValueCommunication && userMessages.length > 3) {
    const pitchMessage = userMessages.find(m => 
      /\b(we|our|my|product|service|solution|offer|provide|do)\b/i.test(m.content)
    );
    issues.push({
      category: 'Value Communication',
      moment: 'Talked about your solution without connecting to value',
      transcriptSnippet: pitchMessage?.content?.substring(0, 80) || 'General pitch without value',
      userResponse: pitchMessage?.content?.substring(0, 80) || '',
      whyItWasWeak: 'You mentioned what you do, but didn\'t connect it to a specific outcome the prospect cares about. People buy results, not features.',
      betterApproach: 'Every time you mention your solution, immediately follow with "which means..." and connect it to their specific goal.',
      eliteExample: '"What that means for you: instead of spending 2 hours on this daily, you\'d have it done in 20 minutes. That\'s 7 hours back every week."'
    });
  }
  
  // Check for weak closing/no next steps
  const hasClosingAttempt = /\b(schedule|next step|move forward|get started|send|email|follow up|next week|tomorrow|when|time|calendar|book)\b/i.test(allUserText);
  
  if (!hasClosingAttempt && userMessages.length > 4) {
    const lastUserMessage = userMessages[userMessages.length - 1]?.content?.substring(0, 80) || '';
    issues.push({
      category: 'Closing',
      moment: 'Conversation ended without clear next steps',
      transcriptSnippet: lastUserMessage,
      userResponse: lastUserMessage,
      whyItWasWeak: 'You had a conversation but didn\'t move it forward. Without a specific next step (meeting, follow-up, email), this opportunity will likely die.',
      betterApproach: 'Always end with a specific commitment: "When should we schedule a proper walkthrough?" or "I\'ll send you the case study - what\'s your email?"',
      eliteExample: '"Based on what you\'ve shared, this seems worth exploring. How\'s your calendar looking for a 20-minute demo this week?"'
    });
  }
  
  // Check for poor listening (talking more than prospect)
  const userWordCount = userMessages.reduce((acc, m) => acc + m.content.split(/\s+/).length, 0);
  const assistantWordCount = assistantMessages.reduce((acc, m) => acc + m.content.split(/\s+/).length, 0);
  
  if (userWordCount > assistantWordCount * 1.5 && userMessages.length > 3) {
    const longestResponse = userMessages.reduce((max, m) => 
      m.content.length > max.length ? m.content : max, ''
    ).substring(0, 80);
    
    issues.push({
      category: 'Listening',
      moment: 'Talked significantly more than the prospect',
      transcriptSnippet: `You sent ${userWordCount} words vs prospect's ${assistantWordCount} words`,
      userResponse: longestResponse,
      whyItWasWeak: `You talked ${Math.round(userWordCount / (assistantWordCount || 1))}x more than the prospect. They should be talking 70% of the time. When you dominate, they tune out.`,
      betterApproach: 'Ask a question, then be quiet. Let them finish. If they pause, count to 3 before speaking.',
      eliteExample: '"Interesting - tell me more about that." [Then be silent and listen]'
    });
  }
  
  // Check for generic pitch (no personalization to what prospect said)
  const prospectMentions = assistantMessages.map(m => m.content.toLowerCase());
  let missedPersonalization = false;
  
  for (let i = 1; i < userMessages.length; i++) {
    const prevProspectMsg = assistantMessages[i - 1]?.content?.toLowerCase() || '';
    const userMsg = userMessages[i]?.content?.toLowerCase() || '';
    
    // Check if user acknowledged or referenced what prospect just said
    const referenced = /\b(you mentioned|you said|since you|based on what|that makes sense given|given that|regarding your|about your)\b/i.test(userMsg);
    const acknowledged = /\b(i see|interesting|that makes sense|i get it|understood|right|okay|got it)\b/i.test(userMsg);
    
    // If prospect shared something specific and user didn't acknowledge it
    const prospectSharedSpecific = /\b(problem|issue|challenge|frustrated|struggling|need|want|looking for|tried|worked|didn't work)\b/i.test(prevProspectMsg);
    
    if (prospectSharedSpecific && !referenced && !acknowledged) {
      missedPersonalization = true;
    }
  }
  
  if (missedPersonalization && userMessages.length > 3) {
    issues.push({
      category: 'Rapport',
      moment: 'Missed acknowledging prospect\'s specific concerns',
      transcriptSnippet: 'Multiple instances where prospect shared specifics but response was generic',
      userResponse: 'Generic responses without acknowledgment',
      whyItWasWeak: 'The prospect shared specific details, but you responded with generic pitches. This makes them feel unheard and that you\'re just reading from a script.',
      betterApproach: 'Always acknowledge what they just said before moving forward: "That makes sense given what you said about [X]..."',
      eliteExample: '"That makes total sense - you mentioned earlier that [specific thing they said]. Based on that, here\'s how we could help..."'
    });
  }
  
  // Return top 5 most important issues, sorted by impact
  return issues
    .sort((a, b) => {
      // Prioritize by category importance
      const priority: Record<string, number> = { 'Discovery': 1, 'Objection Handling': 2, 'Closing': 3, 'Value Communication': 4, 'Listening': 5, 'Rapport': 6 };
      return (priority[a.category] || 99) - (priority[b.category] || 99);
    })
    .slice(0, 5);
}

function calculateConversationMetrics(
  userMessages: AIMessage[],
  assistantMessages: AIMessage[],
  transcript: AIMessage[]
) {
  const userWordCount = userMessages.reduce((sum, m) => sum + m.content.split(/\s+/).length, 0);
  const assistantWordCount = assistantMessages.reduce((sum, m) => sum + m.content.split(/\s+/).length, 0);
  
  // Interruptions (simplified - when user speaks after short assistant message)
  let interruptions = 0;
  for (let i = 1; i < transcript.length; i++) {
    if (transcript[i].role === 'user' && transcript[i - 1].role === 'assistant') {
      if (transcript[i - 1].content.length < 50) {
        interruptions++;
      }
    }
  }
  
  // Average response length
  const avgUserResponseLength = userMessages.length > 0 
    ? Math.round(userWordCount / userMessages.length) 
    : 0;
  
  return {
    totalUserWords: userWordCount,
    totalAssistantWords: assistantWordCount,
    talkToListenRatio: (userWordCount / (assistantWordCount || 1)).toFixed(1),
    userMessageCount: userMessages.length,
    assistantMessageCount: assistantMessages.length,
    interruptions,
    avgUserResponseLength,
    conversationLength: transcript.length
  };
}

function calculateOverallScore(categoryScores: Record<string, CategoryScore>): number {
  const totalScore = Object.values(categoryScores).reduce((sum, cat) => sum + cat.score, 0);
  const maxScore = Object.values(categoryScores).reduce((sum, cat) => sum + cat.maxScore, 0);
  return Math.round((totalScore / maxScore) * 100);
}

function generateExecutiveSummary(
  score: number,
  categoryScores: Record<string, CategoryScore>,
  metrics: any,
  strongestMoment: ConversationMoment | null,
  weakestMoment: ConversationMoment | null
): string {
  let summary = '';
  
  // Opening based on score
  if (score >= 85) {
    summary = 'Exceptional performance demonstrating elite sales capabilities. ';
  } else if (score >= 70) {
    summary = 'Strong performance with solid fundamentals and clear growth trajectory. ';
  } else if (score >= 55) {
    summary = 'Developing competency with foundational skills in place. ';
  } else {
    summary = 'Significant opportunity for improvement in core sales fundamentals. ';
  }
  
  // Add specific insights
  const topCategory = Object.entries(categoryScores)
    .sort((a, b) => b[1].score - a[1].score)[0];
  const bottomCategory = Object.entries(categoryScores)
    .sort((a, b) => a[1].score - b[1].score)[0];
  
  summary += `Your strongest area was ${topCategory[0]} (${topCategory[1].score}/${topCategory[1].maxScore} points). `;
  summary += `Focus on improving ${bottomCategory[0]} for biggest impact. `;
  
  if (strongestMoment) {
    summary += `Your strongest moment was when you ${strongestMoment.type === 'discovery' ? 'asked great discovery questions' : strongestMoment.type === 'value_prop' ? 'communicated value effectively' : 'handled the conversation well'}. `;
  }
  
  if (weakestMoment) {
    summary += `The biggest missed opportunity was ${weakestMoment.type === 'missed_signal' ? 'not capitalizing on a buying signal' : weakestMoment.type === 'objection' ? 'not properly handling an objection with agreement' : 'a moment that could have been handled better'}. `;
  }
  
  summary += `Talk-to-listen ratio: ${metrics.talkToListenRatio}:1 (target: 0.3:1).`;
  
  return summary;
}

function generateCoachingInsights(
  categoryScores: Record<string, CategoryScore>,
  detailedIssues: DetailedIssue[]
): string[] {
  const insights: string[] = [];
  
  // Add insights based on category scores
  if (categoryScores.discovery.score < 10) {
    insights.push('Discovery Gap: You\'re pitching without understanding. Spend 3-4 minutes asking about their situation before presenting solutions. Prospects buy when they feel understood.');
  }
  
  if (categoryScores.listening.score < 15) {
    insights.push('Listening Ratio: You talked too much. Remember: if you\'re talking more than 30% of the time, you\'re selling wrong. Ask questions, then be quiet.');
  }
  
  if (categoryScores.objectionHandling.score < 15) {
    insights.push('Objection Pattern: You\'re fighting objections instead of agreeing with them. When someone says "too expensive," say "That makes sense" first. Agreement kills resistance.');
  }
  
  if (categoryScores.valueCommunication.score < 10) {
    insights.push('Value Vacuum: You\'re selling features, not outcomes. Connect everything to ROI, time saved, or revenue gained. That\'s what closes deals.');
  }
  
  if (categoryScores.confidence.score < 15) {
    insights.push('Confidence Deficit: You sound uncertain. Remove words like "just," "maybe," "hopefully." Position yourself as the expert with valuable solutions.');
  }
  
  return insights.length > 0 ? insights : ['Good balance across all categories. Focus on consistency and refinement.'];
}

function generateNextSessionFocus(
  categoryScores: Record<string, CategoryScore>,
  detailedIssues: DetailedIssue[]
): string[] {
  const focus: string[] = [];
  
  // Priority based on lowest scores
  const sortedCategories = Object.entries(categoryScores)
    .sort((a, b) => (a[1].score / a[1].maxScore) - (b[1].score / b[1].maxScore));
  
  const lowest = sortedCategories[0];
  if (lowest) {
    const categoryName = lowest[0];
    const percentage = Math.round((lowest[1].score / lowest[1].maxScore) * 100);
    
    if (percentage < 50) {
      focus.push(`${categoryName}: Your biggest opportunity (${percentage}%). Practice specific exercises for this area.`);
    }
  }
  
  // Add specific focus based on issues
  const issueTypes = Array.from(new Set(detailedIssues.map(i => i.category)));
  for (const type of issueTypes.slice(0, 2)) {
    focus.push(`${type}: Work on the specific scenarios where this issue occurred.`);
  }
  
  return focus.length > 0 ? focus : ['Maintain your strengths and add subtle refinements to reach elite level.'];
}

// Generate strengths, weaknesses, suggestions from new analysis data for backward compatibility
function generateLegacyFeedback(
  categoryScores: Record<string, CategoryScore>,
  detailedIssues: DetailedIssue[],
  metrics: Record<string, number | string>
) {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];
  const missedOpportunities: string[] = [];

  // Helper to format category names
  const formatCategory = (name: string) => {
    return name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
  };

  // Get category percentages for context
  const categoryPercentages: Record<string, number> = {};
  for (const [name, data] of Object.entries(categoryScores)) {
    categoryPercentages[name] = Math.round((data.score / data.maxScore) * 100);
  }

  // Determine which categories have issues (weaknesses) — they cannot also be strengths
  const issueCategoryNames = new Set(
    detailedIssues.map(i => {
      // Normalize issue category names to match categoryScores keys
      const map: Record<string, string> = {
        'Objection Handling': 'objectionHandling',
        'Discovery': 'discovery',
        'Closing': 'closing',
        'Value Communication': 'valueCommunication',
        'Listening': 'listening',
        'Rapport': 'rapport'
      };
      return map[i.category] || i.category;
    })
  );

  // Generate personalized strengths based on what they actually did well
  // Exclude any category that also has detailed issues (would create contradictions)
  const topCategories = Object.entries(categoryPercentages)
    .filter(([name, pct]) => pct >= 60 && !issueCategoryNames.has(name))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  
  // Calculate actual ratio for display — metrics.talkToListenRatio = userWords/assistantWords
  const ratioNum = parseFloat(String(metrics.talkToListenRatio)) || 1.0;
  // prospectMultiplier: how many times more the prospect talked vs the salesperson
  const prospectMultiplier = ratioNum > 0 ? Math.round(1 / ratioNum) : 1;
  
  for (const [name, pct] of topCategories) {
    // Create specific, personalized strength messages with personality
    if (name === 'listening' && pct >= 60) {
      if (ratioNum <= 0.43) {
        // salesperson < 30% of words — excellent
        strengths.push(`Great listening - you let the prospect do ${prospectMultiplier}x more talking than you. That's the secret to understanding their real needs.`);
      } else {
        strengths.push(`You made space for the prospect to share - they talked more than you, which is the right direction.`);
      }
    } else if (name === 'objectionHandling' && pct >= 60) {
      // Only emit this strength if objections actually occurred (score > neutral 50%)
      // pct >= 60 with neutral score (10/20=50%) won't reach here due to >= 60 threshold
      strengths.push(`You handled pushback like a pro. When the prospect objected, you didn't argue - you acknowledged first. That's how you turn resistance into trust.`);
    } else if (name === 'discovery' && pct >= 50) {
      const dq = Number(metrics.discoveryQuestions) || 0;
      if (dq >= 3) {
        strengths.push(`You asked ${dq} solid discovery questions before pitching. That's how you tailor your approach instead of spray-and-praying.`);
      } else {
        strengths.push(`You took time to understand their situation before jumping into your pitch. That's the mark of a consultative seller.`);
      }
    } else if (name === 'valueCommunication' && pct >= 50) {
      strengths.push(`You didn't just list features - you connected your solution to outcomes they actually care about. People buy results, not specs.`);
    } else if (name === 'closing' && pct >= 50) {
      strengths.push(`You kept momentum alive by moving toward clear next steps. The worst thing in sales is a conversation that goes nowhere.`);
    } else if (name === 'rapport' && pct >= 50) {
      strengths.push(`You made it feel like a real conversation, not a sales pitch. Referencing what they said shows you were actually listening.`);
    } else if (name === 'confidence' && pct >= 50) {
      strengths.push(`You came across confident and credible. Direct, clear language - you sounded like someone worth buying from.`);
    } else {
      // Fallback for any other high-performing category
      if (pct >= 80) {
        strengths.push(`${formatCategory(name)}: This was a standout moment - you showed real skill here`);
      } else if (pct >= 60) {
        strengths.push(`${formatCategory(name)}: Solid work here - this is becoming a strength`);
      }
    }
  }

  // Generate weaknesses from detailed issues with context
  const issueCategories = new Set(detailedIssues.map(i => i.category));
  
  for (const issue of detailedIssues.slice(0, 4)) {
    const categoryName = formatCategory(issue.category);
    const percentage = categoryPercentages[issue.category] || 0;
    
    // Create contextual weakness based on the issue
    switch (issue.category) {
      case 'Objection Handling':
        if (percentage < 30) {
          weaknesses.push(`Objection Handling: Missed opportunities to agree first before responding (${percentage}%)`);
        } else {
          weaknesses.push(`Objection Handling: Could strengthen by leading with acknowledgment (${percentage}%)`);
        }
        break;
        
      case 'Discovery':
        if (percentage === 0) {
          weaknesses.push(`Discovery: Started pitching without understanding their situation first`);
        } else if (percentage < 30) {
          weaknesses.push(`Discovery: Not enough depth - asked ${percentage < 20 ? 'too few' : 'only surface-level'} questions (${percentage}%)`);
        } else {
          weaknesses.push(`Discovery: Could dig deeper with follow-up questions (${percentage}%)`);
        }
        break;
        
      case 'Closing':
        if (!weaknesses.some(w => w.includes('Closing'))) {
          weaknesses.push(`Closing: Conversation ended without clear next steps or commitment`);
        }
        break;
        
      case 'Value Communication':
        weaknesses.push(`Value Communication: Focused on features rather than outcomes they care about`);
        break;
        
      case 'Listening':
        weaknesses.push(`Listening: Talk-to-listen ratio was off - prospect should speak 70% of the time`);
        break;
        
      case 'Rapport':
        weaknesses.push(`Rapport: Responses felt generic rather than tailored to what they shared`);
        break;
        
      default:
        weaknesses.push(`${categoryName}: ${percentage < 40 ? 'Significant' : 'Moderate'} room for improvement (${percentage}%)`);
    }
    
    // Add the specific why-it-was-weak as a missed opportunity
    if (issue.whyItWasWeak) {
      // Clean up the text - no truncation
      const cleanWhy = issue.whyItWasWeak
        .replace(/You responded/g, 'You responded')
        .replace(/This makes prospects/g, 'This makes prospects')
        .replace(/you're selling/g, 'you are selling')
        .trim();
      if (!missedOpportunities.includes(cleanWhy)) {
        missedOpportunities.push(cleanWhy);
      }
    }
    
    // Add the specific suggestion - full text
    if (issue.betterApproach) {
      const cleanSuggestion = issue.betterApproach.trim();
      if (!suggestions.includes(cleanSuggestion)) {
        suggestions.push(cleanSuggestion);
      }
    }
  }

  // Add metrics-based feedback for gaps not covered by issues
  const discoveryQuestions = Number(metrics.discoveryQuestions);
  const ratio = parseFloat(String(metrics.talkToListenRatio));
  
  if (!issueCategories.has('Discovery')) {
    if (discoveryQuestions >= 3) {
      strengths.push('Asking good discovery questions to understand their situation');
    } else if (discoveryQuestions === 0 && !weaknesses.some(w => w.includes('Discovery'))) {
      weaknesses.push('Discovery: No qualifying questions asked - jumped straight to pitch');
      suggestions.push('Start with 3-4 questions about their current process before mentioning your solution');
    }
  }
  
  if (!issueCategories.has('Listening')) {
    // metrics.talkToListenRatio = userWords/assistantWords (salesperson/prospect)
    // ratio < 0.43 means salesperson spoke < 30% — excellent
    // ratio > 1.0 means salesperson spoke more than prospect — bad
    if (ratio < 0.43 && !strengths.some(s => s.toLowerCase().includes('listen'))) {
      strengths.push('Letting the prospect lead the conversation - excellent listening ratio');
    } else if (ratio > 1.0 && !weaknesses.some(w => w.includes('Listening'))) {
      weaknesses.push('Listening: You dominated the conversation - prospect should talk more');
      suggestions.push('Ask a question, then count to 3 before speaking. Let them finish their thoughts.');
    }
  }

  return {
    strengths: strengths.length > 0 ? strengths.slice(0, 5) : ['Good effort in this session'],
    weaknesses: weaknesses.length > 0 ? weaknesses.slice(0, 6) : ['No major weaknesses detected'],
    suggestions: suggestions.length > 0 ? suggestions.slice(0, 5) : ['Keep practicing to improve'],
    missedOpportunities: missedOpportunities.length > 0 ? missedOpportunities.slice(0, 5) : ['None identified']
  };
}

// Legacy functions for backward compatibility
function analyzeTranscriptLegacy(transcript: AIMessage[]) {
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
