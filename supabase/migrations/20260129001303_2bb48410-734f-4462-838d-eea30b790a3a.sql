-- 1) Approval status for profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'access_status' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.access_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END$$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS access_status public.access_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS approved_by UUID NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_access_status ON public.profiles (access_status);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Admins can view all profiles'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), ''admin''::public.app_role))';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Admins can update all profiles'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), ''admin''::public.app_role)) WITH CHECK (public.has_role(auth.uid(), ''admin''::public.app_role))';
  END IF;
END$$;

-- 2) Invite codes
CREATE TABLE IF NOT EXISTS public.invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ NULL,
  max_uses INTEGER NOT NULL DEFAULT 1,
  uses_count INTEGER NOT NULL DEFAULT 0,
  note TEXT NULL,
  CONSTRAINT invite_codes_code_unique UNIQUE (code)
);

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'invite_codes' AND policyname = 'Admins manage invite codes'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins manage invite codes" ON public.invite_codes FOR ALL USING (public.has_role(auth.uid(), ''admin''::public.app_role)) WITH CHECK (public.has_role(auth.uid(), ''admin''::public.app_role))';
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_invite_codes_active ON public.invite_codes (active);
CREATE INDEX IF NOT EXISTS idx_invite_codes_expires_at ON public.invite_codes (expires_at);

-- 3) Invite redemptions
CREATE TABLE IF NOT EXISTS public.invite_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id UUID NOT NULL REFERENCES public.invite_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT invite_redemptions_invite_user_unique UNIQUE (invite_id, user_id)
);

ALTER TABLE public.invite_redemptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'invite_redemptions' AND policyname = 'Users can insert own invite redemption'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can insert own invite redemption" ON public.invite_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'invite_redemptions' AND policyname = 'Users can view own invite redemptions'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view own invite redemptions" ON public.invite_redemptions FOR SELECT USING (auth.uid() = user_id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'invite_redemptions' AND policyname = 'Admins can view all invite redemptions'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can view all invite redemptions" ON public.invite_redemptions FOR SELECT USING (public.has_role(auth.uid(), ''admin''::public.app_role))';
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_invite_redemptions_user_id ON public.invite_redemptions (user_id);
CREATE INDEX IF NOT EXISTS idx_invite_redemptions_invite_id ON public.invite_redemptions (invite_id);
