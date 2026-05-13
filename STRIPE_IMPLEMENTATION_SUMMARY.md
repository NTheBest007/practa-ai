# Stripe Subscription Implementation Summary

## ✅ COMPLETED - All Phases Implemented (Not Pushed to GitHub)

---

## What Was Built

### 1. Database Schema (Supabase Migration)
**File:** `supabase/migrations/20260511160000_subscription_tables.sql`

Created two new tables:
- **`user_subscriptions`** - Tracks user's plan (free/premium), Stripe IDs, billing period
- **`scenario_usage`** - Tracks call usage per scenario per billing period

Features:
- Row Level Security (RLS) policies for data protection
- Automatic free subscription creation for new users via trigger
- Indexes for performance

---

### 2. Stripe API Routes

#### `/api/stripe/checkout` (POST)
- Creates Stripe Checkout Session for premium upgrade
- Creates Stripe customer if doesn't exist
- Returns checkout URL for redirect

#### `/api/stripe/portal` (POST)
- Creates Stripe Customer Portal session
- For managing subscription (cancel, update payment)

#### `/api/webhooks/stripe` (POST)
- Handles Stripe webhook events:
  - `checkout.session.completed` → Upgrades user to premium
  - `invoice.payment_succeeded` → Extends billing period, resets usage
  - `invoice.payment_failed` → Marks past_due
  - `customer.subscription.updated` → Updates status
  - `customer.subscription.deleted` → Downgrades to free

#### `/api/subscription/check` (GET)
- Returns user's current subscription status
- Returns usage per scenario
- Returns limits and total usage

#### `/api/subscription/track-usage` (POST)
- Increments usage count when user starts session
- Creates new usage record for new billing period

---

### 3. Frontend Updates

#### Auth Context (`/lib/auth-context.tsx`)
- Added `subscription` state with real-time data
- Added `subscriptionLoading` state
- Added `refreshSubscription()` function
- Automatically fetches subscription on user login

#### Supabase Types (`/lib/supabase.ts`)
- Added `UserSubscription` type
- Added `ScenarioUsage` type

#### Pricing Page (`/app/pricing/page.tsx`)
- Shows Free vs Premium plans side by side
- Free: 1 call per scenario
- Premium: $19.99/month, 50 calls per scenario
- "Upgrade" button creates Stripe checkout
- "Manage" button opens customer portal (for premium users)
- Shows current plan status

#### Scenarios Page (`/app/scenarios/page.tsx`)
- Shows usage badge on each scenario card: "X/Y calls"
- Badge turns amber when at limit
- Tracks usage when starting session
- Shows "Start anyway" button when at limit (per your request)
- Usage info: `{used}/{limit} calls`

#### Dashboard Page (`/app/dashboard/page.tsx`)
- Shows subscription status card
- Free Plan: Shows Zap icon, call usage
- Premium Plan: Shows Crown icon, emerald styling, renewal date
- "Upgrade" or "Manage" button
- Shows total usage across all scenarios

#### App Navigation (`/components/app-shell.tsx`)
- Added "Pricing" link to main navigation
- Uses CreditCard icon

---

## Environment Variables Needed

Add these to `.env.local`:

```bash
# Stripe Keys (from Stripe Dashboard)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price ID (from Stripe Dashboard > Products)
NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID=price_xxxxxxxxxxxx

# Optional: For production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## Stripe Dashboard Setup Required

Before testing, you need to:

1. **Create Products & Prices in Stripe:**
   - Create Product: "Practa.ai Premium"
   - Create Price: $19.99/month recurring
   - Copy the Price ID (starts with `price_`)
   - Paste it in `.env.local` as `NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID`

2. **Get API Keys:**
   - Go to Stripe Dashboard → Developers → API keys
   - Copy Publishable key (starts with `pk_`)
   - Copy Secret key (starts with `sk_`)
   - Add to `.env.local`

3. **Setup Webhook:**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://your-app.vercel.app/api/webhooks/stripe` (or localhost for testing)
   - Select events:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy Signing secret (starts with `whsec_`)
   - Add to `.env.local` as `STRIPE_WEBHOOK_SECRET`

4. **For Local Testing:**
   - Install Stripe CLI
   - Run: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
   - Copy the webhook signing secret it gives you

---

## How It Works

### Free User Flow:
1. Signs up → Automatically gets free subscription
2. Sees "Free Plan" badge on dashboard
3. Sees "1/1 calls" on each scenario card
4. Can practice 1 time per scenario (3 total if 3 scenarios)
5. Can upgrade anytime via Pricing page

### Upgrade Flow:
1. User clicks "Upgrade" on Pricing page
2. Backend creates Stripe Checkout Session
3. User redirected to Stripe checkout
4. User enters payment info
5. Stripe redirects back to `/dashboard?subscription=success`
6. Webhook fires → User upgraded to premium
7. User sees "Premium Plan" with 50 calls per scenario

### Billing Cycle:
- Premium users get 50 calls per scenario every 30 days
- Usage resets automatically when new invoice paid
- User can manage/cancel subscription via "Manage" button

### Usage Tracking:
- Every time user starts session → usage incremented
- Tracked per scenario (e.g., 5/50 for Mark Davies, 3/50 for Jason Mercer)
- Shows usage badges in real-time

---

## Files Created/Modified

### New Files:
1. `supabase/migrations/20260511160000_subscription_tables.sql`
2. `app/api/stripe/checkout/route.ts`
3. `app/api/stripe/portal/route.ts`
4. `app/api/webhooks/stripe/route.ts`
5. `app/api/subscription/check/route.ts`
6. `app/api/subscription/track-usage/route.ts`
7. `app/pricing/page.tsx`

### Modified Files:
1. `lib/auth-context.tsx` - Added subscription state
2. `lib/supabase.ts` - Added new types
3. `app/scenarios/page.tsx` - Added usage tracking and badges
4. `app/dashboard/page.tsx` - Added subscription card
5. `components/app-shell.tsx` - Added Pricing link

---

## Testing Checklist

- [ ] Run migration in Supabase
- [ ] Add Stripe keys to `.env.local`
- [ ] Create Premium product & price in Stripe Dashboard
- [ ] Set up webhook endpoint in Stripe
- [ ] Test free user sees usage badges
- [ ] Test free user can start sessions
- [ ] Test upgrade flow creates checkout
- [ ] Test payment updates subscription to premium
- [ ] Test premium user sees 50 calls per scenario
- [ ] Test usage tracking increments correctly
- [ ] Test dashboard shows correct subscription info

---

## Next Steps (When You're Ready)

1. **Apply Supabase Migration:**
   ```bash
   supabase db push
   ```

2. **Test Locally:**
   - Add Stripe keys to `.env.local`
   - Run dev server: `npm run dev`
   - Test all flows

3. **Push to GitHub (When You Say):**
   ```bash
   git add -A
   git commit -m "Add Stripe subscription system with free and premium plans"
   git push origin main
   ```

4. **Deploy to Vercel:**
   - Add environment variables in Vercel dashboard
   - Deploy
   - Set up production webhook in Stripe

---

## Questions?

Everything is ready to test! Let me know when you want to:
- Push to GitHub
- Deploy to production
- Make any adjustments to the pricing or limits

**Status: ✅ Implementation Complete (Development Only)**
