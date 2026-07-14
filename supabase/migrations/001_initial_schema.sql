-- =========================================================
-- 1. TABLES
-- =========================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grammar_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vocabulary_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- แยก SRS ออกจาก vocabulary เพื่อไม่ให้ข้อมูลปนกัน
CREATE TABLE IF NOT EXISTS public.srs_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- 2. ENABLE RLS
-- =========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.srs_progress ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 3. PRIVILEGES
-- =========================================================

-- ปิดสิทธิ์เดิมก่อน เพื่อป้องกันสิทธิ์กว้างเกินไป
REVOKE ALL ON TABLE public.profiles FROM anon, authenticated;
REVOKE ALL ON TABLE public.grammar_progress FROM anon, authenticated;
REVOKE ALL ON TABLE public.vocabulary_progress FROM anon, authenticated;
REVOKE ALL ON TABLE public.srs_progress FROM anon, authenticated;

-- Profiles
GRANT SELECT ON TABLE public.profiles TO authenticated;

-- อนุญาตสร้าง Profile แต่ห้ามกำหนด role เอง
GRANT INSERT (id, email, display_name)
ON TABLE public.profiles
TO authenticated;

-- อนุญาตแก้เฉพาะชื่อ
GRANT UPDATE (display_name)
ON TABLE public.profiles
TO authenticated;

-- Progress
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.grammar_progress
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.vocabulary_progress
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.srs_progress
TO authenticated;

-- =========================================================
-- 4. RLS POLICIES
-- =========================================================

-- ลบ Policy เดิมแบบหมดจดเพื่อความปลอดภัย (Idempotent)
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'profiles',
        'grammar_progress',
        'vocabulary_progress',
        'srs_progress'
      )
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

-- สร้างใหม่
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND (SELECT auth.uid()) = id
);

CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL
  AND (SELECT auth.uid()) = id
);

CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND (SELECT auth.uid()) = id
)
WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL
  AND (SELECT auth.uid()) = id
);

CREATE POLICY "grammar_manage_own"
ON public.grammar_progress
FOR ALL
TO authenticated
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND (SELECT auth.uid()) = user_id
)
WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL
  AND (SELECT auth.uid()) = user_id
);

CREATE POLICY "vocabulary_manage_own"
ON public.vocabulary_progress
FOR ALL
TO authenticated
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND (SELECT auth.uid()) = user_id
)
WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL
  AND (SELECT auth.uid()) = user_id
);

CREATE POLICY "srs_manage_own"
ON public.srs_progress
FOR ALL
TO authenticated
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND (SELECT auth.uid()) = user_id
)
WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL
  AND (SELECT auth.uid()) = user_id
);

-- =========================================================
-- 5. UPDATED_AT TRIGGER
-- =========================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS grammar_progress_set_updated_at ON public.grammar_progress;
CREATE TRIGGER grammar_progress_set_updated_at
BEFORE UPDATE ON public.grammar_progress
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS vocabulary_progress_set_updated_at ON public.vocabulary_progress;
CREATE TRIGGER vocabulary_progress_set_updated_at
BEFORE UPDATE ON public.vocabulary_progress
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS srs_progress_set_updated_at ON public.srs_progress;
CREATE TRIGGER srs_progress_set_updated_at
BEFORE UPDATE ON public.srs_progress
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 6. CREATE PROFILE AFTER SIGNUP
-- =========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    display_name
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name',
      ''
    )
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
