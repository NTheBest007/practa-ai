import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Scenario = {
  id: string;
  name: string;
  description: string;
  google_doc_content: string;
  avatar_url: string;
  created_at: string;
};

export type Session = {
  id: string;
  user_id: string;
  scenario_id: string;
  feedback: {
    strengths?: string[];
    weaknesses?: string[];
    suggestions?: string[];
    summary?: string;
  } | null;
  score: number;
  created_at: string;
};

export type Message = {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

export type UserAnalytics = {
  id: string;
  user_id: string;
  category_scores?: Record<string, any>;
  total_sessions: number;
  average_score: number;
  total_practice_time: number;
  best_score: number;
  worst_score: number;
  improvement_rate: number;
  created_at: string;
  updated_at: string;
};

export type SkillProgression = {
  id: string;
  user_id: string;
  category: string;
  score: number;
  session_id: string;
  created_at: string;
};

export type UserSubscription = {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_type: 'free' | 'premium';
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

export type ScenarioUsage = {
  id: string;
  user_id: string;
  scenario_id: string;
  sessions_count: number;
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
};
