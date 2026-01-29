-- Add first_name / last_name to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text;

-- Backfill from legacy display_name (best-effort)
UPDATE public.profiles
SET
  first_name = COALESCE(first_name, NULLIF((regexp_split_to_array(btrim(display_name), '\\s+'))[1], '')),
  last_name = COALESCE(
    last_name,
    NULLIF(
      array_to_string(
        (regexp_split_to_array(btrim(display_name), '\\s+'))[2:array_length(regexp_split_to_array(btrim(display_name), '\\s+'), 1)],
        ' '
      ),
      ''
    )
  )
WHERE display_name IS NOT NULL
  AND btrim(display_name) <> ''
  AND (first_name IS NULL OR last_name IS NULL);

-- Keep legacy display_name in sync with first/last name
CREATE OR REPLACE FUNCTION public.sync_profiles_display_name()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Normalize blanks to NULL
  IF NEW.first_name IS NOT NULL AND btrim(NEW.first_name) = '' THEN
    NEW.first_name := NULL;
  ELSE
    NEW.first_name := btrim(NEW.first_name);
  END IF;

  IF NEW.last_name IS NOT NULL AND btrim(NEW.last_name) = '' THEN
    NEW.last_name := NULL;
  ELSE
    NEW.last_name := btrim(NEW.last_name);
  END IF;

  -- If first/last were provided, compute display_name
  IF NEW.first_name IS NOT NULL OR NEW.last_name IS NOT NULL THEN
    NEW.display_name := NULLIF(btrim(concat_ws(' ', NEW.first_name, NEW.last_name)), '');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profiles_display_name ON public.profiles;
CREATE TRIGGER trg_sync_profiles_display_name
BEFORE INSERT OR UPDATE OF first_name, last_name
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profiles_display_name();
