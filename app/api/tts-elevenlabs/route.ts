import { NextResponse } from 'next/server';
import { getElevenLabsVoice, extractAvatarSeed } from '@/lib/voice-utils';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    console.log('[ElevenLabs API] Request received');
    
    const { text, voice = 'alloy', avatarSeed = 'default', avatarUrl } = await req.json();
    console.log('[ElevenLabs API] Request body:', { text: text?.substring(0, 50), voice, avatarUrl: avatarUrl?.substring(0, 30) });
    
    if (!text) {
      console.error('[ElevenLabs API] No text provided');
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // Check if ElevenLabs API key is available
    const apiKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API;
    console.log('[ElevenLabs API] API Key present:', !!apiKey, 'Length:', apiKey?.length);
    
    if (!apiKey) {
      console.error('[ElevenLabs API] API key not found in environment');
      console.error('[ElevenLabs API] Checked: ELEVENLABS_API_KEY, ELEVENLABS_API');
      return NextResponse.json({ 
        error: 'ElevenLabs TTS unavailable - API key not configured',
        details: 'Add ELEVENLABS_API or ELEVENLABS_API_KEY to .env.local'
      }, { status: 500 });
    }

    // Select voice based on avatar - use new avatar-based selection
    let selectedVoice = avatarUrl 
      ? getElevenLabsVoice(avatarUrl) 
      : getElevenLabsVoice(`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`);
    
    // Map common voice names to ElevenLabs voice IDs
    const voiceMap: { [key: string]: string } = {
      'alloy': 'Xb7hH8MSUJpSbSDYk0k2', // Sarah
      'echo': 'pNInz6obpgDQGcFmaJgB', // Adam
      'fable': 'XB0fDUnXU5powFXDhCwa', // Bella
      'onyx': 'pNInz6obpgDQGcFmaJgB', // Adam (male)
      'nova': 'Xb7hH8MSUJpSbSDYk0k2', // Sarah (female)
      'shimmer': 'XB0fDUnXU5powFXDhCwa' // Bella (female)
    };
    
    // Override with specific voice if requested (not avatar-based)
    if (voiceMap[voice] && !avatarUrl) {
      selectedVoice = voiceMap[voice];
    }

    // Call ElevenLabs API
    console.log('[ElevenLabs API] Calling ElevenLabs with voice:', selectedVoice);
    
    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true
          }
        }),
      }
    );
    
    console.log('[ElevenLabs API] Response status:', ttsResponse.status);
    
    if (!ttsResponse.ok) {
      const error = await ttsResponse.text();
      console.error('[ElevenLabs API] Error response:', error);
      return NextResponse.json({ 
        error: `ElevenLabs API error: ${ttsResponse.status}`,
        details: error.substring(0, 500)
      }, { status: 500 });
    }
    
    console.log('[ElevenLabs API] Success - converting audio');
    
    const audioBuffer = await ttsResponse.arrayBuffer();
    console.log('[ElevenLabs API] Audio received, size:', audioBuffer.byteLength);
    
    // Return as base64 for client-side playback
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    console.log('[ElevenLabs API] Converted to base64, length:', base64Audio.length);
    
    return NextResponse.json({ 
      audio: `data:audio/mpeg;base64,${base64Audio}`,
      format: 'mpeg',
      voice: selectedVoice
    });
  } catch (error) {
    console.error('[ElevenLabs API] Unhandled error:', error);
    return NextResponse.json({ 
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
