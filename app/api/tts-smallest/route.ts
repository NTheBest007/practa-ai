import { NextResponse } from 'next/server';
import { getSmallestVoice } from '@/lib/voice-utils';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { text, voice = 'alloy', avatarUrl } = await req.json();
    
    // Use avatar-based voice selection if avatarUrl provided
    const selectedVoice = avatarUrl ? getSmallestVoice(avatarUrl) : 'emily';
    
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const apiKey = process.env.SMALLEST_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Coming soon', details: 'Voice synthesis will be available soon' }, { status: 503 });
    }

    // Call Smallest.ai Lightning API
    const ttsResponse = await fetch('https://api.smallest.ai/api/v1/lightning', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        voice_id: selectedVoice,
        speed: 1.0,
      }),
    });
    
    if (!ttsResponse.ok) {
      const error = await ttsResponse.text();
      console.error('Smallest.ai API error:', error);
      return NextResponse.json({ error: 'Coming soon', details: 'Voice synthesis temporarily unavailable' }, { status: 503 });
    }
    
    // Smallest returns audio directly
    const audioBuffer = await ttsResponse.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    
    return NextResponse.json({ 
      audio: `data:audio/wav;base64,${base64Audio}`,
      format: 'wav',
      voice: voice
    });
  } catch (error) {
    console.error('Smallest.ai TTS error:', error);
    return NextResponse.json({ 
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}
