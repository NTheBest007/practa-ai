'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { Loader as Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SignupPage() {
  const { signUp, signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) setReferralCode(ref);
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password);
    if (error) {
      setLoading(false);
      toast.error(error);
      return;
    }
    const r = await signIn(email, password);
    setLoading(false);
    if (r.error) {
      toast.error(r.error);
      return;
    }
    // Track referral if code present
    if (referralCode) {
      try {
        const session = await (await import('@/lib/supabase')).supabase.auth.getSession();
        const userId = session.data.session?.user?.id;
        if (userId) {
          await fetch('/api/affiliate/track-referral', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ referralCode, userId }),
          });
        }
      } catch (e) {
        console.error('Referral tracking error:', e);
      }
    }
    router.push('/dashboard');
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start your first practice session in under a minute."
      footer={
        <>
          Already training?{' '}
          <Link href="/login" className="text-emerald-300 hover:text-emerald-200">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 bg-black/30 border-white/10 focus-visible:ring-emerald-400/40"
            placeholder="you@company.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 bg-black/30 border-white/10 focus-visible:ring-emerald-400/40"
            placeholder="At least 6 characters"
          />
        </div>
        {referralCode && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-3 py-2">
            <span className="text-xs text-emerald-300">Referred by:</span>
            <code className="text-xs font-mono text-white/70">{referralCode}</code>
          </div>
        )}
        <Button type="submit" disabled={loading} className="btn-glow h-11 w-full rounded-xl font-semibold">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create account'}
        </Button>
      </form>
    </AuthShell>
  );
}
