-- Redefine contains_profanity to avoid using unaccent() if it's causing issues
CREATE OR REPLACE FUNCTION public.contains_profanity(p_text TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_normalized TEXT;
  v_found BOOLEAN;
BEGIN
  IF p_text IS NULL OR btrim(p_text) = '' THEN
    RETURN false;
  END IF;
  
  -- Normaliza: lowercase apenas (sem unaccent para evitar erro de extensão faltante)
  v_normalized := lower(p_text);
  
  -- Verifica contra lista de palavras bloqueadas (match de palavra inteira)
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_words bw
    WHERE bw.active = true
      AND v_normalized ~* ('\m' || bw.word || '\M')
  ) INTO v_found;
  
  RETURN v_found;
END;
$$;
