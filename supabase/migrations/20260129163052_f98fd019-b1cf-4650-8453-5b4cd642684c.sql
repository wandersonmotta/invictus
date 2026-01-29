-- Etapa 1: Comunidade (canais fixos) - estrutura + segurança + RPCs + realtime + storage

-- 0) Extensões úteis (gen_random_uuid já existe via pgcrypto em geral; não forçamos aqui)

-- 1) Helper: checar se usuário atual é aprovado (bypass RLS de profiles)
create or replace function public.is_approved()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.access_status = 'approved'::access_status
  );
$$;

-- 2) Tabelas
create table if not exists public.community_channels (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text null,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.community_threads (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.community_channels(id) on delete restrict,
  created_by uuid not null,
  title text not null,
  body text null,
  is_locked boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  last_post_at timestamp with time zone not null default now()
);

create index if not exists idx_community_threads_channel_last_post
  on public.community_threads(channel_id, last_post_at desc);

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.community_threads(id) on delete cascade,
  author_id uuid not null,
  body text null,
  created_at timestamp with time zone not null default now()
);

create index if not exists idx_community_posts_thread_created
  on public.community_posts(thread_id, created_at asc);

create table if not exists public.community_post_attachments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  storage_bucket text not null default 'community-attachments',
  storage_path text not null,
  file_name text null,
  content_type text null,
  size_bytes bigint null,
  created_at timestamp with time zone not null default now()
);

create index if not exists idx_community_attachments_post
  on public.community_post_attachments(post_id);

create unique index if not exists uq_community_attachments_path
  on public.community_post_attachments(storage_bucket, storage_path);

-- 2.1) Trigger para updated_at (reutiliza função existente)
do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_community_threads_updated_at'
  ) then
    create trigger trg_community_threads_updated_at
    before update on public.community_threads
    for each row
    execute function public.update_updated_at_column();
  end if;
end $$;

-- 3) RLS
alter table public.community_channels enable row level security;
alter table public.community_threads enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_post_attachments enable row level security;

-- 3.1) Policies: SELECT (aprovados)
create policy "Approved can view channels"
on public.community_channels
for select
using (public.is_approved());

create policy "Approved can view threads"
on public.community_threads
for select
using (public.is_approved());

create policy "Approved can view posts"
on public.community_posts
for select
using (public.is_approved());

create policy "Approved can view post attachments"
on public.community_post_attachments
for select
using (public.is_approved());

-- 3.2) Policies: INSERT
create policy "Approved can create threads"
on public.community_threads
for insert
with check (
  public.is_approved()
  and auth.uid() is not null
  and created_by = auth.uid()
);

create policy "Approved can create posts"
on public.community_posts
for insert
with check (
  public.is_approved()
  and auth.uid() is not null
  and author_id = auth.uid()
  and exists (
    select 1
    from public.community_threads t
    where t.id = community_posts.thread_id
      and t.is_locked = false
  )
);

create policy "Authors can add attachments metadata"
on public.community_post_attachments
for insert
with check (
  public.is_approved()
  and auth.uid() is not null
  and exists (
    select 1
    from public.community_posts p
    where p.id = community_post_attachments.post_id
      and p.author_id = auth.uid()
  )
);

-- 3.3) Policies: negar UPDATE/DELETE (MVP)
create policy "No update channels"
on public.community_channels
for update
using (false)
with check (false);

create policy "No delete channels"
on public.community_channels
for delete
using (false);

create policy "No update threads"
on public.community_threads
for update
using (false)
with check (false);

create policy "No delete threads"
on public.community_threads
for delete
using (false);

create policy "No update posts"
on public.community_posts
for update
using (false)
with check (false);

create policy "No delete posts"
on public.community_posts
for delete
using (false);

create policy "No update attachments"
on public.community_post_attachments
for update
using (false)
with check (false);

create policy "No delete attachments"
on public.community_post_attachments
for delete
using (false);

-- 4) Seed de canais fixos (opção A)
insert into public.community_channels (slug, name, description, sort_order)
values
  ('geral', 'Geral', 'Avisos e conversas gerais', 10),
  ('networking', 'Networking', 'Conexões, parcerias e indicações', 20),
  ('negocios', 'Negócios', 'Discussões e oportunidades', 30),
  ('treinos', 'Treinos', 'Treinos, rotina e disciplina', 40),
  ('eventos', 'Eventos', 'Eventos, encontros e agendas', 50),
  ('recursos', 'Recursos', 'Links úteis, materiais e referências', 60)
