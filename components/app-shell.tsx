'use client';

import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Logo } from './logo';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Sparkles, LogOut, Loader as Loader2, BarChart3, CreditCard, Users } from 'lucide-react';

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/scenarios', label: 'Scenarios', icon: Sparkles },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/affiliate', label: 'Affiliate', icon: Users },
    { href: '/pricing', label: 'Pricing', icon: CreditCard },
  ];

  return (
    <div className="relative min-h-screen">
      <div className="aurora" />
      <header className="sticky top-0 z-50 bg-[#070b0a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <div className="flex items-center justify-between">
            <Link href="/dashboard">
              <Logo />
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => {
                const active = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm transition-colors ${
                      active
                        ? 'bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-400/20'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="flex items-center gap-2">
              <div className="hidden text-sm text-white/60 md:block">{user.email}</div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white/70 hover:bg-white/5 hover:text-white"
                onClick={async () => {
                  await signOut();
                  router.push('/');
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="relative mx-auto max-w-7xl px-6 pb-24 pt-6">{children}</main>
    </div>
  );
}
