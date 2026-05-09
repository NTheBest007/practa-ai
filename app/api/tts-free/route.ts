import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { text, voice = 'alloy' } = await req.json();
    
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // For free TTS, we'll use a simple approach
    // The actual TTS will be handled client-side using Web Speech API
    // This endpoint just validates the request and returns the text
    
    return NextResponse.json({ 
      text: text,
      voice: voice,
      useWebSpeech: true,
      message: 'Use browser Web Speech API for free TTS'
    });
  } catch (error) {
    console.error('Free TTS error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
