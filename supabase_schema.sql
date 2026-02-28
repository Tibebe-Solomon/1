-- ===================================================
-- Vynthen AI — Supabase Production Schema Fix
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ===================================================

-- 1. Enable UUID generation 
create extension if not exists "uuid-ossp";

-- ===================================================
-- 2. FIX: Add user_id to the EXISTING conversations table
-- ===================================================
-- (Since the table already existed from phase 1, 'create table if not exists' 
-- skipped adding the column. We must ALTER the table to add it).
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add index to make queries fast
CREATE INDEX IF NOT EXISTS conversations_user_id_idx
  ON conversations (user_id, created_at DESC);

-- ===================================================
-- 3. APPLY SECURE ROW LEVEL SECURITY (RLS)
-- ===================================================
-- Drop the temporary open policies we created earlier
DROP POLICY IF EXISTS "public_conversations_all" ON conversations;
DROP POLICY IF EXISTS "public_messages_all" ON messages;

-- Enable RLS just to be sure
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create user-scoped policies (so users only see their own chats)
CREATE POLICY "users_own_conversations"
  ON conversations FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_messages"
  ON messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND c.user_id = auth.uid()
    )
  );

-- ===================================================
-- 4. INTEGRATIONS: Token Storage & Activity Log
-- ===================================================

-- Server-side OAuth token storage (never goes to localStorage)
CREATE TABLE IF NOT EXISTS integration_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, integration_id)
);
ALTER TABLE integration_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "users_own_integration_tokens"
  ON integration_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Integration action activity log
CREATE TABLE IF NOT EXISTS integration_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id text NOT NULL,
  action text NOT NULL,
  risk_level text NOT NULL,
  result_summary text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE integration_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "users_read_own_activity"
  ON integration_activity FOR SELECT
  USING (auth.uid() = user_id);

