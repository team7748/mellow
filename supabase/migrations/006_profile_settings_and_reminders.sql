-- =========================================================
-- PROFILE SETTINGS, PRACTICE TIME, AND PUSH REMINDERS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_vocabulary_goal INTEGER NOT NULL DEFAULT 10
    CHECK (daily_vocabulary_goal BETWEEN 1 AND 200),
  daily_practice_minutes INTEGER NOT NULL DEFAULT 15
    CHECK (daily_practice_minutes BETWEEN 1 AND 240),
  reminder_enabled BOOLEAN NOT NULL DEFAULT false,
  reminder_time TIME NOT NULL DEFAULT '19:00',
  timezone TEXT NOT NULL DEFAULT 'Asia/Bangkok'
    CHECK (char_length(timezone) BETWEEN 1 AND 64),
  language TEXT NOT NULL DEFAULT 'th'
    CHECK (language IN ('th', 'en')),
  speech_locale TEXT NOT NULL DEFAULT 'en-US'
    CHECK (speech_locale IN ('en-US', 'en-GB')),
  speech_voice_uri TEXT,
  speech_rate NUMERIC NOT NULL DEFAULT 1
    CHECK (speech_rate BETWEEN 0.5 AND 2),
  speech_auto_play BOOLEAN NOT NULL DEFAULT false,
  theme TEXT NOT NULL DEFAULT 'system'
    CHECK (theme IN ('light', 'dark', 'system')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  last_notified_local_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx
  ON public.push_subscriptions (user_id);

CREATE INDEX IF NOT EXISTS user_preferences_reminder_enabled_idx
  ON public.user_preferences (user_id)
  WHERE reminder_enabled = true;

ALTER TABLE public.learning_activity_events
  DROP CONSTRAINT IF EXISTS learning_activity_events_kind_check;

ALTER TABLE public.learning_activity_events
  ADD CONSTRAINT learning_activity_events_kind_check
  CHECK (
    kind IN (
      'vocabulary_answer',
      'grammar_answer',
      'conversation_completed',
      'practice_time'
    )
  );

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.user_preferences FROM anon, authenticated;
REVOKE ALL ON TABLE public.push_subscriptions FROM anon, authenticated;

GRANT SELECT, INSERT ON TABLE public.user_preferences TO authenticated;
GRANT UPDATE (
  daily_vocabulary_goal,
  daily_practice_minutes,
  reminder_enabled,
  reminder_time,
  timezone,
  language,
  speech_locale,
  speech_voice_uri,
  speech_rate,
  speech_auto_play,
  theme
) ON TABLE public.user_preferences TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.push_subscriptions TO authenticated;

-- Migration 005 introduced avatar_url. Grant the two identity fields that
-- authenticated profile owners are allowed to maintain.
GRANT UPDATE (display_name, avatar_url)
  ON TABLE public.profiles TO authenticated;

DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('user_preferences', 'push_subscriptions')
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  END LOOP;
END;
$$;

CREATE POLICY "user_preferences_select_own"
  ON public.user_preferences
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_preferences_insert_own"
  ON public.user_preferences
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_preferences_update_own"
  ON public.user_preferences
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "push_subscriptions_select_own"
  ON public.push_subscriptions
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "push_subscriptions_insert_own"
  ON public.push_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "push_subscriptions_update_own"
  ON public.push_subscriptions
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "push_subscriptions_delete_own"
  ON public.push_subscriptions
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP TRIGGER IF EXISTS user_preferences_set_updated_at
  ON public.user_preferences;
CREATE TRIGGER user_preferences_set_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS push_subscriptions_set_updated_at
  ON public.push_subscriptions;
CREATE TRIGGER push_subscriptions_set_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
