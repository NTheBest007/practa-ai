'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Play, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function ElevenLabsTest() {
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);

  const testElevenLabs = async () => {
    setIsTesting(true);
    setResult(null);

    try {
      console.log('[ElevenLabs Test] Starting test...');
      
      const testText = "Hello, this is a test of the ElevenLabs voice synthesis API.";
      
      const response = await fetch('/api/tts-elevenlabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testText,
          voice: 'alloy'
        }),
      });

      console.log('[ElevenLabs Test] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ElevenLabs Test] Error:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }

        setResult({
          success: false,
          message: `ElevenLabs API Failed (${response.status})`,
          details: errorData.error || errorData.details || errorText
        });
        
        toast.error('ElevenLabs test failed');
        return;
      }

      const data = await response.json();
      console.log('[ElevenLabs Test] Success! Audio length:', data.audio?.length);

      if (data.audio) {
        // Try to play the audio
        const audio = new Audio(data.audio);
        
        audio.oncanplay = () => {
          console.log('[ElevenLabs Test] Audio ready to play');
        };
        
        audio.onerror = (e) => {
          console.error('[ElevenLabs Test] Audio playback error:', e);
        };

        await audio.play();
        
        setResult({
          success: true,
          message: 'ElevenLabs API Working!',
          details: `Voice: ${data.voice}, Audio size: ${Math.round(data.audio.length / 1024)}KB`
        });
        
        toast.success('ElevenLabs test passed - audio playing!');
      } else {
        setResult({
          success: false,
          message: 'ElevenLabs returned no audio',
          details: JSON.stringify(data)
        });
      }
    } catch (error) {
      console.error('[ElevenLabs Test] Exception:', error);
      setResult({
        success: false,
        message: 'Test failed with exception',
        details: error instanceof Error ? error.message : String(error)
      });
      toast.error('ElevenLabs test error');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-4 rounded-xl border border-white/10 bg-white/5">
      <h3 className="text-sm font-semibold text-white mb-2">ElevenLabs API Test</h3>
      <p className="text-xs text-white/60 mb-3">
        Test if ElevenLabs API is configured correctly
      </p>
      
      <Button
        onClick={testElevenLabs}
        disabled={isTesting}
        className="w-full"
        variant={result?.success ? "default" : "outline"}
      >
        {isTesting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Testing...
          </>
        ) : result?.success ? (
          <>
            <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-400" />
            Test Again
          </>
        ) : (
          <>
            <Play className="h-4 w-4 mr-2" />
            Test ElevenLabs
          </>
        )}
      </Button>

      {result && (
        <div className={`mt-3 p-3 rounded-lg text-xs ${
          result.success 
            ? 'bg-emerald-400/10 border border-emerald-400/20 text-emerald-200' 
            : 'bg-red-400/10 border border-red-400/20 text-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            {result.success ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-400" />
            )}
            <span className="font-medium">{result.message}</span>
          </div>
          {result.details && (
            <p className="ml-6 text-white/60 break-all">{result.details}</p>
          )}
        </div>
      )}
    </div>
  );
}
