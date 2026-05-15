import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface VoiceMapping {
  [key: string]: string;
}

// Map avatar seeds to appropriate Google voices
const VOICE_MAPPING: VoiceMapping = {
  'sarah': 'en-US-Wavenet-F', // Female professional
  'michael': 'en-US-Wavenet-D', // Male professional  
  'emily': 'en-US-Wavenet-C', // Female friendly
  'default': 'en-US-Wavenet-A' // Neutral default
};

export async function POST(req: Request) {
  try {
    const { text, voice = 'alloy', avatarSeed = 'default' } = await req.json();
    
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // Check if Google API key is available
    const apiKey = process.env.GOOGLE_TTS_API_KEY;
    if (!apiKey) {
      console.error('Google TTS API key not found');
      return NextResponse.json({ error: 'Coming soon', details: 'Voice synthesis will be available soon' }, { status: 503 });
    }

    // Select voice based on avatar
    let selectedVoice = VOICE_MAPPING[avatarSeed] || VOICE_MAPPING.default;
    
    // Map common voice names to Google voices
    const voiceMap: { [key: string]: string } = {
      'alloy': 'en-US-Wavenet-A',
      'echo': 'en-US-Wavenet-B', 
      'fable': 'en-US-Wavenet-C',
      'onyx': 'en-US-Wavenet-D',
      'nova': 'en-US-Wavenet-E',
      'shimmer': 'en-US-Wavenet-F'
    };
    
    if (voiceMap[voice]) {
      selectedVoice = voiceMap[voice];
    }

    // Call Google Cloud Text-to-Speech API
    const ttsResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'en-US',
            name: selectedVoice,
            ssmlGender: selectedVoice.includes('F') ? 'FEMALE' : 'MALE'
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0.0,
            volumeGainDb: 0.0
          }
        }),
      }
    );
    
    if (!ttsResponse.ok) {
      const error = await ttsResponse.text();
      console.error('Google TTS API error:', error);
      return NextResponse.json({ error: 'Coming soon', details: 'Voice synthesis temporarily unavailable' }, { status: 503 });
    }
    
    const { audioContent } = await ttsResponse.json();
    
    return NextResponse.json({ 
      audio: `data:audio/mp3;base64,${audioContent}`,
      format: 'mp3',
      voice: selectedVoice
    });
  } catch (error) {
    console.error('Google TTS error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
