/**
 * Script to create 25 test accounts with pro plan subscription
 * Run with: npx tsx scripts/create-test-accounts.ts
 * 
 * Make sure you have set these environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (get from Supabase Dashboard > Project Settings > API)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  process.exit(1);
}

// Create admin client with service role
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const TEST_ACCOUNTS = 25;
const PASSWORD = 'Test123!';

async function createTestAccounts() {
  console.log(`Creating ${TEST_ACCOUNTS} test accounts with pro plan...\n`);

  const createdAccounts: Array<{ email: string; userId: string }> = [];
  const errors: Array<{ email: string; error: string }> = [];

  for (let i = 1; i <= TEST_ACCOUNTS; i++) {
    const email = `test${i}@example.com`;

    try {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: PASSWORD,
        email_confirm: true, // Auto-confirm email
      });

      if (authError) {
        if (authError.message.includes('already been registered')) {
          console.log(`  ⚠️  ${email} - Already exists, skipping`);
          continue;
        }
        throw new Error(`Auth error: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('No user returned from auth creation');
      }

      const userId = authData.user.id;

      // Step 2: Update to pro subscription (premium plan)
      const periodEnd = new Date();
      periodEnd.setFullYear(periodEnd.getFullYear() + 1); // 1 year from now

      const { error: subError } = await supabaseAdmin
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          plan_type: 'premium', // 'pro' is stored as 'premium' in DB
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (subError) {
        throw new Error(`Subscription error: ${subError.message}`);
      }

      createdAccounts.push({ email, userId });
      console.log(`  ✓ ${email} - Created with pro plan`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      errors.push({ email, error: errorMessage });
      console.error(`  ✗ ${email} - Error: ${errorMessage}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total accounts created: ${createdAccounts.length}`);
  console.log(`Errors: ${errors.length}`);

  if (createdAccounts.length > 0) {
    console.log('\n✓ Successfully created accounts:');
    createdAccounts.forEach(acc => {
      console.log(`  - ${acc.email} (ID: ${acc.userId.slice(0, 8)}...)`);
    });
  }

  if (errors.length > 0) {
    console.log('\n✗ Failed accounts:');
    errors.forEach(err => {
      console.log(`  - ${err.email}: ${err.error}`);
    });
  }

  console.log(`\n🔑 All accounts use password: ${PASSWORD}`);
  console.log('📝 You can log in at: http://localhost:3000/login');
}

// Run the script
createTestAccounts()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
