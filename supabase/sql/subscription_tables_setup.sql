-- Practa AI: subscription + usage (run in Supabase SQL Editor as postgres)
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS where needed.

-- ---------------------------------------------------------------------------
-- 1. user_subscriptions (one row per auth user; Stripe webhook upserts here)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_type text NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'premium')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_subscriptions_user_id_key UNIQUE (user_id)
);

-- If an older table existed without UNIQUE(user_id), add it (Stripe upsert needs this).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.user_subscriptions'::regclass
      AND conname = 'user_subscriptions_user_id_key'
  ) THEN
    ALTER TABLE public.user_subscriptions
      ADD CONSTRAINT user_subscriptions_user_id_key UNIQUE (user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user
  ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_sub
  ON public.user_subscriptions(stripe_subscription_id);

-- ---------------------------------------------------------------------------
-- 2. scenario_usage (per scenario, per billing window)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scenario_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id uuid NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE,
  sessions_count int NOT NULL DEFAULT 0,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT scenario_usage_user_scenario_period_key UNIQUE (user_id, scenario_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_scenario_usage_user
  ON public.scenario_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_scenario_usage_scenario
  ON public.scenario_usage(scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_usage_period
  ON public.scenario_usage(user_id, scenario_id, period_start);

-- ---------------------------------------------------------------------------
-- 3. Row Level Security (client reads with user JWT)
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.user_subscriptions;

CREATE POLICY "Users can view own subscription"
  ON public.user_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON public.user_subscriptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON public.user_subscriptions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own scenario usage" ON public.scenario_usage;
DROP POLICY IF EXISTS "Users can insert own scenario usage" ON public.scenario_usage;
DROP POLICY IF EXISTS "Users can update own scenario usage" ON public.scenario_usage;

CREATE POLICY "Users can view own scenario usage"
  ON public.scenario_usage FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scenario usage"
  ON public.scenario_usage FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scenario usage"
  ON public.scenario_usage FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4. New signups: default free row (SECURITY DEFINER bypasses RLS)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_free_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan_type, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_free_subscription();

-- ---------------------------------------------------------------------------
-- 5. Backfill: existing users who have no subscription row yet
-- ---------------------------------------------------------------------------
INSERT INTO public.user_subscriptions (user_id, plan_type, status)
SELECT u.id, 'free', 'active'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_subscriptions s WHERE s.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;
