-- ===================================================
-- Vynthen AI — Phase 4 Features: Vault (Projects)
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ===================================================

-- 1. Create the projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  system_prompt text,
  created_at timestamptz DEFAULT now()
);

-- 2. Add index for fast retrieval per user
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects (user_id);

-- 3. Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 4. Create policies
CREATE POLICY "users_own_projects"
  ON projects FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Link conversations to projects
-- Add project_id column to conversations table
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS conversations_project_id_idx ON conversations (project_id);
