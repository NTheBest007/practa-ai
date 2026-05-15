import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { text, voice = 'alloy' } = await req.json();
    
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // Free TTS is not available - voice synthesis coming soon
    return NextResponse.json({ error: 'Coming soon', details: 'Voice synthesis will be available soon' }, { status: 503 });
  } catch (error) {
    console.error('Free TTS error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
