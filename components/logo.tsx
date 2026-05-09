/* eslint-disable @next/next/no-img-element */
import { cn } from '@/lib/utils';

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <img
        src="/image copy copy copy copy.png"
        alt="Practa AI"
        width={32}
        height={32}
        className="h-8 w-8 rounded-full object-cover"
      />
      {showText && (
        <span className="text-lg font-semibold tracking-tight">
          practa<span className="text-emerald-400">.ai</span>
        </span>
      )}
    </div>
  );
}
