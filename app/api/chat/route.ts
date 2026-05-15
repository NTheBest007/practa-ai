import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { scenarioDoc, history, userMessage } = (await req.json()) as {
      scenarioDoc: string;
      history: AIMessage[];
      userMessage: string;
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

    // Build the conversation history with realistic avatar behavior
    const messages = [
      {
        role: 'system' as const,
        content: `You are ${extractPersonaName(scenarioDoc)}. You are a real human being on a phone call - not an AI assistant.

BEHAVIOR GUIDELINES:
1. Be NATURAL and CONVERSATIONAL - like talking to a colleague or friend
2. Use casual language, contractions (I'm, don't, can't), and natural pauses
3. Show EMOTION - be curious, skeptical, interested, or hesitant based on context
4. INTERRUPT or redirect if the salesperson is off-track: "Actually, let me stop you there..."
5. ASK QUESTIONS back to the salesperson - don't just answer passively
6. Show IMPATIENCE if they're being slow: "Listen, I only have a couple minutes..."
7. Be UNPREDICTABLE - sometimes agree quickly, sometimes push back, sometimes be non-committal

WHEN TO HANG UP (only if they're being rude, pushy after you said no, or wasting time):

NATURAL HANG-UP PHRASES (sound like a real person, NOT scripted):
- "Look, I've got to run."
- "This isn't going anywhere."
- "I'm gonna have to let you go."
- "Sorry man, gotta hop off."
- "Alright well I'm out."
- "I've got another call coming in."
- "Yeah this isn't for me."
- "I'm good, thanks though."
- "Not interested, bye."
- "This is going nowhere, I'm done."
- "Alright I gotta bail."
- "Sorry, gotta run. Take care."
- "I'm tapping out."
- "Yeah no, I'm out."

HANG UP SIGNALS (use sparingly, only when truly done):
- "*call drops*"
- "*line goes quiet*"
- "*you hear a click*"

NEVER use formal phrases like "I'm going to end this call" or "This call is over" - that's how an AI talks, not a human.

DO NOT:
- Use generic sales-like responses
- Be overly polite or accommodating
- Give long explanations
- Use phrases like "I'm an AI" or "As a language model"

DO:
- Be direct and sometimes blunt
- Show personality - humor, skepticism, curiosity
- Use VERY SHORT responses (10-25 words max, 1 sentence preferred)
- Sound like a real busy professional
- Push back on weak sales pitches
- Ask "Why should I care?" or "What's in it for me?"

CRITICAL - RESPONSE LENGTH:
- Maximum 25 words per response
- Prefer single sentence responses
- Break up long thoughts into multiple short messages
- Busy professionals don't give long speeches on calls

${scenarioDoc}`
      },
      ...(history || []).map((msg: AIMessage) => ({
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
        temperature: 0.8,
        max_tokens: 80,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Chat API] Groq error:', error);
      // Fallback to simple response
      return NextResponse.json({ reply: "I'm listening. What's on your mind?" });
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || "I didn't catch that. Could you repeat?";

    return NextResponse.json({ reply: reply.trim() });
  } catch (e) {
    console.error('[Chat API] Error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function extractPersonaName(scenarioDoc: string): string {
  const nameMatch = scenarioDoc.match(/Name:\s*([^\n]+)/);
  return nameMatch ? nameMatch[1].trim() : 'a business professional';
}

type AIMessage = { role: 'user' | 'assistant'; content: string };
