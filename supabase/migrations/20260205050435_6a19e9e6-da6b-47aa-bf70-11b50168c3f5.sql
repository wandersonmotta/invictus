-- =============================================================================
-- Filtro de Palavras Ofensivas na Comunidade
-- =============================================================================

-- 1. Criar tabela blocked_words
CREATE TABLE public.blocked_words (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  word TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'ofensivo',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para buscas rápidas
CREATE INDEX idx_blocked_words_active ON public.blocked_words(active) WHERE active = true;

-- RLS: apenas admins podem gerenciar
ALTER TABLE public.blocked_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage blocked_words"
  ON public.blocked_words
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2. Criar função contains_profanity
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
  
  -- Normaliza: lowercase + remove acentos
  v_normalized := lower(unaccent(p_text));
  
  -- Verifica contra lista de palavras bloqueadas (match de palavra inteira)
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_words bw
    WHERE bw.active = true
      AND v_normalized ~* ('\m' || bw.word || '\M')
  ) INTO v_found;
  
  RETURN v_found;
END;
$$;

-- 3. Atualizar create_community_post com filtro
CREATE OR REPLACE FUNCTION public.create_community_post(p_thread_id uuid, p_body text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare
  v_me uuid;
  v_post_id uuid;
  v_body text;
  v_locked boolean;
begin
  v_me := auth.uid();
  if v_me is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_approved() then
    raise exception 'Not approved';
  end if;

  v_body := nullif(btrim(coalesce(p_body, '')), '');
  if v_body is null then
    raise exception 'Empty post';
  end if;

  -- Filtro de palavras ofensivas
  IF public.contains_profanity(v_body) THEN
    RAISE EXCEPTION 'Mensagem contém conteúdo inadequado';
  END IF;

  select t.is_locked into v_locked
  from public.community_threads t
  where t.id = p_thread_id
  limit 1;

  if v_locked is null then
    raise exception 'Thread not found';
  end if;
  if v_locked = true then
    raise exception 'Thread locked';
  end if;

  insert into public.community_posts(thread_id, author_id, body)
  values (p_thread_id, v_me, v_body)
  returning id into v_post_id;

  update public.community_threads
  set last_post_at = now()
  where id = p_thread_id;

  return v_post_id;
end;
$$;

-- 4. Atualizar edit_community_post com filtro
CREATE OR REPLACE FUNCTION public.edit_community_post(p_post_id uuid, p_body text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare
  v_me uuid;
  v_body text;
  v_created_at timestamptz;
  v_thread_id uuid;
  v_author_id uuid;
begin
  v_me := auth.uid();
  if v_me is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_approved() then
    raise exception 'Not approved';
  end if;

  v_body := nullif(btrim(coalesce(p_body, '')), '');
  if v_body is null then
    raise exception 'Empty post';
  end if;

  -- Filtro de palavras ofensivas
  IF public.contains_profanity(v_body) THEN
    RAISE EXCEPTION 'Mensagem contém conteúdo inadequado';
  END IF;

  select p.created_at, p.thread_id, p.author_id
    into v_created_at, v_thread_id, v_author_id
  from public.community_posts p
  where p.id = p_post_id
  limit 1;

  if v_author_id is null then
    raise exception 'Post not found';
  end if;
  if v_author_id <> v_me then
    raise exception 'Not the author';
  end if;

  -- Janela de edição: 40 segundos
  if v_created_at < (now() - interval '40 seconds') then
    raise exception 'Edit window expired';
  end if;

  update public.community_posts
  set body = v_body
  where id = p_post_id;

  return p_post_id;
end;
$$;

-- 5. Atualizar create_community_thread com filtro (título e body)
CREATE OR REPLACE FUNCTION public.create_community_thread(p_channel_id uuid, p_title text, p_body text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare
  v_me uuid;
  v_thread_id uuid;
  v_first_post_id uuid;
  v_title text;
  v_body text;
begin
  v_me := auth.uid();
  if v_me is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_approved() then
    raise exception 'Not approved';
  end if;

  v_title := nullif(btrim(coalesce(p_title, '')), '');
  if v_title is null then
    raise exception 'Title required';
  end if;

  v_body := nullif(btrim(coalesce(p_body, '')), '');

  -- Filtro de palavras ofensivas (título e body)
  IF public.contains_profanity(v_title) OR public.contains_profanity(v_body) THEN
    RAISE EXCEPTION 'Conteúdo contém palavras inadequadas';
  END IF;

  if not exists (select 1 from public.community_channels c where c.id = p_channel_id) then
    raise exception 'Channel not found';
  end if;

  insert into public.community_threads(channel_id, created_by, title, body, last_post_at)
  values (p_channel_id, v_me, v_title, v_body, now())
  returning id into v_thread_id;

  -- Se veio body, cria também o primeiro post
  if v_body is not null then
    insert into public.community_posts(thread_id, author_id, body)
    values (v_thread_id, v_me, v_body)
    returning id into v_first_post_id;
  end if;

  return v_thread_id;
end;
$$;

-- 6. Lista inicial de palavras bloqueadas (português brasileiro)
INSERT INTO public.blocked_words (word, category) VALUES
  ('porra', 'ofensivo'),
  ('caralho', 'ofensivo'),
  ('merda', 'ofensivo'),
  ('puta', 'ofensivo'),
  ('fdp', 'ofensivo'),
  ('filho da puta', 'ofensivo'),
  ('viado', 'discriminatorio'),
  ('bicha', 'discriminatorio'),
  ('sapatao', 'discriminatorio'),
  ('sapatão', 'discriminatorio'),
  ('preto', 'discriminatorio'),
  ('macaco', 'discriminatorio'),
  ('arrombado', 'ofensivo'),
  ('cuzao', 'ofensivo'),
  ('cuzão', 'ofensivo'),
  ('otario', 'ofensivo'),
  ('otário', 'ofensivo'),
  ('vagabundo', 'ofensivo'),
  ('vagabunda', 'ofensivo'),
  ('desgraçado', 'ofensivo'),
  ('desgracado', 'ofensivo'),
  ('imbecil', 'ofensivo'),
  ('idiota', 'ofensivo'),
  ('retardado', 'discriminatorio'),
  ('mongol', 'discriminatorio'),
  ('nazista', 'discriminatorio'),
  ('hitler', 'discriminatorio');