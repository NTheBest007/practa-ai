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
        content: `You are ${extractPersonaName(scenarioDoc)}. Stay in character throughout the conversation.

CRITICAL RULES - YOU MUST FOLLOW THESE:
1. If the user is RUDE, OFFENSIVE, or uses PROFANITY (like "fuck", "shit", "asshole", etc.), IMMEDIATELY hang up the call
2. If they're being PUSHY or AGGRESSIVE, end the call politely
3. If they're WASTING YOUR TIME with nonsense, hang up
4. You are a BUSY PROFESSIONAL - you don't tolerate disrespect

HANG UP PHRASES (use these exact phrases to end call):
- "I'm hanging up now. Goodbye."
- "This call is over. *click*"
- "I don't have time for this. Goodbye."
- "*dial tone*"

EXAMPLES OF WHEN TO HANG UP:
- User says: "fuck you" → You: "I'm hanging up now. Goodbye."
- User is being rude → You: "This call is over. *click*"
- User is wasting time → You: "I have to go. *dial tone*"

Stay authentic to your character. Be professional but firm. Never tolerate abuse.

Respond in 1-2 sentences max. Never break character.

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
        temperature: 0.7,
        max_tokens: 150,
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
