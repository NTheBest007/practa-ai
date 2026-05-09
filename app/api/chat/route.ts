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

    // Build the conversation history
    const messages = [
      {
        role: 'system' as const,
        content: `You are ${extractPersonaName(scenarioDoc)}. Stay in character throughout the conversation. Respond naturally as this person would, not as an AI assistant. Keep responses concise (1-3 sentences max). ${scenarioDoc}`
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
