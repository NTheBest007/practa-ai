import Link from 'next/link';
import { ReactNode } from 'react';
import { Logo } from './logo';

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="aurora" />
      <div className="absolute inset-0 grid-pattern opacity-40" />
      <div className="relative mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/">
          <Logo />
        </Link>
      </div>
      <div className="relative flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="glass glow-border rounded-3xl p-8">
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-white/60">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
          <div className="mt-6 text-center text-sm text-white/60">{footer}</div>
        </div>
      </div>
    </div>
  );
}
