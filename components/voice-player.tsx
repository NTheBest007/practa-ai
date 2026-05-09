'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface VoicePlayerProps {
  text: string;
  autoPlay?: boolean;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  onPlay?: () => void;
  onEnded?: () => void;
}

export function VoicePlayer({ 
  text, 
  autoPlay = false, 
  voice = 'alloy',
  onPlay,
  onEnded 
}: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (autoPlay && text && !audioUrl) {
      generateSpeech();
    }
  }, [autoPlay, text]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('ended', handleAudioEnded);
      audioRef.current.addEventListener('play', handleAudioPlay);
      audioRef.current.addEventListener('error', handleAudioError);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleAudioEnded);
        audioRef.current.removeEventListener('play', handleAudioPlay);
        audioRef.current.removeEventListener('error', handleAudioError);
      }
    };
  }, [audioUrl]);

  const generateSpeech = async () => {
    if (!text.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voice }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Speech generation failed';
        console.error('TTS API error:', errorMessage);
        throw new Error(errorMessage);
      }

      const { audio } = await response.json();
      setAudioUrl(audio);
    } catch (error) {
      console.error('TTS error:', error);
      toast.error('Could not generate speech');
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleAudioPlay = () => {
    setIsPlaying(true);
    onPlay?.();
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    onEnded?.();
  };

  const handleAudioError = () => {
    setIsPlaying(false);
    toast.error('Audio playback failed');
  };

  const handleClick = () => {
    if (isLoading) return;

    if (!audioUrl) {
      generateSpeech();
      return;
    }

    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  return (
    <div className="flex items-center gap-2">
      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          preload="none"
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
    </div>
  );
}
