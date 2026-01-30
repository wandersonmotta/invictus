-- Expand waitlist leads payload
ALTER TABLE public.waitlist_leads
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS phone text;

-- Tighten public insert policy to require name + phone + email (basic validation)
DO $$
BEGIN
  -- Recreate policy safely
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'waitlist_leads'
      AND policyname = 'Anyone can join waitlist'
  ) THEN
    EXECUTE 'DROP POLICY "Anyone can join waitlist" ON public.waitlist_leads';
  END IF;
END $$;

CREATE POLICY "Anyone can join waitlist"
ON public.waitlist_leads
FOR INSERT
WITH CHECK (
  -- email must look like an email
  (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$')
  AND length(email) <= 255

  -- full_name required
  AND (full_name IS NOT NULL)
  AND (btrim(full_name) <> '')
  AND length(btrim(full_name)) BETWEEN 3 AND 120

  -- phone required (digits only)
  AND (phone IS NOT NULL)
  AND (phone ~ '^[0-9]{10,13}$')
);
