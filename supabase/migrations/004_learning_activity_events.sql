-- =========================================================
-- LOCAL-FIRST LEARNING ACTIVITY EVENT LEDGER
-- Migration 003 remains reserved for Quiz History.
-- =========================================================

CREATE TABLE IF NOT EXISTS public.learning_activity_events (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  mode TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  local_date DATE NOT NULL,
  timezone_offset_minutes INTEGER NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT learning_activity_events_kind_check
    CHECK (kind IN ('vocabulary_answer', 'grammar_answer', 'conversation_completed')),
  CONSTRAINT learning_activity_events_mode_check
    CHECK (mode IN ('flashcard', 'quiz', 'grammar', 'speak')),
  CONSTRAINT learning_activity_events_timezone_offset_check
    CHECK (timezone_offset_minutes BETWEEN -840 AND 840)
);

ALTER TABLE public.learning_activity_events
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS kind TEXT,
  ADD COLUMN IF NOT EXISTS mode TEXT,
  ADD COLUMN IF NOT EXISTS entity_id TEXT,
  ADD COLUMN IF NOT EXISTS occurred_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS local_date DATE,
  ADD COLUMN IF NOT EXISTS timezone_offset_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.learning_activity_events
    WHERE id IS NULL
      OR user_id IS NULL
      OR kind IS NULL
      OR mode IS NULL
      OR entity_id IS NULL
      OR occurred_at IS NULL
      OR local_date IS NULL
      OR timezone_offset_minutes IS NULL
      OR metadata IS NULL
      OR created_at IS NULL
  ) THEN
    RAISE EXCEPTION
      'learning_activity_events contains null required fields; backfill existing rows before applying migration';
  END IF;
END;
$$;

ALTER TABLE public.learning_activity_events
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN kind SET NOT NULL,
  ALTER COLUMN mode SET NOT NULL,
  ALTER COLUMN entity_id SET NOT NULL,
  ALTER COLUMN occurred_at SET NOT NULL,
  ALTER COLUMN local_date SET NOT NULL,
  ALTER COLUMN timezone_offset_minutes SET NOT NULL,
  ALTER COLUMN metadata SET NOT NULL,
  ALTER COLUMN created_at SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'learning_activity_events_kind_check'
      AND conrelid = 'public.learning_activity_events'::regclass
  ) THEN
    ALTER TABLE public.learning_activity_events
      ADD CONSTRAINT learning_activity_events_kind_check
      CHECK (kind IN ('vocabulary_answer', 'grammar_answer', 'conversation_completed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'learning_activity_events_mode_check'
      AND conrelid = 'public.learning_activity_events'::regclass
  ) THEN
    ALTER TABLE public.learning_activity_events
      ADD CONSTRAINT learning_activity_events_mode_check
      CHECK (mode IN ('flashcard', 'quiz', 'grammar', 'speak'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'learning_activity_events_timezone_offset_check'
      AND conrelid = 'public.learning_activity_events'::regclass
  ) THEN
    ALTER TABLE public.learning_activity_events
      ADD CONSTRAINT learning_activity_events_timezone_offset_check
      CHECK (timezone_offset_minutes BETWEEN -840 AND 840);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS learning_activity_events_user_local_date_idx
  ON public.learning_activity_events (user_id, local_date);

ALTER TABLE public.learning_activity_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.learning_activity_events FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.learning_activity_events TO authenticated;

DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'learning_activity_events'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.learning_activity_events',
      policy_record.policyname
    );
  END LOOP;
END;
$$;

CREATE POLICY "learning_activity_events_select_own"
  ON public.learning_activity_events
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);

CREATE POLICY "learning_activity_events_insert_own"
  ON public.learning_activity_events
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);

CREATE POLICY "learning_activity_events_update_own"
  ON public.learning_activity_events
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);

CREATE POLICY "learning_activity_events_delete_own"
  ON public.learning_activity_events
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);
