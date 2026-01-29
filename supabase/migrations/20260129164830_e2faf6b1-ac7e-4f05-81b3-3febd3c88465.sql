-- Comunidade: editar/excluir posts (janela de 40s) + presença (cards seguros)

-- 1) Autor cards em lote (para presença)
CREATE OR REPLACE FUNCTION public.list_safe_author_cards(p_user_ids uuid[])
RETURNS TABLE(user_id uuid, display_name text, username text, avatar_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  select ac.user_id, ac.display_name, ac.username, ac.avatar_url
  from unnest(p_user_ids) u
  join lateral public.get_safe_author_card(u) ac on true;
$$;

-- 2) Editar post dentro da janela
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

-- 3) Excluir post dentro da janela
CREATE OR REPLACE FUNCTION public.delete_community_post(p_post_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare
  v_me uuid;
  v_created_at timestamptz;
  v_thread_id uuid;
  v_author_id uuid;
  v_new_last timestamptz;
begin
  v_me := auth.uid();
  if v_me is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_approved() then
    raise exception 'Not approved';
  end if;

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

  -- Janela de exclusão: 40 segundos
  if v_created_at < (now() - interval '40 seconds') then
    raise exception 'Delete window expired';
  end if;

  -- Remove metadados dos anexos (arquivos no storage permanecem, MVP)
  delete from public.community_post_attachments a
  where a.post_id = p_post_id;

  delete from public.community_posts p
  where p.id = p_post_id;

  -- Recalcula last_post_at do thread
  select max(p.created_at) into v_new_last
  from public.community_posts p
  where p.thread_id = v_thread_id;

  update public.community_threads t
  set last_post_at = coalesce(v_new_last, t.created_at)
  where t.id = v_thread_id;

  return p_post_id;
end;
$$;

-- Nota: Mantemos RLS de UPDATE/DELETE em community_posts bloqueadas.
-- As operações passam exclusivamente pelas funções SECURITY DEFINER acima.