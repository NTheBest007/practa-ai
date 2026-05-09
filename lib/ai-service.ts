/**
 * Unified AI Service
 * Provides consistent API calls with fallback chains for:
 * - Chat/Completion (Gemini → OpenRouter → Groq)
 * - Text-to-Speech (ElevenLabs → Smallest → CAMB)
 * - Speech-to-Text (AssemblyAI → Deepgram)
 * - Real-time Coaching (parallel, non-blocking)
 */

import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CoachingTip {
  id: string;
  suggestion: string; // 1 sentence max
  category: 'rapport' | 'discovery' | 'objection' | 'closing' | 'delivery';
  priority: 'high' | 'medium' | 'low';
  timestamp: number;
}

export interface TTSOptions {
  text: string;
  voice?: string;
  avatarUrl?: string;
  provider?: 'elevenlabs' | 'smallest' | 'camb' | 'auto';
}

export interface STTOptions {
  audio: string; // base64
  provider?: 'assemblyai' | 'deepgram' | 'auto';
}

// ============================================
// UNIFIED CHAT API - sendMessageToAI()
// Fallback: Gemini → OpenRouter → Groq
// ============================================
export async function sendMessageToAI(
  messages: ChatMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    onProviderChange?: (provider: string) => void;
  }
): Promise<{ text: string; provider: string; success: boolean }> {
  const { temperature = 0.8, maxTokens = 500 } = options || {};
  
  // Try providers in order
  const providers = [
    { name: 'Gemini', fn: () => callGeminiAPI(messages, temperature, maxTokens) },
    { name: 'OpenRouter', fn: () => callOpenRouterAPI(messages, temperature, maxTokens) },
    { name: 'Groq', fn: () => callGroqAPI(messages, temperature, maxTokens) },
  ];

  let lastError: string = '';
  
  for (const provider of providers) {
    try {
      console.log(`[AI Chat] Trying ${provider.name}...`);
      options?.onProviderChange?.(provider.name);
      
      const result = await provider.fn();
      console.log(`[AI Chat] ${provider.name} success`);
      
      return { text: result, provider: provider.name, success: true };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.error(`[AI Chat] ${provider.name} failed:`, lastError);
      continue;
    }
  }
  
  // All failed
  console.error('[AI Chat] All providers failed');
  toast.error(`AI unavailable: ${lastError.substring(0, 100)}`);
  
  return { 
    text: "I'm sorry, I'm having trouble connecting right now. Could you repeat that?", 
    provider: 'none', 
    success: false 
  };
}