on conflict (slug) do nothing;

-- 5) Storage: bucket privado
insert into storage.buckets (id, name, public)
values ('community-attachments', 'community-attachments', false)
on conflict (id) do nothing;

-- 5.1) Storage policies (bucket community-attachments)
-- Observação: políticas são em storage.objects

create policy "Approved can read community attachments"
on storage.objects
for select
using (
  bucket_id = 'community-attachments'
  and public.is_approved()
  and exists (
    select 1
    from public.community_post_attachments a
    join public.community_posts p on p.id = a.post_id
    join public.community_threads t on t.id = p.thread_id
    where a.storage_bucket = bucket_id
      and a.storage_path = name
  )
);

create policy "Authors can upload community attachments"
on storage.objects
for insert
with check (
  bucket_id = 'community-attachments'
  and public.is_approved()
  and auth.uid() is not null
  and array_length(storage.foldername(name), 1) >= 2
  and exists (
    select 1
    from public.community_posts p
    join public.community_threads t on t.id = p.thread_id
    where p.id = (storage.foldername(name))[2]::uuid
      and t.id = (storage.foldername(name))[1]::uuid
      and p.author_id = auth.uid()
  )
);

create policy "No update community attachments"
on storage.objects
for update
using (false)
with check (false);

create policy "No delete community attachments"
on storage.objects
for delete
using (false);

-- 6) RPCs (SECURITY DEFINER)

