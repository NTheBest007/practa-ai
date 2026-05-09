'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';

interface VoicePlayerFreeProps {
  text: string;
  autoPlay?: boolean;
  voice?: string;
}

export function VoicePlayerFree({ text, autoPlay = false, voice = 'alloy' }: VoicePlayerFreeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Check if Web Speech API is supported
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
      console.warn('Web Speech API not supported in this browser');
    }
  }, []);

  const speak = () => {
    if (!text.trim() || !isSupported) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice settings
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = isMuted ? 0 : 1;

    // Try to find a suitable voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.toLowerCase().includes('english') || 
      v.name.toLowerCase().includes('samantha') ||
      v.name.toLowerCase().includes('alex')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // Event handlers
    utterance.onstart = () => {
      setIsPlaying(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
      toast.error('Speech synthesis failed');
    };

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stop();
    } else {
      speak();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (speechRef.current) {
      speechRef.current.volume = !isMuted ? 0 : 1;
    }
  };

  useEffect(() => {
    if (autoPlay && text && isSupported) {
      speak();
    }
  }, [autoPlay, text, isSupported]);

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 text-sm text-white/60">
        <Volume2 className="h-4 w-4" />
        <span>Voice not supported</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="icon"
        variant="ghost"
        onClick={togglePlay}
        disabled={!text.trim() || isLoading}
        className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
      >
        {isPlaying ? (
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
        {isPlaying ? 'Speaking...' : 'Click to play voice'}
      </div>
    </div>
  );
}