// Gemini API
async function callGeminiAPI(
  messages: ChatMessage[],
  temperature: number,
  maxTokens: number
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLESTUDIO_API || 
                 process.env.GOOGLESTUDIO_API;
  
  if (!apiKey) throw new Error('GOOGLESTUDIO_API not configured');

  const systemMsg = messages.find(m => m.role === 'system');
  const userMsgs = messages.filter(m => m.role !== 'system');
  
  const contents = userMsgs.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: systemMsg ? { parts: [{ text: systemMsg.content }] } : undefined,
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// OpenRouter API
async function callOpenRouterAPI(
  messages: ChatMessage[],
  temperature: number,
  maxTokens: number
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API || 
                 process.env.OPENROUTER_API;
  
  if (!apiKey) throw new Error('OPENROUTER_API not configured');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://practa.ai',
      'X-Title': 'Practa AI Sales Training',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct',
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// Groq API
async function callGroqAPI(
  messages: ChatMessage[],
  temperature: number,
  maxTokens: number
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API || 
                 process.env.GROQ_API;
  
  if (!apiKey) throw new Error('GROQ_API not configured');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ============================================
// TEXT-TO-SPEECH - generateSpeech()
// Fallback: ElevenLabs → Smallest → CAMB
// ============================================
export async function generateSpeech(
  options: TTSOptions
): Promise<{ audioUrl: string; provider: string; success: boolean }> {
  const { text, voice = 'alloy', avatarUrl, provider = 'auto' } = options;
  
  if (!text.trim()) {
    throw new Error('No text provided for speech generation');
  }

  // If specific provider requested, try only that
  if (provider !== 'auto') {
    try {
      const result = await tryTTSProvider(provider, text, voice, avatarUrl);
      return { audioUrl: result, provider, success: true };
    } catch (error) {
      console.error(`[TTS] ${provider} failed:`, error);
      throw error;
    }
  }

  // Auto mode: try all providers in priority order (OpenAI removed - no API key)
  const providers: ('elevenlabs' | 'smallest' | 'camb')[] = 
    ['elevenlabs', 'smallest', 'camb'];
  
  let lastError: string = '';
  
  for (const prov of providers) {
    try {
      console.log(`[TTS] Trying ${prov}...`);
      const result = await tryTTSProvider(prov, text, voice, avatarUrl);
      console.log(`[TTS] ${prov} success`);
      toast.success(`${prov} voice active`, { duration: 1500 });
      return { audioUrl: result, provider: prov, success: true };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.error(`[TTS] ${prov} failed:`, lastError);
      continue;
    }
  }
  
  console.error('[TTS] All providers failed');
  toast.error('Voice synthesis unavailable. Using browser fallback.');
  return { audioUrl: '', provider: 'none', success: false };
}

async function tryTTSProvider(
  provider: 'elevenlabs' | 'smallest' | 'camb',
  text: string,
  voice: string,
  avatarUrl?: string
): Promise<string> {
  switch (provider) {
    case 'elevenlabs':
      return await callElevenLabsTTS(text, voice, avatarUrl);
    case 'smallest':
      return await callSmallestTTS(text, voice, avatarUrl);
    case 'camb':
      return await callCambTTS(text, voice, avatarUrl);
    default:
      throw new Error(`Unknown TTS provider: ${provider}`);
  }
}

async function callElevenLabsTTS(
  text: string,
  voice: string,
  avatarUrl?: string
): Promise<string> {
  console.log('[TTS ElevenLabs] Starting request...');
  console.log('[TTS ElevenLabs] Text:', text.substring(0, 50) + '...');
  console.log('[TTS ElevenLabs] Voice:', voice);
  console.log('[TTS ElevenLabs] Avatar URL:', avatarUrl?.substring(0, 30));
  
  try {
    const response = await fetch('/api/tts-elevenlabs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice, avatarUrl }),
    });

    console.log('[TTS ElevenLabs] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TTS ElevenLabs] Error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      
      throw new Error(`ElevenLabs TTS failed (${response.status}): ${errorData.error || errorData.details || errorText}`);
    }

    const data = await response.json();
    console.log('[TTS ElevenLabs] Success! Audio length:', data.audio?.length);
    
    if (!data.audio) {
      throw new Error('ElevenLabs returned empty audio');
    }
    
    return data.audio;
  } catch (error) {
    console.error('[TTS ElevenLabs] Exception:', error);
    throw error;
  }
}

async function callSmallestTTS(
  text: string,
  voice: string,
  avatarUrl?: string
): Promise<string> {
  const response = await fetch('/api/tts-smallest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice, avatarUrl }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Smallest TTS failed: ${error}`);
  }

  const { audio } = await response.json();
  return audio;
}

async function callCambTTS(
  text: string,
  voice: string,
  avatarUrl?: string
): Promise<string> {
  const response = await fetch('/api/tts-camb', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice, avatarUrl }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`CAMB TTS failed: ${error}`);
  }

  const { audio } = await response.json();
  return audio;
}

