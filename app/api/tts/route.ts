import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { text, voice = 'alloy' } = await req.json();
    
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // Check if OpenAI API key is available
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OpenAI API key not found in environment variables');
      return NextResponse.json({ error: 'Coming soon', details: 'Voice synthesis will be available soon' }, { status: 503 });
    }

    // Call OpenAI TTS API
    const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice, // alloy, echo, fable, onyx, nova, shimmer
        response_format: 'mp3',
      }),
    });
    
    if (!ttsResponse.ok) {
      const error = await ttsResponse.text();
      console.error('TTS API error:', error);
      return NextResponse.json({ error: 'Coming soon', details: 'Voice synthesis temporarily unavailable' }, { status: 503 });
    }
    
    const audioBuffer = await ttsResponse.arrayBuffer();
    
    // Return as base64 for client-side playback
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    
    return NextResponse.json({ 
      audio: `data:audio/mp3;base64,${base64Audio}`,
      format: 'mp3'
    });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
