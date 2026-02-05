-- Função de busca flexível: por nome OU username
-- Retorna múltiplos resultados estilo Instagram

CREATE OR REPLACE FUNCTION public.search_members(
  p_search text DEFAULT ''::text,
  p_limit integer DEFAULT 30
)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  username text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH params AS (
    SELECT
      btrim(COALESCE(p_search, '')) AS q,
      CASE
        WHEN btrim(COALESCE(p_search, '')) = '' THEN ''
        WHEN left(btrim(COALESCE(p_search, '')), 1) = '@' THEN lower(btrim(COALESCE(p_search, '')))
        ELSE lower('@' || btrim(COALESCE(p_search, '')))
      END AS q_at
  )
  SELECT
    p.user_id,
    COALESCE(NULLIF(p.display_name, ''), 'Membro') AS display_name,
    p.username,
    p.avatar_url
  FROM public.profiles p
  CROSS JOIN params
  WHERE auth.uid() IS NOT NULL
    AND public.is_approved()
    AND p.access_status = 'approved'
    -- Excluir perfis sem nome E sem username (o "Membro fantasma")
    AND (
      (p.display_name IS NOT NULL AND btrim(p.display_name) <> '')
      OR (p.username IS NOT NULL AND btrim(p.username) <> '')
    )
    -- Respeitar visibilidade do perfil
    AND public.can_view_author(p.user_id)
    -- Busca: se começar com @ busca username, senão busca nome
    AND (
      params.q = ''
      OR (
        -- Se o termo começa com @, busca apenas no username
        left(params.q, 1) = '@'
        AND p.username IS NOT NULL
        AND lower(p.username) ILIKE ('%' || params.q_at || '%')
      )
      OR (
        -- Senão, busca no display_name ou first_name/last_name
        left(params.q, 1) <> '@'
        AND (
          COALESCE(p.display_name, '') ILIKE ('%' || params.q || '%')
          OR COALESCE(p.first_name, '') ILIKE ('%' || params.q || '%')
          OR COALESCE(p.last_name, '') ILIKE ('%' || params.q || '%')
        )
      )
    )
  ORDER BY 
    -- Priorizar matches exatos no início do nome
    CASE 
      WHEN lower(COALESCE(p.display_name, '')) LIKE lower(params.q || '%') THEN 0
      WHEN lower(COALESCE(p.first_name, '')) LIKE lower(params.q || '%') THEN 1
      ELSE 2
    END,
    p.display_name ASC
  LIMIT LEAST(GREATEST(p_limit, 1), 50);
$$;