'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { generateSpeech } from '@/lib/ai-service-with-debug';
import { useDebug } from '@/lib/debug-context';

interface UnifiedVoicePlayerProps {
  text: string;
  autoPlay?: boolean;
  voice?: string;
  avatarUrl?: string;
  onPlay?: () => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
}

export function UnifiedVoicePlayer({ 
  text, 
  autoPlay = false, 
  voice = 'alloy',
  avatarUrl,
  onPlay,
  onEnded,
  onError 
}: UnifiedVoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasAttemptedRef = useRef(false);
  const debug = useDebug();

  // Reset when text changes
  useEffect(() => {
    hasAttemptedRef.current = false;
    setAudioUrl(null);
    setActiveProvider('');
  }, [text]);

  // Auto-play
  useEffect(() => {
    if (autoPlay && text && !hasAttemptedRef.current) {
      hasAttemptedRef.current = true;
      play();
    }
  }, [autoPlay, text]);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handleError = () => {
      setIsPlaying(false);
      console.error('Audio playback error');
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl, onEnded, onPlay]);

  const play = async () => {
    if (!text.trim() || isLoading) return;

    // If we already have audio, just play it
    if (audioUrl) {
      if (audioRef.current) {
        audioRef.current.volume = isMuted ? 0 : 1;
        audioRef.current.play().catch(err => {
          console.error('Play error:', err);
        });
      }
      return;
    }

    // Generate speech
    setIsLoading(true);
    debug.updateVoiceDebug(text.substring(0, 50) + '...', null, null);
    
    try {
      const result = await generateSpeech({
        text,
        voice,
        avatarUrl,
        provider: 'auto'
      });

      if (result.success && result.audioUrl) {
        setAudioUrl(result.audioUrl);
        setActiveProvider(result.provider);
        debug.updateVoiceDebug(text.substring(0, 50) + '...', null, result.provider);
        
        // Play after a short delay to allow audio element to load
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : 1;
            audioRef.current.play().catch(err => {
              console.error('Auto-play error:', err);
            });
          }
        }, 100);
      }
      // Silently fail - no toast per message
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Speech failed';
      console.error('[Voice] Error:', error);
      onError?.(errorMsg);
      debug.updateVoiceDebug(text.substring(0, 50) + '...', errorMsg, null);
      // Silently fail - no toast per message
    } finally {
      setIsLoading(false);
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    
    if (audioRef.current) {
      audioRef.current.muted = newMuted;
    }
  };

  const handleClick = () => {
    if (isLoading) return;
    
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const getProviderDisplay = () => {
    if (activeProvider && activeProvider !== 'none') return activeProvider;
    return '';
  };


  return (
    <div className="flex items-center gap-2">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="auto"
        />
      )}

      <Button
        onClick={handleClick}
        disabled={isLoading || !text.trim()}
        size="icon"
        className={`h-8 w-8 rounded-lg transition-all duration-200 ${
          isPlaying
            ? 'bg-emerald-400/20 text-emerald-300'
            : isLoading
            ? 'bg-white/5 text-white/60'
            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
        }`}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPlaying ? (
          <Volume2 className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>

      {audioUrl && (
        <Button
          onClick={toggleMute}
          size="icon"
          variant="ghost"
          className={`h-6 w-6 rounded ${isMuted ? 'text-red-400' : 'text-white/60 hover:text-white'}`}
        >
          {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
        </Button>
      )}

      {/* Provider badge */}
      {activeProvider && activeProvider !== 'none' && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300">
          {getProviderDisplay()}
        </span>
      )}
    </div>
  );
}
