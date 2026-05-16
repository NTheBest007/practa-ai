-- SQL Script to create 25 test accounts with pro plan
-- IMPORTANT: Run this in Supabase SQL Editor as a postgres user with proper permissions
-- The auth.users table requires the auth schema which has special permissions

-- Option 1: Use the supabase_auth.create_user function (recommended)
-- This requires the auth extension to be accessible

DO $$
DECLARE
    i INTEGER;
    user_id UUID;
    period_end TIMESTAMP;
    email_address TEXT;
BEGIN
    period_end := NOW() + INTERVAL '1 month';
    
    FOR i IN 1..25 LOOP
        email_address := 'test' || i || '@example.com';
        
        BEGIN
            -- Check if user already exists
            SELECT id INTO user_id 
            FROM auth.users 
            WHERE email = email_address;
            
            -- If not exists, we need to create via admin API
            -- Unfortunately, direct INSERT into auth.users requires auth admin permissions
            -- that are not available in the SQL Editor by default
            
            IF user_id IS NULL THEN
                RAISE NOTICE 'User % does not exist. Please use the TypeScript script with SUPABASE_SERVICE_ROLE_KEY', email_address;
                RAISE NOTICE 'Or manually create in Supabase Dashboard > Authentication > Users';
            ELSE
                RAISE NOTICE 'User % already exists with ID: %', email_address, user_id;
                
                -- Update/create subscription for existing user
                INSERT INTO user_subscriptions (
                    user_id,
                    plan_type,
                    status,
                    current_period_start,
                    current_period_end,
                    created_at,
                    updated_at
                )
                VALUES (
                    user_id,
                    'premium',
                    'active',
                    NOW(),
                    period_end,
                    NOW(),
                    NOW()
                )
                ON CONFLICT (user_id) DO UPDATE SET
                    plan_type = 'premium',
                    status = 'active',
                    current_period_end = period_end,
                    updated_at = NOW();
                    
                RAISE NOTICE 'Updated subscription to pro plan (1 month) for %', email_address;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error with %: %', email_address, SQLERRM;
        END;
    END LOOP;
END $$;

-- Verify created accounts
SELECT 
    u.email,
    u.email_confirmed_at,
    s.plan_type,
    s.status,
    s.current_period_end
FROM auth.users u
LEFT JOIN user_subscriptions s ON u.id = s.user_id
WHERE u.email LIKE 'test%@example.com'
ORDER BY u.email;
