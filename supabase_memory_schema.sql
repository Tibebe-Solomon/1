-- ===================================================
-- Vynthen AI — Phase 4 Features: Memory (Recall)
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ===================================================

-- 1. Create the memories table
CREATE TABLE IF NOT EXISTS memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Add index for fast retrieval per user
CREATE INDEX IF NOT EXISTS memories_user_id_idx ON memories (user_id);

-- 3. Enable RLS
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- 4. Create policies
CREATE POLICY "users_own_memories"
  ON memories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
