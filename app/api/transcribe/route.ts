import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { audio } = await req.json();
    
    if (!audio) {
      return NextResponse.json({ error: 'No audio data provided' }, { status: 400 });
    }

    console.log('[Transcribe] Received audio, length:', audio.length);

    // Try AssemblyAI first
    const assemblyKey = process.env.ASSEMBLY_API;
    if (assemblyKey) {
      console.log('[Transcribe] Trying AssemblyAI...');
      try {
        // Upload audio
        const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
          method: 'POST',
          headers: {
            'Authorization': assemblyKey,
          },
          body: Buffer.from(audio, 'base64'),
        });
        
        if (uploadRes.ok) {
          const { upload_url } = await uploadRes.json();
          
          // Start transcription
          const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
            method: 'POST',
            headers: {
              'Authorization': assemblyKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              audio_url: upload_url,
              language_code: 'en',
            }),
          });
          
          if (transcriptRes.ok) {
            const { id } = await transcriptRes.json();
            
            // Poll for completion
            let attempts = 0;
            while (attempts < 30) {
              await new Promise(r => setTimeout(r, 1000));
              const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
                headers: { 'Authorization': assemblyKey },
              });
              const pollData = await pollRes.json();
              
              if (pollData.status === 'completed') {
                console.log('[Transcribe] AssemblyAI success:', pollData.text);
                return NextResponse.json({ text: pollData.text });
              }
              if (pollData.status === 'error') {
                throw new Error(pollData.error);
              }
              attempts++;
            }
          }
        }
      } catch (err) {
        console.error('[Transcribe] AssemblyAI failed:', err);
      }
    }

    // Fallback to Deepgram
    const deepgramKey = process.env.DEEPGRAM_API;
    if (deepgramKey) {
      console.log('[Transcribe] Trying Deepgram...');
      try {
        const deepgramRes = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=en', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${deepgramKey}`,
            'Content-Type': 'audio/webm',
          },
          body: Buffer.from(audio, 'base64'),
        });
        
        if (deepgramRes.ok) {
          const data = await deepgramRes.json();
          const text = data.results?.channels?.[0]?.alternatives?.[0]?.transcript;
          if (text) {
            console.log('[Transcribe] Deepgram success:', text);
            return NextResponse.json({ text });
          }
        }
      } catch (err) {
        console.error('[Transcribe] Deepgram failed:', err);
      }
    }

    return NextResponse.json({ error: 'All transcription providers failed' }, { status: 500 });
  } catch (error) {
    console.error('[Transcribe] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
