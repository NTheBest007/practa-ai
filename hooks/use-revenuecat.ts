'use client';

import { useEffect, useState, useCallback } from 'react';
import { Purchases } from '@revenuecat/purchases-js';
import {
  initializeRevenueCat,
  getCustomerInfo,
  getOfferings,
  purchasePackage,
  presentPaywall,
  PRO_ENTITLEMENT_ID,
  changeUser,
} from '@/lib/revenuecat';
import { useAuth } from '@/lib/auth-context';

export type SubscriptionStatus = {
  isSubscribed: boolean;
  plan: 'free' | 'pro';
  isLoading: boolean;
  error: string | null;
  expiresAt: Date | null;
  managementURL: string | null;
};

export function useRevenueCat() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>({
    isSubscribed: false,
    plan: 'free',
    isLoading: true,
    error: null,
    expiresAt: null,
    managementURL: null,
  });
  const [offerings, setOfferings] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize RevenueCat when user changes
  useEffect(() => {
    if (!user) {
      setStatus(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const init = async () => {
      try {
        // Initialize with user ID
        initializeRevenueCat(user.id);
        
        // Update user if already configured
        if (typeof window !== 'undefined' && Purchases.isConfigured()) {
          await changeUser(user.id);
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize RevenueCat:', error);
      }
    };

    init();
  }, [user?.id]);

  // Fetch subscription status
  const refreshStatus = useCallback(async () => {
    if (!isInitialized || !user) return;

    setStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { isPro, customerInfo, error } = await getCustomerInfo();

      if (error) {
        setStatus(prev => ({
          ...prev,
          isLoading: false,
          error,
        }));
        return;
      }

      const proEntitlement = customerInfo?.entitlements?.active?.[PRO_ENTITLEMENT_ID];

      setStatus({
        isSubscribed: isPro,
        plan: isPro ? 'pro' : 'free',
        isLoading: false,
        error: null,
        expiresAt: proEntitlement?.expirationDate || null,
        managementURL: customerInfo?.managementURL || null,
      });
    } catch (error: any) {
      setStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to check subscription',
      }));
    }
  }, [isInitialized, user]);

  // Fetch offerings (products)
  const refreshOfferings = useCallback(async () => {
    if (!isInitialized) return;

    try {
      const { offerings: data, error } = await getOfferings();
      if (!error) {
        setOfferings(data);
      }
    } catch (error) {
      console.error('Failed to fetch offerings:', error);
    }
  }, [isInitialized]);

  // Initial status check
  useEffect(() => {
    if (isInitialized) {
      refreshStatus();
      refreshOfferings();
    }
  }, [isInitialized, refreshStatus, refreshOfferings]);

  // Purchase a package
  const purchase = useCallback(async (pkg: any) => {
    const result = await purchasePackage(pkg);
    
    // For web billing, the user will be redirected away from the app
    // We don't refresh status here since the redirect will happen immediately
    // Status will be refreshed when the user returns to the app
    
    return result;
  }, []);

  // Present paywall
  const showPaywall = useCallback(async () => {
    const result = await presentPaywall();
    
    if (result.presented) {
      // Refresh status after paywall closes
      await refreshStatus();
    }
    
    return result;
  }, [refreshStatus]);

  return {
    status,
    offerings,
    isInitialized,
    refreshStatus,
    refreshOfferings,
    purchase,
    showPaywall,
  };
}
