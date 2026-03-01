-- =========================================================
-- Vynthen AI — Web Surf Feature SQL Schema
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- =========================================================

-- ── WEB SEARCH LOGS ───────────────────────────────────────
-- Stores a record of every Tavily web search performed.
-- Useful for analytics, history, and future "search memory".

CREATE TABLE IF NOT EXISTS web_search_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  query           text NOT NULL,
  answer_summary  text,                   -- Tavily's auto-generated answer
  source_count    int DEFAULT 0,          -- How many sources were returned
  sources         jsonb DEFAULT '[]',     -- Array of {title, url, snippet}
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS web_search_logs_user_id_idx ON web_search_logs (user_id);
CREATE INDEX IF NOT EXISTS web_search_logs_conversation_id_idx ON web_search_logs (conversation_id);
CREATE INDEX IF NOT EXISTS web_search_logs_created_at_idx ON web_search_logs (created_at DESC);

-- Row Level Security: users can only view their own search logs
ALTER TABLE web_search_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_searches"
  ON web_search_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "service_role_insert_searches"
  ON web_search_logs FOR INSERT
  WITH CHECK (true); -- Insert done server-side via service role


-- ── OPTIONAL: Add web_search_used flag to messages ────────
-- Lets you know which AI messages were generated with web search on.

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS web_search_used boolean DEFAULT false;
