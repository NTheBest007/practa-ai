'use client';

import { ReactNode, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Phone, Mic, MicOff, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';

interface PhoneFrameProps {
  children: ReactNode;
  scenarioName: string;
  scenarioAvatar: string;
  isMuted?: boolean;
  isSpeakerOn?: boolean;
  isRecording?: boolean;
  callDuration?: number;
  onToggleMute?: () => void;
  onToggleSpeaker?: () => void;
  onEndCall?: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export function PhoneFrame({
  children,
  scenarioName,
  scenarioAvatar,
  isMuted = false,
  isSpeakerOn = true,
  isRecording = false,
  callDuration = 0,
  onToggleMute,
  onToggleSpeaker,
  onEndCall,
  isMinimized = false,
  onToggleMinimize,
}: PhoneFrameProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 glass glow-border rounded-2xl p-3 transition-all duration-300 hover:scale-105">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={scenarioAvatar} alt={scenarioName} />
              <AvatarFallback>
                <div className="h-full w-full bg-gradient-to-br from-emerald-400 to-teal-600" />
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#070b0a]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">{scenarioName}</span>
            <span className="text-xs text-white/60">{formatTime(callDuration)}</span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleMinimize}
            className="text-white/70 hover:text-white hover:bg-white/5"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-md">
      {/* Phone Frame */}
      <div className="relative glass glow-border rounded-[3rem] p-2 bg-gradient-to-br from-slate-900/50 to-black/50">
        {/* Phone Screen */}
        <div className="relative rounded-[2.5rem] bg-black/90 overflow-hidden">
          {/* Status Bar */}
          <div className="flex items-center justify-between px-6 py-2 text-xs text-white/80">
            <span>{formatTime(callDuration)}</span>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300">LIVE</span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={onToggleMinimize}
              className="text-white/70 hover:text-white hover:bg-white/5 h-6 w-6"
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
          </div>

          {/* Contact Header */}
          <div className="px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={scenarioAvatar} alt={scenarioName} />
                  <AvatarFallback>
                    <div className="h-full w-full bg-gradient-to-br from-emerald-400 to-teal-600" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 ring-2 ring-[#070b0a]" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">{scenarioName}</h3>
                <p className="text-sm text-white/60">AI Prospect</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-300">On call</span>
                </div>
              </div>
            </div>
          </div>

          {/* Conversation Area */}
          <div className="h-[400px] overflow-y-auto bg-black/50">
            {children}
          </div>

          {/* Call Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
            <div className="flex items-center justify-center gap-4">
              {/* Mute Button */}
              <Button
                size="icon"
                variant={isMuted ? "destructive" : "outline"}
                onClick={onToggleMute}
                className={`h-14 w-14 rounded-full ${
                  isMuted 
                    ? 'bg-red-500/20 border-red-500/50 text-red-300' 
                    : 'border-white/20 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>

              {/* Speaker Button */}
              <Button
                size="icon"
                variant="outline"
                onClick={onToggleSpeaker}
                className={`h-14 w-14 rounded-full ${
                  isSpeakerOn 
                    ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300' 
                    : 'border-white/20 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {isSpeakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
              </Button>

              {/* End Call Button */}
              <Button
                size="icon"
                onClick={onEndCall}
                className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 text-white"
              >
                <Phone className="h-8 w-8 transform rotate-135" />
              </Button>
            </div>

            {/* Recording Indicator */}
            {isRecording && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-red-300">Recording</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Phone Notch (Visual Enhancement) */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full" />
    </div>
  );
}
