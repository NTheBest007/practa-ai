/*
  # Practa AI Initial Schema

  1. New Tables
    - `scenarios` - Sales roleplay scenarios
      - `id` (uuid, primary key)
      - `name` (text) - Scenario name/title
      - `description` (text) - Short description shown on cards
      - `google_doc_content` (text) - Full context for AI behavior
      - `avatar_url` (text) - AI prospect avatar image URL
      - `created_at` (timestamptz)
    - `sessions` - Practice sessions per user/scenario
      - `id` (uuid)
      - `user_id` (uuid) references auth.users
      - `scenario_id` (uuid) references scenarios
      - `feedback` (jsonb) - Structured coaching feedback
      - `score` (int) - Session score 0-100
      - `created_at` (timestamptz)
    - `messages` - Chat messages within a session
      - `id` (uuid)
      - `session_id` (uuid) references sessions
      - `role` (text) - 'user' or 'assistant'
      - `content` (text)
      - `created_at` (timestamptz)

  2. Security
    - RLS enabled on all tables
    - Scenarios: readable by any authenticated user
    - Sessions & messages: only accessible by owning user
*/

CREATE TABLE IF NOT EXISTS scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  google_doc_content text NOT NULL DEFAULT '',
  avatar_url text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id uuid NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  feedback jsonb DEFAULT '{}'::jsonb,
  score int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);

ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view scenarios"
  ON scenarios FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert scenarios"
  ON scenarios FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view own sessions"
  ON sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON sessions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = messages.session_id
    AND sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own messages"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = messages.session_id
    AND sessions.user_id = auth.uid()
  ));
