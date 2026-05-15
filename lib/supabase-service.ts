import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

let adminClient: SupabaseClient | null = null;

/**
 * Server-only: use service role to read/write subscription and usage tables
 * from API routes (no end-user JWT). Falls back to anon client if
 * SUPABASE_SERVICE_ROLE_KEY is unset (local dev without key).
 */
export function getServiceSupabaseClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url) {
    return supabase;
  }
  if (!adminClient) {
    adminClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}
