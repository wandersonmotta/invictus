-- Add archive fields to invite_codes
ALTER TABLE public.invite_codes
  ADD COLUMN IF NOT EXISTS archived_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS archived_by uuid NULL;

-- Index to speed up filtering/listing archived
CREATE INDEX IF NOT EXISTS idx_invite_codes_archived_at
  ON public.invite_codes (archived_at);

-- Validation + consistency rules for archiving
CREATE OR REPLACE FUNCTION public.invite_codes_validate_archive()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If trying to archive now
  IF NEW.archived_at IS NOT NULL AND OLD.archived_at IS NULL THEN
    -- Block archiving used invites
    IF COALESCE(OLD.uses_count, 0) > 0 OR COALESCE(NEW.uses_count, 0) > 0 THEN
      RAISE EXCEPTION 'Não é permitido arquivar convites já usados.';
    END IF;

    -- Ensure archived is always inactive
    NEW.active := false;

    -- Track who archived (best-effort)
    IF NEW.archived_by IS NULL THEN
      NEW.archived_by := auth.uid();
    END IF;
  END IF;

  -- Block un-archiving (archiving is definitive)
  IF NEW.archived_at IS NULL AND OLD.archived_at IS NOT NULL THEN
    RAISE EXCEPTION 'Arquivamento é definitivo; não é permitido desarquivar.';
  END IF;

  -- If already archived, block re-activation
  IF OLD.archived_at IS NOT NULL AND NEW.active = true THEN
    RAISE EXCEPTION 'Convite arquivado não pode ser reativado.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_invite_codes_validate_archive ON public.invite_codes;

CREATE TRIGGER trg_invite_codes_validate_archive
BEFORE UPDATE ON public.invite_codes
FOR EACH ROW
EXECUTE FUNCTION public.invite_codes_validate_archive();

-- Ensure function owner can read auth.uid() context; no grants needed because updates are already protected by existing RLS.
