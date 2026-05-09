import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { conversation, scenarioDoc } = await req.json();

    if (!conversation || conversation.length === 0) {
      return NextResponse.json(
        { error: 'No conversation provided' },
        { status: 400 }
      );
    }

    const groqKey = process.env.GROQ_API;
    if (!groqKey) {
      return NextResponse.json(
        { error: 'GROQ_API not configured' },
        { status: 500 }
      );
    }

    // Build coaching prompt
    const coachingPrompt = `You are a sales coach watching a live conversation. Analyze the last exchange and provide coaching advice.

CONVERSATION TO ANALYZE:
${conversation.map((m: {role: string, content: string}) => `${m.role}: ${m.content}`).join('\n')}

${scenarioDoc ? `\nSCENARIO CONTEXT:\n${scenarioDoc}` : ''}

Provide coaching advice as a JSON object with this exact structure:
{
  "tips": [
    {
      "message": "Your short actionable tip here (max 15 words)",
      "category": "rapport|discovery|objection|closing|delivery",
      "priority": "high|medium|low"
    }
  ],
  "current_stage": "Current conversation stage",
  "next_step": "What to do next",
  "score_this_exchange": 75
}

Respond with ONLY the JSON object, no markdown or explanations.`;

    // Call Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a sales coach. Provide concise actionable advice.' },
          { role: 'user', content: coachingPrompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Coach API] Groq error:', error);
      return NextResponse.json(
        { error: 'Coaching service unavailable' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Coach API] No JSON found in response:', content);
      return NextResponse.json(
        { error: 'Invalid coaching response' },
        { status: 500 }
      );
    }

    const coachingData = JSON.parse(jsonMatch[0]);
    
    return NextResponse.json(coachingData);
  } catch (error) {
    console.error('[Coach API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
