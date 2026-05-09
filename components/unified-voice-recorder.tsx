'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useDebug } from '@/lib/debug-context';

interface UnifiedVoiceRecorderProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function UnifiedVoiceRecorder({ 
  onTranscript, 
  disabled = false 
}: UnifiedVoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const debug = useDebug();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processTranscription(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      
      toast.info('Recording... Click again to stop', { duration: 3000 });
    } catch (error) {
      console.error('Recording error:', error);
      toast.error('Could not access microphone');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const processTranscription = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });

      // Call local transcription API
      console.log('[STT] Calling local transcribe API...');
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64Audio }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const data = await response.json();
      if (data.text) {
        console.log('[STT] Transcription success:', data.text);
        onTranscript(data.text);
        toast.success('Transcribed!');
      } else {
        throw new Error('No text returned');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Transcription failed';
      console.error('[STT] Transcription error:', error);
      debug.addLog('error', 'STT', 'Transcription failed', errorMsg);
      toast.error(`Transcription failed: ${errorMsg}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleClick = () => {
    if (isTranscribing) return;
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isTranscribing}
      size="icon"
      className={`h-10 w-10 rounded-xl transition-all duration-200 ${
        isRecording
          ? 'bg-red-400/20 text-red-300 animate-pulse'
          : isTranscribing
          ? 'bg-white/5 text-white/60'
          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
      }`}
    >
      {isTranscribing ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isRecording ? (
        <Square className="h-5 w-5" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </Button>
  );
}
