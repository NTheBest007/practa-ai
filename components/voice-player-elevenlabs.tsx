'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { extractAvatarSeed } from '@/lib/voice-utils';

interface VoicePlayerElevenLabsProps {
  text: string;
  autoPlay?: boolean;
  voice?: string;
  avatarUrl?: string;
}

export function VoicePlayerElevenLabs({ 
  text, 
  autoPlay = false, 
  voice = 'alloy', 
  avatarUrl 
}: VoicePlayerElevenLabsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleAudioPlay = () => {
    setIsPlaying(true);
  };

  const handleAudioError = () => {
    setIsPlaying(false);
    toast.error('Audio playback failed');
  };

  const generateSpeech = async () => {
    if (!text.trim()) return;

    setIsLoading(true);
    try {
      const avatarSeed = avatarUrl ? extractAvatarSeed(avatarUrl) : 'default';
      
      const response = await fetch('/api/tts-elevenlabs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text, 
          voice,
          avatarSeed 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Speech generation failed';
        console.error('ElevenLabs API error:', errorMessage);
        throw new Error(errorMessage);
      }

      const { audio } = await response.json();
      setAudioUrl(audio);
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      toast.error('Could not generate speech');
    } finally {
      setIsLoading(false);
    }
  };

  const play = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.volume = isMuted ? 0 : 1;
      audioRef.current.play();
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else if (audioUrl) {
      play();
    } else {
      generateSpeech();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.volume = !isMuted ? 0 : 1;
    }
  };

  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.addEventListener('ended', handleAudioEnded);
      audio.addEventListener('play', handleAudioPlay);
      audio.addEventListener('error', handleAudioError);
      audioRef.current = audio;

      if (autoPlay) {
        audio.volume = isMuted ? 0 : 1;
        audio.play();
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleAudioEnded);
        audioRef.current.removeEventListener('play', handleAudioPlay);
        audioRef.current.removeEventListener('error', handleAudioError);
      }
    };
  }, [audioUrl, autoPlay, isMuted]);

  return (
    <div className="flex items-center gap-2">
      <Button
        size="icon"
        variant="ghost"
        onClick={togglePlay}
        disabled={!text.trim() || isLoading}
        className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      
      <Button
        size="icon"
        variant="ghost"
        onClick={toggleMute}
        className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>
      
      <div className="text-xs text-white/60">
        {isLoading ? 'Generating...' : isPlaying ? 'Playing...' : 'ElevenLabs Voice'}
        {avatarUrl && (
          <span className="text-purple-300"> ({extractAvatarSeed(avatarUrl)})</span>
        )}
      </div>
    </div>
  );
}
