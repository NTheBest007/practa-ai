'use client';

import { useState } from 'react';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
        <Button type="submit" disabled={loading} className="btn-glow h-11 w-full rounded-xl font-semibold">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create account'}
        </Button>
      </form>
    </AuthShell>
  );
}
