import { NextResponse } from 'next/server';
import { getCambVoice } from '@/lib/voice-utils';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { text, voice = 'alloy', avatarUrl } = await req.json();
    
    // Use avatar-based voice selection if avatarUrl provided
    const selectedVoice = avatarUrl ? getCambVoice(avatarUrl) : 7299;
    
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const apiKey = process.env.CAMB_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'CAMB.AI API key not configured' }, { status: 500 });
    }

    // Call CAMB.AI TTS API
    const ttsResponse = await fetch('https://studio.camb.ai/api/tts', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        voice_id: selectedVoice,
        language: 1, // English
        timeout: 300,
      }),
    });
    
    if (!ttsResponse.ok) {
      const error = await ttsResponse.text();
      console.error('CAMB.AI API error:', error);
      return NextResponse.json({ 
        error: `CAMB.AI API error: ${ttsResponse.status} - ${error.substring(0, 200)}` 
      }, { status: 500 });
    }
    
    const data = await ttsResponse.json();
    
    // CAMB returns a task ID, we need to poll for the result
    if (data.task_id) {
      // Poll for result (max 30 seconds)
      const audioUrl = await pollCambResult(data.task_id, apiKey);
      if (audioUrl) {
        // Fetch the audio file
        const audioResponse = await fetch(audioUrl);
        const audioBuffer = await audioResponse.arrayBuffer();
        const base64Audio = Buffer.from(audioBuffer).toString('base64');
        
        return NextResponse.json({ 
          audio: `data:audio/mp3;base64,${base64Audio}`,
          format: 'mp3',
          voice: voice
        });
      }
    }
    
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
  } catch (error) {
    console.error('CAMB.AI TTS error:', error);
    return NextResponse.json({ 
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}

async function pollCambResult(taskId: string, apiKey: string, maxAttempts = 30): Promise<string | null> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    const response = await fetch(`https://studio.camb.ai/api/tts/${taskId}`, {
      headers: {
        'x-api-key': apiKey,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.url) {
        return data.url;
      }
      if (data.status === 'failed') {
        return null;
      }
    }
  }
  return null;
}