-- 6.1) Card seguro do autor (respeita profile_visibility)
create or replace function public.get_safe_author_card(p_author_id uuid)
returns table (
  user_id uuid,
  display_name text,
  username text,
  avatar_url text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me uuid;
  v_can_show boolean := false;
  v_vis profile_visibility;
  v_display text;
  v_username text;
  v_avatar text;
begin
  v_me := auth.uid();
  if v_me is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_approved() then
    raise exception 'Not approved';
  end if;

  select p.profile_visibility,
         coalesce(nullif(p.display_name, ''), 'Membro'),
         p.username,
         p.avatar_url
    into v_vis, v_display, v_username, v_avatar
  from public.profiles p
  where p.user_id = p_author_id
  limit 1;

  -- Se não existe perfil, retorna fallback
  if v_vis is null then
    user_id := p_author_id;
    display_name := 'Membro';
    username := null;
    avatar_url := null;
    return next;
    return;
  end if;

  if v_me = p_author_id or public.has_role(v_me, 'admin'::app_role) then
    v_can_show := true;
  else
    if v_vis = 'members'::profile_visibility then
      v_can_show := true;
    elsif v_vis = 'mutuals'::profile_visibility then
      v_can_show := public.is_mutual_follow(v_me, p_author_id);
    else
      v_can_show := false;
    end if;
  end if;

  user_id := p_author_id;
  if v_can_show then
    display_name := v_display;
    username := v_username;
    avatar_url := v_avatar;
  else
    display_name := 'Membro';
    username := null;
    avatar_url := null;
  end if;

  return next;
end;
$$;

-- 6.2) list_community_channels
create or replace function public.list_community_channels()
returns table (
  id uuid,
  slug text,
  name text,
  description text,
  sort_order integer
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.slug, c.name, c.description, c.sort_order
  from public.community_channels c
  where public.is_approved()
  order by c.sort_order asc, c.name asc;
$$;

-- 6.3) list_community_threads
create or replace function public.list_community_threads(
  p_channel_id uuid,
  p_search text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  thread_id uuid,
  channel_id uuid,
  title text,
  created_at timestamptz,
  last_post_at timestamptz,
  post_count bigint,
  created_by uuid,
  author_display_name text,
  author_username text,
  author_avatar_url text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_approved() then
    raise exception 'Not approved';
  end if;

  return query
  with base as (
    select t.*
    from public.community_threads t
    where t.channel_id = p_channel_id
      and (
        p_search is null
        or btrim(p_search) = ''
        or t.title ilike ('%' || p_search || '%')
      )
    order by t.last_post_at desc
    limit least(greatest(p_limit, 1), 100)
    offset greatest(p_offset, 0)
  ), counts as (
    select p.thread_id, count(*)::bigint as post_count
    from public.community_posts p
    where p.thread_id in (select id from base)
    group by p.thread_id
  ), authors as (
    select b.id as thread_id,
           a.display_name as author_display_name,
           a.username as author_username,
           a.avatar_url as author_avatar_url
    from base b
    join lateral public.get_safe_author_card(b.created_by) a on true
  )
  select
    b.id as thread_id,
    b.channel_id,
    b.title,
    b.created_at,
    b.last_post_at,
    coalesce(c.post_count, 0) as post_count,
    b.created_by,
    au.author_display_name,
    au.author_username,
    au.author_avatar_url
  from base b
  left join counts c on c.thread_id = b.id
  left join authors au on au.thread_id = b.id;
end;
$$;

-- 6.4) get_community_thread
create or replace function public.get_community_thread(p_thread_id uuid)
returns table (
  thread_id uuid,
  title text,
  body text,
  is_locked boolean,
  created_at timestamptz,
  last_post_at timestamptz,
  channel_id uuid,
  channel_slug text,
  channel_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.id as thread_id,
    t.title,
    t.body,
    t.is_locked,
    t.created_at,
    t.last_post_at,
    c.id as channel_id,
    c.slug as channel_slug,
    c.name as channel_name
  from public.community_threads t
  join public.community_channels c on c.id = t.channel_id
  where public.is_approved()
    and t.id = p_thread_id
  limit 1;
$$;

-- 6.5) list_community_posts
create or replace function public.list_community_posts(
  p_thread_id uuid,
  p_limit integer default 50,
  p_before timestamptz default null
)
returns table (
  post_id uuid,
  thread_id uuid,
  body text,
  created_at timestamptz,
  author_id uuid,
  author_display_name text,
  author_username text,
  author_avatar_url text,
  attachment_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_approved() then
    raise exception 'Not approved';
  end if;

  return query
  with base as (
    select p.*
    from public.community_posts p
    where p.thread_id = p_thread_id
      and (
        p_before is null
        or p.created_at < p_before
      )
    order by p.created_at desc
    limit least(greatest(p_limit, 1), 100)
  ), attach as (
    select a.post_id, count(*)::bigint as attachment_count
    from public.community_post_attachments a
    where a.post_id in (select id from base)
    group by a.post_id
  ), authors as (
    select b.id as post_id,
           ac.display_name as author_display_name,
           ac.username as author_username,
           ac.avatar_url as author_avatar_url
    from base b
    join lateral public.get_safe_author_card(b.author_id) ac on true
  )
  select
    b.id as post_id,
    b.thread_id,
    b.body,
    b.created_at,
    b.author_id,
    au.author_display_name,
    au.author_username,
    au.author_avatar_url,
    coalesce(at.attachment_count, 0) as attachment_count
  from base b
  left join attach at on at.post_id = b.id
  left join authors au on au.post_id = b.id
  order by b.created_at asc;
end;
$$;

-- 6.6) create_community_thread: cria thread e (opcional) primeiro post
create or replace function public.create_community_thread(
  p_channel_id uuid,
  p_title text,
  p_body text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
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

-- 6.7) create_community_post
create or replace function public.create_community_post(
  p_thread_id uuid,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
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

-- 6.8) add_community_post_attachment
create or replace function public.add_community_post_attachment(
  p_post_id uuid,
  p_storage_path text,
  p_file_name text default null,
  p_content_type text default null,
  p_size_bytes bigint default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid;
  v_id uuid;
  v_post_author uuid;
  v_thread_id uuid;
  v_expected_prefix text;
  v_path text;
begin
  v_me := auth.uid();
  if v_me is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_approved() then
    raise exception 'Not approved';
  end if;

  select p.author_id, p.thread_id
    into v_post_author, v_thread_id
  from public.community_posts p
  where p.id = p_post_id
  limit 1;

  if v_post_author is null then
    raise exception 'Post not found';
  end if;

  if v_post_author <> v_me then
    raise exception 'Not the author';
  end if;

  v_path := nullif(btrim(coalesce(p_storage_path, '')), '');
  if v_path is null then
    raise exception 'storage_path required';
  end if;

  v_expected_prefix := (v_thread_id::text || '/' || p_post_id::text || '/');
  if left(v_path, length(v_expected_prefix)) <> v_expected_prefix then
    raise exception 'Invalid storage_path';
  end if;

  insert into public.community_post_attachments(
    post_id, storage_bucket, storage_path, file_name, content_type, size_bytes
  ) values (
    p_post_id, 'community-attachments', v_path, p_file_name, p_content_type, p_size_bytes
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- 7) Realtime: habilitar community_posts (idempotente)
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'community_posts'
  ) then
    execute 'alter publication supabase_realtime add table public.community_posts';
  end if;
end $$;
