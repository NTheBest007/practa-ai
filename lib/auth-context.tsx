'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { initializeRevenueCat, changeUser } from './revenuecat';
import { Purchases } from '@revenuecat/purchases-js';

type SubscriptionData = {
  plan: 'free' | 'pro';
  status: string;
  usage: Record<string, number>;
  limits: Record<string, number>;
  totalUsed: number;
  totalLimit: number;
  currentPeriodEnd: string | null;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  subscription: SubscriptionData | null;
  subscriptionLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const fetchSubscription = useCallback(async (userId: string) => {
    setSubscriptionLoading(true);
    try {
      const res = await fetch('/api/subscription/check', {
        headers: {
          'x-user-id': userId,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
      } else {
        const detail = await res.text().catch(() => '');
        console.error(
          '[subscription/check]',
          res.status,
          detail.slice(0, 500)
        );
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
    setSubscriptionLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        // Initialize RevenueCat with user ID
        initializeRevenueCat(currentUser.id);
        fetchSubscription(currentUser.id);
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        // Initialize or update RevenueCat with new user ID
        initializeRevenueCat(currentUser.id);
        // Also explicitly change user in RevenueCat if already configured
        if (Purchases.isConfigured()) {
          await changeUser(currentUser.id);
        }
        fetchSubscription(currentUser.id);
      } else {
        setSubscription(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [fetchSubscription]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSubscription(null);
  }, []);

  const refreshSubscription = useCallback(async () => {
    if (user) {
      await fetchSubscription(user.id);
    }
  }, [user, fetchSubscription]);

  const value = useMemo(
    () => ({
      user,
      loading,
      subscription,
      subscriptionLoading,
      signIn,
      signUp,
      signOut,
      refreshSubscription,
    }),
    [
      user,
      loading,
      subscription,
      subscriptionLoading,
      signIn,
      signUp,
      signOut,
      refreshSubscription,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
