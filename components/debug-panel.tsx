'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ElevenLabsTest } from '@/components/elevenlabs-test';
import { 
  useDebug, 
  APIStatus, 
  DebugLog 
} from '@/lib/debug-context';
import { 
  Bug, 
  X, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  HelpCircle,
  RefreshCw,
  Terminal,
  Trash2,
  Activity,
  Mic2,
  Brain,
  MessageSquare,
  Server
} from 'lucide-react';

export function DebugPanel() {
  const debug = useDebug();
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'apis' | 'logs' | 'actions' | 'voice' | 'coach'>('apis');

  if (!debug.isDebugMode) return null;

  const getStatusIcon = (status: APIStatus) => {
    switch (status) {
      case 'working':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'checking':
        return <RefreshCw className="h-4 w-4 animate-spin text-amber-400" />;
      default:
        return <HelpCircle className="h-4 w-4 text-white/40" />;
    }
  };

  const getStatusBadge = (status: APIStatus) => {
    switch (status) {
      case 'working':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 font-medium">WORKING</span>;
      case 'failed':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-400/20 text-red-300 font-medium">FAILED</span>;
      case 'checking':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-medium">CHECKING</span>;
      default:
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50 font-medium">UNKNOWN</span>;
    }
  };

  const getLogIcon = (type: DebugLog['type']) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-3 w-3 text-red-400" />;
      case 'warning':
        return <AlertCircle className="h-3 w-3 text-amber-400" />;
      case 'success':
        return <CheckCircle2 className="h-3 w-3 text-emerald-400" />;
      default:
        return <Terminal className="h-3 w-3 text-blue-400" />;
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="fixed top-20 right-4 z-50 w-96 max-h-[80vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 rounded-t-xl border border-amber-400/30 bg-slate-900/95 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-amber-400/20 flex items-center justify-center">
            <Bug className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">System Debug</h3>
            <p className="text-[10px] text-amber-400 font-medium uppercase tracking-wider">DEV MODE ENABLED</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 w-7 text-white/50 hover:text-white hover:bg-white/10"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => debug.toggleDebugMode()}
            className="h-7 w-7 text-white/50 hover:text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      {isExpanded && (
        <div className="flex border-x border-b border-white/10 bg-slate-900/95">
          {[
            { id: 'apis', icon: Server, label: 'APIs' },
            { id: 'logs', icon: Terminal, label: 'Logs' },
            { id: 'voice', icon: Mic2, label: 'Voice' },
            { id: 'coach', icon: Brain, label: 'Coach' },
            { id: 'actions', icon: Activity, label: 'Actions' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-amber-400 bg-amber-400/10 border-b-2 border-amber-400'
                  : 'text-white/50 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              <tab.icon className="h-3 w-3" />
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {isExpanded && (
        <div className="flex-1 overflow-hidden rounded-b-xl border-x border-b border-white/10 bg-slate-900/95 backdrop-blur-md">
          
          {/* APIs Tab */}
          {activeTab === 'apis' && (
            <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
              <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">AI APIs</div>
              {['gemini', 'openrouter', 'groq'].map((key) => {
                const api = debug.apis[key];
                return (
                  <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(api.status)}
                      <span className="text-sm text-white/80">{api.name}</span>
                    </div>
                    {getStatusBadge(api.status)}
                  </div>
                );
              })}

              <div className="text-[10px] text-white/40 uppercase tracking-wider mt-4 mb-2">TTS APIs</div>
              {['elevenlabs', 'smallest', 'camb', 'openai'].map((key) => {
                const api = debug.apis[key];
                return (
                  <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(api.status)}
                      <span className="text-sm text-white/80">{api.name}</span>
                    </div>
                    {getStatusBadge(api.status)}
                  </div>
                );
              })}

              <div className="text-[10px] text-white/40 uppercase tracking-wider mt-4 mb-2">STT APIs</div>
              {['assemblyai', 'deepgram'].map((key) => {
                const api = debug.apis[key];
                return (
                  <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(api.status)}
                      <span className="text-sm text-white/80">{api.name}</span>
                    </div>
                    {getStatusBadge(api.status)}
                  </div>
                );
              })}
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="flex flex-col h-64">
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                <span className="text-[10px] text-white/40">{debug.logs.length} logs</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={debug.clearLogs}
                  className="h-6 text-[10px] text-white/50 hover:text-red-400"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {debug.logs.length === 0 ? (
                  <div className="text-center text-white/30 text-sm py-8">No logs yet</div>
                ) : (
                  debug.logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-2 rounded text-xs border ${
                        log.type === 'error' 
                          ? 'bg-red-400/10 border-red-400/20 text-red-200' 
                          : log.type === 'warning'
                          ? 'bg-amber-400/10 border-amber-400/20 text-amber-200'
                          : log.type === 'success'
                          ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-200'
                          : 'bg-white/5 border-white/10 text-white/70'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {getLogIcon(log.type)}
                        <span className="font-medium">{log.source}</span>
                        <span className="text-white/40">• {formatTime(log.timestamp)}</span>
                      </div>
                      <p className="ml-5">{log.message}</p>
                      {log.details && (
                        <p className="ml-5 mt-1 text-white/50 text-[10px]">{log.details}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Voice Tab */}
          {activeTab === 'voice' && (
            <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
              <ElevenLabsTest />
              
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Last Attempt</div>
                <p className="text-sm text-white/80">
                  {debug.voiceDebug.lastAttempt || 'No attempts yet'}
                </p>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Provider Used</div>
                <p className="text-sm text-white/80">
                  {debug.voiceDebug.providerUsed ? (
                    <span className="text-emerald-400">{debug.voiceDebug.providerUsed}</span>
                  ) : (
                    'None'
                  )}
                </p>
              </div>

              {debug.voiceDebug.lastError && (
                <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-3">
                  <div className="text-[10px] text-red-400 uppercase tracking-wider mb-2">❌ ERROR</div>
                  <p className="text-sm text-red-200">{debug.voiceDebug.lastError}</p>
                </div>
              )}

              {!debug.voiceDebug.lastError && debug.voiceDebug.providerUsed && (
                <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3">
                  <div className="text-[10px] text-emerald-400 uppercase tracking-wider mb-2">✅ SUCCESS</div>
                  <p className="text-sm text-emerald-200">Voice synthesis completed successfully</p>
                </div>
              )}
            </div>
          )}

          {/* Coach Tab */}
          {activeTab === 'coach' && (
            <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/40 uppercase tracking-wider">Status</span>
                {debug.coachDebug.isRunning ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Running
                  </span>
                ) : (
                  <span className="text-[10px] text-white/50">Idle</span>
                )}
              </div>

              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Last Trigger</div>
                <p className="text-sm text-white/80">
                  {debug.coachDebug.lastTrigger 
                    ? formatTime(debug.coachDebug.lastTrigger)
                    : 'Never'
                  }
                </p>
              </div>

              {debug.coachDebug.lastResponse && (
                <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3">
                  <div className="text-[10px] text-emerald-400 uppercase tracking-wider mb-2">✅ RESPONSE RECEIVED</div>
                  <pre className="text-xs text-emerald-200 overflow-x-auto">
                    {JSON.stringify(debug.coachDebug.lastResponse, null, 2)}
                  </pre>
                </div>
              )}

              {debug.coachDebug.lastError && (
                <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-3">
                  <div className="text-[10px] text-red-400 uppercase tracking-wider mb-2">❌ COACH FAILED</div>
                  <p className="text-sm text-red-200">{debug.coachDebug.lastError}</p>
                </div>
              )}
            </div>
          )}

          {/* Actions Tab */}
          {activeTab === 'actions' && (
            <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Last API Used</div>
                <p className="text-sm text-white/80">
                  {debug.lastAPIUsed ? (
                    <span className="text-amber-400 font-medium">{debug.lastAPIUsed}</span>
                  ) : (
                    'None'
                  )}
                </p>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Last AI Request</div>
                {debug.lastAIRequest ? (
                  <pre className="text-xs text-white/70 overflow-x-auto max-h-20">
                    {JSON.stringify(debug.lastAIRequest, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-white/50">No requests yet</p>
                )}
              </div>

              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Last AI Response</div>
                {debug.lastAIResponse ? (
                  <pre className="text-xs text-white/70 overflow-x-auto max-h-20">
                    {JSON.stringify(debug.lastAIResponse, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-white/50">No responses yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
