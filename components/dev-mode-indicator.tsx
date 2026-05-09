'use client';

import { useDebug } from '@/lib/debug-context';
import { Bug, X } from 'lucide-react';

export function DevModeIndicator() {
  const debug = useDebug();

  if (!debug.isDebugMode) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full border border-amber-400/30 bg-amber-400/10 backdrop-blur-md">
      <Bug className="h-4 w-4 text-amber-400" />
      <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
        DEV MODE ENABLED
      </span>
      <button
        onClick={() => debug.toggleDebugMode()}
        className="ml-2 text-amber-400/60 hover:text-amber-400"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
