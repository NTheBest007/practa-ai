'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// ============================================
// TYPES
// ============================================
export type APIStatus = 'unknown' | 'checking' | 'working' | 'failed';

export interface APIState {
  name: string;
  status: APIStatus;
  lastError?: string;
  lastSuccess?: string;
  lastChecked: number;
}

export interface DebugLog {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error';
  source: string;
  message: string;
  details?: string;
  data?: any;
}

export interface DebugContextType {
  // API Status
  apis: Record<string, APIState>;
  updateAPIStatus: (name: string, status: APIStatus, error?: string) => void;
  
  // Logs
  logs: DebugLog[];
  addLog: (type: DebugLog['type'], source: string, message: string, details?: string, data?: any) => void;
  clearLogs: () => void;
  
  // Last Actions
  lastAIRequest: any | null;
  setLastAIRequest: (data: any) => void;
  lastAIResponse: any | null;
  setLastAIResponse: (data: any) => void;
  lastAPIUsed: string | null;
  setLastAPIUsed: (api: string) => void;
  
  // Feature Debug
  voiceDebug: {
    lastAttempt: string | null;
    lastError: string | null;
    providerUsed: string | null;
  };
  updateVoiceDebug: (attempt: string | null, error: string | null, provider: string | null) => void;
  
  coachDebug: {
    lastTrigger: number | null;
    lastResponse: any | null;
    lastError: string | null;
    isRunning: boolean;
  };
  updateCoachDebug: (updates: Partial<DebugContextType['coachDebug']>) => void;
  
  // Visibility
  isDebugMode: boolean;
  toggleDebugMode: () => void;
}

// ============================================
// CONTEXT
// ============================================
const DebugContext = createContext<DebugContextType | undefined>(undefined);

export function DebugProvider({ children }: { children: ReactNode }) {
  // API Status State
  const [apis, setApis] = useState<Record<string, APIState>>({
    gemini: { name: 'Gemini', status: 'unknown', lastChecked: 0 },
    openrouter: { name: 'OpenRouter', status: 'unknown', lastChecked: 0 },
    groq: { name: 'Groq', status: 'unknown', lastChecked: 0 },
    elevenlabs: { name: 'ElevenLabs', status: 'unknown', lastChecked: 0 },
    smallest: { name: 'Smallest.ai', status: 'unknown', lastChecked: 0 },
    camb: { name: 'CAMB.ai', status: 'unknown', lastChecked: 0 },
    assemblyai: { name: 'AssemblyAI', status: 'unknown', lastChecked: 0 },
    deepgram: { name: 'Deepgram', status: 'unknown', lastChecked: 0 },
    openai: { name: 'OpenAI', status: 'unknown', lastChecked: 0 },
  });

  // Logs State
  const [logs, setLogs] = useState<DebugLog[]>([]);

  // Last Actions State
  const [lastAIRequest, setLastAIRequest] = useState<any | null>(null);
  const [lastAIResponse, setLastAIResponse] = useState<any | null>(null);
  const [lastAPIUsed, setLastAPIUsed] = useState<string | null>(null);

  // Feature Debug State
  const [voiceDebug, setVoiceDebug] = useState({
    lastAttempt: null as string | null,
    lastError: null as string | null,
    providerUsed: null as string | null,
  });

  const [coachDebug, setCoachDebug] = useState({
    lastTrigger: null as number | null,
    lastResponse: null as any | null,
    lastError: null as string | null,
    isRunning: false,
  });

  // Debug Mode State (panel/indicator removed from layout; stays off unless toggled in-app later)
  const [isDebugMode, setIsDebugMode] = useState(false);

  // ============================================
  // ACTIONS
  // ============================================
  const updateAPIStatus = useCallback((name: string, status: APIStatus, error?: string) => {
    setApis(prev => ({
      ...prev,
      [name.toLowerCase()]: {
        ...prev[name.toLowerCase()],
        name: prev[name.toLowerCase()]?.name || name,
        status,
        lastError: error,
        lastSuccess: status === 'working' ? new Date().toISOString() : prev[name.toLowerCase()]?.lastSuccess,
        lastChecked: Date.now(),
      }
    }));
  }, []);

  const addLog = useCallback((type: DebugLog['type'], source: string, message: string, details?: string, data?: any) => {
    const newLog: DebugLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      source,
      message,
      details,
      data,
    };

    setLogs(prev => [newLog, ...prev].slice(0, 100)); // Keep last 100 logs

    // Also log to console
    const consoleMethod = type === 'error' ? console.error : type === 'warning' ? console.warn : console.log;
    consoleMethod(`[${source}] ${message}`, details || '', data || '');
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const updateVoiceDebug = useCallback((attempt: string | null, error: string | null, provider: string | null) => {
    setVoiceDebug({ lastAttempt: attempt, lastError: error, providerUsed: provider });
  }, []);

  const updateCoachDebug = useCallback((updates: Partial<typeof coachDebug>) => {
    setCoachDebug(prev => ({ ...prev, ...updates }));
  }, []);

  const toggleDebugMode = useCallback(() => {
    setIsDebugMode(prev => !prev);
  }, []);

  // ============================================
  // VALUE
  // ============================================
  const value: DebugContextType = {
    apis,
    updateAPIStatus,
    logs,
    addLog,
    clearLogs,
    lastAIRequest,
    setLastAIRequest,
    lastAIResponse,
    setLastAIResponse,
    lastAPIUsed,
    setLastAPIUsed,
    voiceDebug,
    updateVoiceDebug,
    coachDebug,
    updateCoachDebug,
    isDebugMode,
    toggleDebugMode,
  };

  return (
    <DebugContext.Provider value={value}>
      {children}
    </DebugContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================
export function useDebug() {
  const context = useContext(DebugContext);
  if (context === undefined) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  return context;
}

// ============================================
// HELPER FUNCTIONS (for use outside React)
// ============================================
let debugInstance: DebugContextType | null = null;

export function setDebugInstance(instance: DebugContextType) {
  debugInstance = instance;
}

export function logDebug(type: DebugLog['type'], source: string, message: string, details?: string, data?: any) {
  if (debugInstance) {
    debugInstance.addLog(type, source, message, details, data);
  } else {
    const consoleMethod = type === 'error' ? console.error : type === 'warning' ? console.warn : console.log;
    consoleMethod(`[${source}] ${message}`, details || '', data || '');
  }
}

export function updateAPIDebug(name: string, status: APIStatus, error?: string) {
  if (debugInstance) {
    debugInstance.updateAPIStatus(name, status, error);
  }
}
