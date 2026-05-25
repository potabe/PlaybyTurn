-- ============================================================
-- Fix: "Database error saving new user"
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- ── FIX 1: Make the trigger function more robust ──────────────
-- Handles cases where full_name or email might be null/empty
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),  -- GitHub sends 'name'
      SPLIT_PART(COALESCE(NEW.email, 'user'), '@', 1)    -- fallback: email prefix
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'                  -- Google/GitHub avatar key
    )
  )
  ON CONFLICT (id) DO NOTHING;  -- safe to run multiple times
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ── FIX 2: Allow the trigger (service role) to insert profiles ─
-- Even with SECURITY DEFINER, explicit INSERT policy is safer
DROP POLICY IF EXISTS "profiles_insert_trigger" ON profiles;
CREATE POLICY "profiles_insert_trigger"
  ON profiles FOR INSERT
  WITH CHECK (true);  -- trigger runs as service role, so this is safe

-- ── VERIFY: Check that the trigger exists ─────────────────────
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