async function callOpenAITTS(text: string, voice: string): Promise<string> {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI TTS failed: ${error}`);
  }

  const { audio } = await response.json();
  return audio;
}

// ============================================
// SPEECH-TO-TEXT - transcribeAudio()
// Fallback: AssemblyAI → Deepgram
// ============================================
export async function transcribeAudio(
  options: STTOptions
): Promise<{ text: string; provider: string; success: boolean }> {
  const { audio, provider = 'auto' } = options;
  
  if (!audio) {
    throw new Error('No audio provided for transcription');
  }

  // If specific provider requested
  if (provider !== 'auto') {
    try {
      const result = await trySTTProvider(provider, audio);
      return { text: result, provider, success: true };
    } catch (error) {
      console.error(`[STT] ${provider} failed:`, error);
      throw error;
    }
  }

  // Auto mode: try AssemblyAI first, then Deepgram
  const providers: ('assemblyai' | 'deepgram')[] = ['assemblyai', 'deepgram'];
  
  for (const prov of providers) {
    try {
      console.log(`[STT] Trying ${prov}...`);
      const result = await trySTTProvider(prov, audio);
      console.log(`[STT] ${prov} success`);
      return { text: result, provider: prov, success: true };
    } catch (error) {
      console.error(`[STT] ${prov} failed:`, error);
      continue;
    }
  }
  
  console.error('[STT] All providers failed');
  toast.error('Speech recognition unavailable');
  return { text: '', provider: 'none', success: false };
}

async function trySTTProvider(
  provider: 'assemblyai' | 'deepgram',
  audio: string
): Promise<string> {
  switch (provider) {
    case 'assemblyai':
      return await callAssemblyAI(audio);
    case 'deepgram':
      return await callDeepgram(audio);
    default:
      throw new Error(`Unknown STT provider: ${provider}`);
  }
}

// Safe base64 decode that works in browser
function base64ToUint8Array(base64: string): Uint8Array {
  const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const cleanBase64 = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const outputLength = Math.floor(cleanBase64.length * 3 / 4);
  const bytes = new Uint8Array(outputLength);
  let i = 0;
  let j = 0;
  
  for (let k = 0; k < cleanBase64.length; k += 4) {
    const encoded1 = base64Chars.indexOf(cleanBase64[k]);
    const encoded2 = base64Chars.indexOf(cleanBase64[k + 1]);
    const encoded3 = base64Chars.indexOf(cleanBase64[k + 2]);
    const encoded4 = base64Chars.indexOf(cleanBase64[k + 3]);
    
    bytes[i++] = (encoded1 << 2) | (encoded2 >> 4);
    if (k + 2 < cleanBase64.length && cleanBase64[k + 2] !== '=') {
      bytes[i++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    }
    if (k + 3 < cleanBase64.length && cleanBase64[k + 3] !== '=') {
      bytes[i++] = ((encoded3 & 3) << 6) | encoded4;
    }
  }
  
  return bytes.slice(0, i);
}

async function callAssemblyAI(audio: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_ASSEMBLY_API || 
                 process.env.ASSEMBLY_API;
  
  console.log('[STT AssemblyAI] API Key present:', !!apiKey, 'Length:', apiKey?.length);
  
  if (!apiKey) throw new Error('ASSEMBLY_API not configured');

  // Convert base64 to Uint8Array for browser compatibility
  const bytes = base64ToUint8Array(audio);
  console.log('[STT AssemblyAI] Audio bytes length:', bytes.length);
  
  console.log('[STT AssemblyAI] Uploading audio...');
  const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
    },
    body: bytes as unknown as BodyInit,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error('[STT AssemblyAI] Upload failed:', uploadResponse.status, errorText);
    throw new Error(`AssemblyAI upload failed: ${uploadResponse.status} - ${errorText}`);
  }
  console.log('[STT AssemblyAI] Upload successful');

  const { upload_url } = await uploadResponse.json();

  // Then, submit transcription
  const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: upload_url,
      language_code: 'en_us',
    }),
  });

  if (!transcriptResponse.ok) {
    throw new Error(`AssemblyAI transcription failed: ${transcriptResponse.status}`);
  }

  const { id } = await transcriptResponse.json();

  // Poll for result
  let result;
  for (let i = 0; i < 30; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const pollingResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
      headers: { 'Authorization': apiKey },
    });
    
    if (!pollingResponse.ok) continue;
    
    result = await pollingResponse.json();
    
    if (result.status === 'completed') {
      return result.text || '';
    } else if (result.status === 'error') {
      throw new Error(`AssemblyAI transcription error: ${result.error}`);
    }
  }
  
  throw new Error('AssemblyAI transcription timeout');
}

async function callDeepgram(audio: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API || 
                 process.env.DEEPGRAM_API;
  
  console.log('[STT Deepgram] API Key present:', !!apiKey, 'Length:', apiKey?.length);
  
  if (!apiKey) throw new Error('DEEPGRAM_API not configured');

  // Convert base64 to Uint8Array for browser compatibility
  const bytes = base64ToUint8Array(audio);
  
  const response = await fetch('https://api.deepgram.com/v1/listen', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'audio/webm',
    },
    body: bytes as unknown as BodyInit,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Deepgram API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
}

// ============================================
// REAL-TIME COACHING - getRealtimeCoaching()
// Parallel, non-blocking, short tips
// ============================================
let coachingController: AbortController | null = null;
let isCoachingActive: boolean = false;

export function startRealtimeCoaching(
  conversationHistory: ChatMessage[],
  onTip: (tip: CoachingTip) => void,
  onError?: (error: string) => void
): void {
  // Cancel any existing coaching
  stopRealtimeCoaching();
  
  isCoachingActive = true;
  coachingController = new AbortController();
  
  // Trigger coaching immediately
  fetchCoachingTip(conversationHistory, onTip, onError);
}

export function stopRealtimeCoaching(): void {
  isCoachingActive = false;
  if (coachingController) {
    coachingController.abort();
    coachingController = null;
  }
}

export function isCoachingRunning(): boolean {
  return isCoachingActive;
}

async function fetchCoachingTip(
  conversationHistory: ChatMessage[],
  onTip: (tip: CoachingTip) => void,
  onError?: (error: string) => void
): Promise<void> {
  if (!isCoachingActive || !coachingController) return;

  const signal = coachingController.signal;
  
  try {
    // Build coaching prompt for SHORT tips
    const coachingPrompt = `You are a sales coach watching a live conversation. Give ONE short, actionable tip (max 10 words) based on the last exchange.

CRITICAL RULES:
- Respond with ONLY a JSON object
- NO markdown, NO explanations
- tip must be 1 sentence, max 10 words
- Focus on immediate action

CONVERSATION:
${conversationHistory.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n')}

RESPOND WITH ONLY THIS JSON:
{"suggestion":"your 10-word tip here","category":"rapport|discovery|objection|closing|delivery","priority":"high|medium|low"}`;

    // Try coaching with each AI provider
    const providers = [
      { name: 'Gemini', fn: () => callGeminiAPI([
        { role: 'system', content: 'You are a concise sales coach.' },
        { role: 'user', content: coachingPrompt }
      ], 0.3, 100) },
      { name: 'OpenRouter', fn: () => callOpenRouterAPI([
        { role: 'system', content: 'You are a concise sales coach.' },
        { role: 'user', content: coachingPrompt }
      ], 0.3, 100) },
      { name: 'Groq', fn: () => callGroqAPI([
        { role: 'system', content: 'You are a concise sales coach.' },
        { role: 'user', content: coachingPrompt }
      ], 0.3, 100) },
    ];

    let tip: CoachingTip | null = null;

    for (const provider of providers) {
      if (signal.aborted) return;
      
      try {
        console.log(`[Coach] Trying ${provider.name}...`);
        const response = await provider.fn();
        
        if (signal.aborted) return;
        
        // Parse response
        try {
          // Extract JSON from response
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          const jsonStr = jsonMatch ? jsonMatch[0] : response;
          const parsed = JSON.parse(jsonStr);
          
          tip = {
            id: `tip-${Date.now()}`,
            suggestion: parsed.suggestion || 'Keep engaging the prospect',
            category: parsed.category || 'rapport',
            priority: parsed.priority || 'medium',
            timestamp: Date.now(),
          };
          
          console.log(`[Coach] ${provider.name} success:`, tip.suggestion);
          break; // Success, stop trying other providers
        } catch (parseError) {
          console.error(`[Coach] ${provider.name} parse error:`, parseError);
          continue;
        }
      } catch (error) {
        console.error(`[Coach] ${provider.name} failed:`, error);
        continue;
      }
    }

    if (tip && !signal.aborted) {
      onTip(tip);
    } else if (!signal.aborted) {
      onError?.('All coaching providers failed');
    }
  } catch (error) {
    if (!signal.aborted) {
      console.error('[Coach] Error:', error);
      onError?.(error instanceof Error ? error.message : 'Coaching error');
    }
  }
}

// ============================================
// BROWSER FALLBACKS
// ============================================
export function speakWithBrowserTTS(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): void {
  if (!('speechSynthesis' in window)) {
    toast.error('Browser speech not supported');
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  
  // Try to find a good voice
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => 
    v.name.includes('Google') || 
    v.name.includes('Samantha') ||
    v.name.includes('Microsoft')
  );
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => {
    console.error('Browser TTS error');
    onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
}

export function stopBrowserTTS(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
