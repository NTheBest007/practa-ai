'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { extractAvatarSeed } from '@/lib/voice-utils';

interface VoicePlayerWithFallbackProps {
  text: string;
  autoPlay?: boolean;
  voice?: string;
  avatarUrl?: string;
  preferredMode?: 'smallest' | 'camb' | 'elevenlabs' | 'google' | 'openai' | 'free';
}

type TTSMode = 'smallest' | 'camb' | 'elevenlabs' | 'google' | 'openai' | 'free';

// Priority: Smallest (ultra-low latency) > CAMB (high quality) > ElevenLabs > Google > OpenAI > Free
const TTS_PRIORITY: TTSMode[] = ['smallest', 'camb', 'elevenlabs', 'google', 'openai', 'free'];

export function VoicePlayerWithFallback({ 
  text, 
  autoPlay = false, 
  voice = 'alloy', 
  avatarUrl,
  preferredMode = 'smallest'
}: VoicePlayerWithFallbackProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<TTSMode>(preferredMode);
  const [errorCount, setErrorCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('ended', handleAudioEnded);
        audioRef.current.removeEventListener('play', handleAudioPlay);
        audioRef.current.removeEventListener('error', handleAudioError);
      }
    };
  }, []);

  useEffect(() => {
    // Reset when text changes
    hasAttemptedRef.current = false;
    setAudioUrl(null);
    setErrorCount(0);
    setCurrentMode(preferredMode);
  }, [text, preferredMode]);

  useEffect(() => {
    if (autoPlay && text && !hasAttemptedRef.current) {
      hasAttemptedRef.current = true;
      generateSpeechWithFallback();
    }
  }, [autoPlay, text]);

  // Auto-play when audio is ready
  useEffect(() => {
    if (audioUrl && autoPlay) {
      if (audioUrl === 'free-mode') {
        playFreeMode();
      } else if (audioRef.current) {
        audioRef.current.play().catch(err => {
          console.error('Auto-play failed:', err);
        });
      }
    }
  }, [audioUrl, autoPlay]);

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleAudioPlay = () => {
    setIsPlaying(true);
  };

  const handleAudioError = () => {
    setIsPlaying(false);
    console.error('Audio playback error');
  };

  const getNextMode = useCallback((mode: TTSMode | null): TTSMode | null => {
    if (!mode) return null;
    const currentIndex = TTS_PRIORITY.indexOf(mode);
    if (currentIndex < TTS_PRIORITY.length - 1) {
      return TTS_PRIORITY[currentIndex + 1];
    }
    return null;
  }, []);

  const generateSpeechWithFallback = async () => {
    if (!text.trim()) return;

    setIsLoading(true);
    let modeToTry: TTSMode | null = currentMode;
    let success = false;

    while (modeToTry && !success) {
      try {
        console.log(`Trying TTS mode: ${modeToTry}`);
        const result = await tryGenerateSpeech(modeToTry);
        if (result) {
          setAudioUrl(result);
          setCurrentMode(modeToTry);
          success = true;
          
          // Notify if we fell back to a different mode
          if (modeToTry !== preferredMode) {
            toast.info(`Using ${modeToTry} voice (fallback)`, { duration: 2000 });
          }
        } else {
          console.log(`${modeToTry} returned null, trying next...`);
          setErrorCount(prev => prev + 1);
          modeToTry = getNextMode(modeToTry);
        }
      } catch (error) {
        console.error(`TTS ${modeToTry} failed:`, error);
        setErrorCount(prev => prev + 1);
        modeToTry = getNextMode(modeToTry);
      }
    }

    if (!success) {
      // Don't show error toast - just silent fail with coming soon indicator
      console.log('[Voice] All TTS options failed - showing coming soon');
    }

    setIsLoading(false);
  };

  const tryGenerateSpeech = async (mode: TTSMode): Promise<string | null> => {
    const avatarSeed = avatarUrl ? extractAvatarSeed(avatarUrl) : 'default';
    
    console.log(`[Voice] Trying ${mode} TTS...`);
    toast.info(`Using ${mode} voice...`, { duration: 2000 });

    switch (mode) {
      case 'smallest': {
        console.log('[Voice] Calling Smallest.ai API...');
        const response = await fetch('/api/tts-smallest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice, avatarUrl }),
        });
        if (!response.ok) {
          const error = await response.text();
          console.error('[Voice] Smallest.ai failed:', error);
          toast.error(`Smallest.ai: ${error.substring(0, 100)}`);
          return null;
        }
        const { audio } = await response.json();
        console.log('[Voice] Smallest.ai success!');
        toast.success('Smallest.ai voice active');
        return audio;
      }

      case 'camb': {
        console.log('[Voice] Calling CAMB.ai API...');
        const response = await fetch('/api/tts-camb', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice, avatarUrl }),
        });
        if (!response.ok) {
          const error = await response.text();
          console.error('[Voice] CAMB.ai failed:', error);
          toast.error(`CAMB.ai: ${error.substring(0, 100)}`);
          return null;
        }
        const { audio } = await response.json();
        console.log('[Voice] CAMB.ai success!');
        toast.success('CAMB.ai voice active');
        return audio;
      }

      case 'elevenlabs': {
        console.log('[Voice] Calling ElevenLabs API...');
        const response = await fetch('/api/tts-elevenlabs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice, avatarSeed, avatarUrl }),
        });
        if (!response.ok) {
          const error = await response.text();
          console.error('[Voice] ElevenLabs failed:', error);
          toast.error(`ElevenLabs: ${error.substring(0, 100)}`);
          return null;
        }
        const { audio } = await response.json();
        console.log('[Voice] ElevenLabs success!');
        toast.success('ElevenLabs voice active');
        return audio;
      }

      case 'google': {
        const response = await fetch('/api/tts-google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice, avatarSeed, avatarUrl }),
        });
        if (!response.ok) return null;
        const { audio } = await response.json();
        return audio;
      }

      case 'openai': {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice, avatarUrl }),
        });
        if (!response.ok) return null;
        const { audio } = await response.json();
        return audio;
      }

      case 'free': {
        // Don't use browser fallback - show coming soon instead
        return null;
      }

      default:
        return null;
    }
  };

  const playFreeMode = () => {
    // Browser fallback disabled - show coming soon
    toast.info('Voice synthesis coming soon', { duration: 2000 });
  };

  const play = () => {
    if (currentMode === 'free') {
      playFreeMode();
    } else if (audioRef.current && audioUrl) {
      audioRef.current.volume = isMuted ? 0 : 1;
      audioRef.current.play();
    }
  };

  const pause = () => {
    // No browser speech to cancel
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else if (audioUrl || currentMode === 'free') {
      play();
    } else {
      generateSpeechWithFallback();
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isLoading ? (
        <div className="flex items-center gap-2 text-white/60">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Loading {currentMode}...</span>
        </div>
      ) : (
        <>
          <Button
            size="icon"
            variant="ghost"
            onClick={togglePlay}
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          
          {audioUrl && (
            <audio
              ref={(ref) => {
                if (ref) {
                  audioRef.current = ref;
                  ref.addEventListener('ended', handleAudioEnded);
                  ref.addEventListener('play', handleAudioPlay);
                  ref.addEventListener('error', handleAudioError);
                }
              }}
              src={audioUrl}
              preload="auto"
            />
          )}

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsMuted(!isMuted)}
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>

          {errorCount > 0 && (
            <span className="text-xs text-amber-400" title="Using fallback voice">
              <AlertCircle className="h-4 w-4 inline" />
            </span>
          )}
        </>
      )}
    </div>
  );
}
