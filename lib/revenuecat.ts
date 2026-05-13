// RevenueCat SDK Configuration and Utilities
import { Purchases, LogLevel } from '@revenuecat/purchases-js';

// RevenueCat API Key - Use your test key for development
const REVENUECAT_API_KEY = process.env.NEXT_PUBLIC_REVENUECAT_API_KEY || 'test_pSnYXhXQNVfxoihejeAAvsxmVIT';

// Entitlement ID for Practa.ai Pro
export const PRO_ENTITLEMENT_ID = 'Practa․ai Pro';

// Store singleton instance
let purchasesInstance: Purchases | null = null;

// Initialize RevenueCat
export function initializeRevenueCat(userId?: string): Purchases | null {
  if (typeof window === 'undefined') return null;
  
  // Return existing instance if already configured
  if (purchasesInstance) {
    return purchasesInstance;
  }
  
  // Return if already configured via getSharedInstance
  if (Purchases.isConfigured()) {
    purchasesInstance = Purchases.getSharedInstance();
    return purchasesInstance;
  }
  
  try {
    // Configure logging (disable in production)
    if (process.env.NODE_ENV === 'development') {
      Purchases.setLogLevel(LogLevel.Debug);
    }

    // Initialize with API key and user ID
    // Using legacy format: configure(apiKey, appUserId)
    purchasesInstance = Purchases.configure(REVENUECAT_API_KEY, userId || '');
    
    console.log('RevenueCat initialized successfully', userId ? `for user: ${userId}` : 'anonymously');
    return purchasesInstance;
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
    return null;
  }
}

// Get the Purchases instance
export function getPurchases(): Purchases | null {
  if (typeof window === 'undefined') return null;
  
  if (purchasesInstance) return purchasesInstance;
  
  if (Purchases.isConfigured()) {
    purchasesInstance = Purchases.getSharedInstance();
    return purchasesInstance;
  }
  
  return null;
}

// Get customer info (subscriptions, entitlements)
export async function getCustomerInfo(): Promise<{
  isPro: boolean;
  customerInfo: any;
  error: string | null;
}> {
  try {
    const purchases = Purchases.getSharedInstance();
    const customerInfo = await purchases.getCustomerInfo();
    
    // Check if user has Pro entitlement
    const isPro = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
    
    return {
      isPro,
      customerInfo,
      error: null,
    };
  } catch (error: any) {
    console.error('Error getting customer info:', error);
    return {
      isPro: false,
      customerInfo: null,
      error: error.message || 'Failed to get customer info',
    };
  }
}

// Get available offerings (products)
export async function getOfferings(): Promise<{
  offerings: any;
  currentOffering: any;
  error: string | null;
}> {
  try {
    const purchases = Purchases.getSharedInstance();
    const offerings = await purchases.getOfferings();
    
    return {
      offerings,
      currentOffering: offerings.current,
      error: null,
    };
  } catch (error: any) {
    console.error('Error getting offerings:', error);
    return {
      offerings: null,
      currentOffering: null,
      error: error.message || 'Failed to get offerings',
    };
  }
}

// Purchase a package - Web SDK uses checkout URL redirect
export async function purchasePackage(packageToPurchase: any): Promise<{
  success: boolean;
  customerInfo: any;
  error: string | null;
}> {
  try {
    // Debug: Log what we received
    console.log('Package to purchase:', packageToPurchase);
    console.log('Package keys:', packageToPurchase ? Object.keys(packageToPurchase) : 'undefined');
    
    // Check if package has web checkout URL
    if (!packageToPurchase?.webCheckoutURL) {
      // Try alternative approaches
      console.log('No webCheckoutURL, trying alternative methods...');
      
      // Check for offering-level web checkout URL
      if (packageToPurchase?.presentedOfferingContext?.webCheckoutURL) {
        console.log('Using offering-level webCheckoutURL');
        window.location.href = packageToPurchase.presentedOfferingContext.webCheckoutURL;
        return {
          success: true,
          customerInfo: null,
          error: null,
        };
      }
      
      // RevenueCat web billing not configured
      console.error('RevenueCat web checkout URL not available. Please configure web billing in RevenueCat dashboard.');
      return {
        success: false,
        customerInfo: null,
        error: 'Web checkout not configured. Please configure web billing in RevenueCat dashboard.',
      };
    }

    // Redirect to RevenueCat's web checkout
    console.log('Redirecting to:', packageToPurchase.webCheckoutURL);
    window.location.href = packageToPurchase.webCheckoutURL;
    
    // Note: For web, the purchase flow redirects away from the app.
    // The user will return after purchase, and we'll check their status then.
    return {
      success: true,
      customerInfo: null,
      error: null,
    };
  } catch (error: any) {
    console.error('Purchase error:', error);
    
    return {
      success: false,
      customerInfo: null,
      error: error.message || 'Failed to initiate purchase',
    };
  }
}

// Restore purchases is handled automatically by RevenueCat web SDK
// When user purchases on one device, they'll have the same entitlements on all devices
// Just call getCustomerInfo() to get latest entitlements

// Check subscription status
export async function checkSubscriptionStatus(): Promise<{
  isSubscribed: boolean;
  plan: 'free' | 'premium';
  expiresAt: string | null;
  error: string | null;
}> {
  try {
    const { isPro, customerInfo, error } = await getCustomerInfo();
    
    if (error) {
      return {
        isSubscribed: false,
        plan: 'free',
        expiresAt: null,
        error,
      };
    }
    
    if (!isPro) {
      return {
        isSubscribed: false,
        plan: 'free',
        expiresAt: null,
        error: null,
      };
    }
    
    // Get Pro entitlement details
    const proEntitlement = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID];
    const expiresAt = proEntitlement?.expirationDate || null;
    
    return {
      isSubscribed: true,
      plan: 'premium',
      expiresAt,
      error: null,
    };
  } catch (error: any) {
    return {
      isSubscribed: false,
      plan: 'free',
      expiresAt: null,
      error: error.message || 'Failed to check subscription',
    };
  }
}

// Change user ID (for when user logs in/out)
export async function changeUser(userId: string): Promise<{
  success: boolean;
  customerInfo: any;
  error: string | null;
}> {
  try {
    const purchases = Purchases.getSharedInstance();
    const customerInfo = await purchases.changeUser(userId);
    
    console.log(`User changed to: ${userId}`);
    
    return {
      success: true,
      customerInfo,
      error: null,
    };
  } catch (error: any) {
    console.error('Change user error:', error);
    return {
      success: false,
      customerInfo: null,
      error: error.message || 'Failed to change user',
    };
  }
}

// Present paywall using current offering
export async function presentPaywall(): Promise<{
  presented: boolean;
  error: string | null;
}> {
  try {
    const purchases = Purchases.getSharedInstance();
    
    // Check if paywall is available
    const offerings = await purchases.getOfferings();
    if (!offerings.current) {
      return {
        presented: false,
        error: 'No offerings available',
      };
    }
    
    // Present paywall with current offering
    await purchases.presentPaywall({ offering: offerings.current });
    
    return {
      presented: true,
      error: null,
    };
  } catch (error: any) {
    console.error('Paywall error:', error);
    return {
      presented: false,
      error: error.message || 'Failed to present paywall',
    };
  }
}

// Open customer portal URL (for managing subscriptions)
export function getCustomerPortalUrl(): string {
  // RevenueCat web SDK doesn't have a built-in customer center
  // We'll create a custom one or use Stripe's customer portal
  // This returns the URL to your billing management page
  return '/billing';
}
