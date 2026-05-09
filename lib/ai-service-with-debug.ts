/**
 * AI Service with Debug Integration
 * Wraps the original ai-service.ts with debug logging
 */

import { 
  sendMessageToAI as originalSendMessageToAI,
  generateSpeech as originalGenerateSpeech,
  transcribeAudio as originalTranscribeAudio,
  startRealtimeCoaching as originalStartCoaching,
  stopRealtimeCoaching,
  isCoachingRunning,
  speakWithBrowserTTS,
  stopBrowserTTS,
  ChatMessage,
  CoachingTip,
  TTSOptions,
  STTOptions,
} from './ai-service';
import { logDebug, updateAPIDebug, DebugLog } from './debug-context';

// ============================================
// WRAPPED FUNCTIONS WITH DEBUG LOGGING
// ============================================

export async function sendMessageToAI(
  messages: ChatMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    onProviderChange?: (provider: string) => void;
  }
): Promise<{ text: string; provider: string; success: boolean }> {
  logDebug('info', 'AI Chat', 'Sending message to AI', `${messages.length} messages`);
  
  try {
    const result = await originalSendMessageToAI(messages, {
      ...options,
      onProviderChange: (provider) => {
        logDebug('info', 'AI Chat', `Switched to provider: ${provider}`);
        updateAPIDebug(provider.toLowerCase(), 'checking');
        options?.onProviderChange?.(provider);
      }
    });

    if (result.success) {
      logDebug('success', 'AI Chat', `Success with ${result.provider}`, undefined, { 
        response: result.text.substring(0, 100) + '...' 
      });
      updateAPIDebug(result.provider.toLowerCase(), 'working');
    } else {
      logDebug('error', 'AI Chat', 'All providers failed', result.text);
    }

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logDebug('error', 'AI Chat', 'Exception in sendMessageToAI', errorMsg);
    throw error;
  }
}

export async function generateSpeech(
  options: TTSOptions
): Promise<{ audioUrl: string; provider: string; success: boolean }> {
  const { text, provider: preferredProvider } = options;
  
  logDebug('info', 'TTS', `Generating speech: "${text.substring(0, 50)}..."`, `Preferred: ${preferredProvider || 'auto'}`);
  
  try {
    const result = await originalGenerateSpeech(options);

    if (result.success) {
      logDebug('success', 'TTS', `Speech generated with ${result.provider}`, undefined, {
        provider: result.provider,
        textLength: text.length
      });
      updateAPIDebug(result.provider.toLowerCase(), 'working');
    } else {
      logDebug('error', 'TTS', 'All TTS providers failed');
    }

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logDebug('error', 'TTS', 'Exception in generateSpeech', errorMsg);
    
    // Update the specific provider status if we know which one failed
    if (preferredProvider && preferredProvider !== 'auto') {
      updateAPIDebug(preferredProvider.toLowerCase(), 'failed', errorMsg);
    }
    
    throw error;
  }
}

export async function transcribeAudio(
  options: STTOptions
): Promise<{ text: string; provider: string; success: boolean }> {
  const { audio, provider: preferredProvider } = options;
  
  logDebug('info', 'STT', 'Transcribing audio', `Provider: ${preferredProvider || 'auto'}, Size: ${audio.length} chars`);
  
  try {
    const result = await originalTranscribeAudio(options);

    if (result.success) {
      logDebug('success', 'STT', `Transcribed with ${result.provider}`, undefined, {
        provider: result.provider,
        text: result.text.substring(0, 100)
      });
      updateAPIDebug(result.provider.toLowerCase(), 'working');
    } else {
      logDebug('error', 'STT', 'All STT providers failed');
    }

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logDebug('error', 'STT', 'Exception in transcribeAudio', errorMsg);
    throw error;
  }
}

// ============================================
// REAL-TIME COACHING WITH DEBUG
// ============================================
let currentCoachCallback: ((tip: CoachingTip) => void) | null = null;
let currentCoachErrorCallback: ((error: string) => void) | null = null;

export function startRealtimeCoaching(
  conversationHistory: ChatMessage[],
  onTip: (tip: CoachingTip) => void,
  onError?: (error: string) => void
): void {
  logDebug('info', 'Coach', 'Starting real-time coaching', `${conversationHistory.length} messages`);
  
  // Wrap callbacks to add debug logging
  currentCoachCallback = (tip: CoachingTip) => {
    logDebug('success', 'Coach', 'Tip received', tip.suggestion, {
      category: tip.category,
      priority: tip.priority
    });
    onTip(tip);
  };

  currentCoachErrorCallback = (error: string) => {
    logDebug('error', 'Coach', 'Coaching failed', error);
    onError?.(error);
  };

  try {
    originalStartCoaching(
      conversationHistory,
      currentCoachCallback,
      currentCoachErrorCallback
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logDebug('error', 'Coach', 'Exception starting coaching', errorMsg);
    currentCoachErrorCallback?.(errorMsg);
  }
}

export { stopRealtimeCoaching, isCoachingRunning, speakWithBrowserTTS, stopBrowserTTS };
export type { ChatMessage, CoachingTip, TTSOptions, STTOptions };
