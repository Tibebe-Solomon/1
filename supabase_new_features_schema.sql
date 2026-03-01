-- =========================================================
-- Vynthen AI — New Features SQL Schema
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- =========================================================


-- ── 1. LIBRARY (Cloud-synced saved responses) ─────────────
-- Migrates Library from localStorage to Supabase so it
-- persists across devices and browsers.

CREATE TABLE IF NOT EXISTS library_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder       text NOT NULL DEFAULT 'Uncategorized',
  content      text NOT NULL,
  source_conv  uuid REFERENCES conversations(id) ON DELETE SET NULL,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS library_items_user_id_idx ON library_items (user_id);
CREATE INDEX IF NOT EXISTS library_items_folder_idx  ON library_items (folder);

ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_library"
  ON library_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ── 2. PINNED MESSAGES ────────────────────────────────────
-- Lets users pin important messages inside a conversation.

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS pinned boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS messages_pinned_idx ON messages (conversation_id, pinned)
  WHERE pinned = true;


-- ── 3. MESSAGE REACTIONS ──────────────────────────────────
-- Upvote/downvote or emoji react to any AI message.

CREATE TABLE IF NOT EXISTS message_reactions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction   text NOT NULL, -- e.g. 'thumbs_up', 'thumbs_down', '❤️'
  created_at timestamptz DEFAULT now(),
  UNIQUE (message_id, user_id, reaction)
);

ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_manage_own_reactions"
  ON message_reactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ── 4. USER PROFILE / PREFERENCES ────────────────────────
-- Stores persistent user preferences that survive localStorage clears.

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme       text DEFAULT 'dark',
  language    text DEFAULT 'en',
  personality text DEFAULT 'balanced',
  voice       text DEFAULT 'casual',
  depth       text DEFAULT 'balanced',
  focus       text DEFAULT 'default',
  duality     boolean DEFAULT false,
  custom_instructions text DEFAULT '',
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_preferences"
  ON user_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ── 5. CONVERSATION FOLDERS (Vault enhancement) ───────────
-- Adds optional color and emoji to Vault projects for visual org.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS color text DEFAULT '#888888',
  ADD COLUMN IF NOT EXISTS emoji text DEFAULT '📁',
  ADD COLUMN IF NOT EXISTS description text;


-- ── 6. CONVERSATION SEARCH INDEX ──────────────────────────
-- Full-text search across all your conversations.

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED;

CREATE INDEX IF NOT EXISTS messages_search_idx
  ON messages USING gin(search_vector);
