-- FEED (Instagram interno) - schema + RLS + RPCs + storage bucket

-- 0) Bucket privado para mídia
insert into storage.buckets (id, name, public)
values ('feed-media', 'feed-media', false)
on conflict (id) do nothing;

-- 1) Tabelas
create table if not exists public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null,
  caption text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.feed_post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  storage_bucket text not null default 'feed-media',
  storage_path text not null,
  content_type text null,
  size_bytes bigint null,
  width int null,
  height int null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (post_id, storage_path)
);

create table if not exists public.feed_post_likes (
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.feed_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  author_id uuid not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- 2) Índices
create index if not exists idx_feed_posts_author_created_at on public.feed_posts(author_id, created_at desc);
create index if not exists idx_feed_posts_created_at on public.feed_posts(created_at desc);
create index if not exists idx_feed_post_media_post_sort on public.feed_post_media(post_id, sort_order);
create index if not exists idx_feed_post_comments_post_created_at on public.feed_post_comments(post_id, created_at asc);
create index if not exists idx_feed_post_likes_post on public.feed_post_likes(post_id);

-- 3) updated_at trigger (função já existe no projeto; mantemos idempotente)
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $fn$
begin
  new.updated_at = now();
  return new;
end;
$fn$;

DROP TRIGGER IF EXISTS trg_feed_posts_updated_at ON public.feed_posts;
create trigger trg_feed_posts_updated_at
before update on public.feed_posts
for each row
execute function public.update_updated_at_column();

-- 4) Funções helper (visibilidade)
create or replace function public.can_view_author(p_author_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_visibility public.profile_visibility;
  v_viewer uuid;
begin
  v_viewer := auth.uid();
  if v_viewer is null then
    return false;
  end if;

  -- Apenas aprovados acessam o feed
  if not public.is_approved() then
    return false;
  end if;

  -- self
  if v_viewer = p_author_id then
    return true;
  end if;

  -- admin
  if public.has_role(v_viewer, 'admin'::public.app_role) then
    return true;
  end if;

  select p.profile_visibility
    into v_visibility
  from public.profiles p
  where p.user_id = p_author_id
  limit 1;

  -- se não existe perfil, não expõe
  if v_visibility is null then
    return false;
  end if;

  if v_visibility = 'members'::public.profile_visibility then
    return true;
  elsif v_visibility = 'mutuals'::public.profile_visibility then
    return public.is_mutual_follow(v_viewer, p_author_id);
  else
    -- private
    return false;
  end if;
end;
$fn$;

create or replace function public.can_view_post(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select public.can_view_author(fp.author_id)
  from public.feed_posts fp
  where fp.id = p_post_id;
$fn$;

-- 5) Storage policy helper
create or replace function public.can_view_feed_media(p_object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_viewer uuid;
  v_author uuid;
  v_post uuid;
  v_exists boolean;
begin
  v_viewer := auth.uid();
  if v_viewer is null then
    return false;
  end if;

  if not public.is_approved() then
    return false;
  end if;

  -- path: {authorId}/{postId}/...
  begin
    v_author := split_part(p_object_name, '/', 1)::uuid;
    v_post := split_part(p_object_name, '/', 2)::uuid;
  exception when others then
    return false;
  end;

  -- valida que a mídia está registrada e pertence ao post
  select exists (
    select 1
    from public.feed_post_media m
    join public.feed_posts p on p.id = m.post_id
    where m.storage_path = p_object_name
      and p.id = v_post
      and p.author_id = v_author
  ) into v_exists;

  if not v_exists then
    return false;
  end if;

  return public.can_view_author(v_author);
end;
$fn$;

-- 6) RLS
alter table public.feed_posts enable row level security;
alter table public.feed_post_media enable row level security;
alter table public.feed_post_likes enable row level security;
alter table public.feed_post_comments enable row level security;

-- Limpa policies antigas (idempotente)
drop policy if exists "Feed posts selectable" on public.feed_posts;
drop policy if exists "Feed posts insertable" on public.feed_posts;
drop policy if exists "Feed posts updatable" on public.feed_posts;
drop policy if exists "Feed posts deletable" on public.feed_posts;

drop policy if exists "Feed media selectable" on public.feed_post_media;
drop policy if exists "Feed media insertable" on public.feed_post_media;
drop policy if exists "Feed media updatable" on public.feed_post_media;
drop policy if exists "Feed media deletable" on public.feed_post_media;

drop policy if exists "Feed likes selectable" on public.feed_post_likes;
drop policy if exists "Feed likes insertable" on public.feed_post_likes;
drop policy if exists "Feed likes deletable" on public.feed_post_likes;

drop policy if exists "Feed comments selectable" on public.feed_post_comments;
drop policy if exists "Feed comments insertable" on public.feed_post_comments;
drop policy if exists "Feed comments deletable" on public.feed_post_comments;

-- feed_posts
create policy "Feed posts selectable"
on public.feed_posts
for select
using (public.can_view_author(author_id));

create policy "Feed posts insertable"
on public.feed_posts
for insert
with check (public.is_approved() and auth.uid() is not null and author_id = auth.uid());

create policy "Feed posts updatable"
on public.feed_posts
for update
using (public.is_approved() and auth.uid() is not null and author_id = auth.uid())
with check (public.is_approved() and auth.uid() is not null and author_id = auth.uid());

create policy "Feed posts deletable"
on public.feed_posts
for delete
using (public.is_approved() and auth.uid() is not null and author_id = auth.uid());

-- feed_post_media
create policy "Feed media selectable"
on public.feed_post_media
for select
using (
  public.is_approved()
  and exists (
    select 1
    from public.feed_posts p
    where p.id = feed_post_media.post_id
      and public.can_view_author(p.author_id)
  )
);

create policy "Feed media insertable"
on public.feed_post_media
for insert
with check (
  public.is_approved()
  and exists (
    select 1
    from public.feed_posts p
    where p.id = feed_post_media.post_id
      and p.author_id = auth.uid()
  )
);

create policy "Feed media updatable"
on public.feed_post_media
for update
using (false)
with check (false);

create policy "Feed media deletable"
on public.feed_post_media
for delete
using (
  public.is_approved()
  and exists (
    select 1
    from public.feed_posts p
    where p.id = feed_post_media.post_id
      and p.author_id = auth.uid()
  )
);

-- feed_post_likes
create policy "Feed likes selectable"
on public.feed_post_likes
for select
using (public.is_approved() and public.can_view_post(post_id));

create policy "Feed likes insertable"
on public.feed_post_likes
for insert
with check (
  public.is_approved()
  and auth.uid() is not null
  and user_id = auth.uid()
  and public.can_view_post(post_id)
);

create policy "Feed likes deletable"
on public.feed_post_likes
for delete
using (public.is_approved() and auth.uid() is not null and user_id = auth.uid());

-- feed_post_comments
create policy "Feed comments selectable"
on public.feed_post_comments
for select
using (public.is_approved() and public.can_view_post(post_id));

create policy "Feed comments insertable"
on public.feed_post_comments
for insert
with check (
  public.is_approved()
  and auth.uid() is not null
  and author_id = auth.uid()
  and public.can_view_post(post_id)
);

create policy "Feed comments deletable"
on public.feed_post_comments
for delete
using (
  public.is_approved()
  and auth.uid() is not null
  and (author_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role))
);

-- 7) Policies do bucket feed-media (storage.objects)
-- Limpa policies antigas (idempotente)
drop policy if exists "Feed media read" on storage.objects;
drop policy if exists "Feed media insert" on storage.objects;
drop policy if exists "Feed media update" on storage.objects;
drop policy if exists "Feed media delete" on storage.objects;

create policy "Feed media read"
on storage.objects
for select
using (
  bucket_id = 'feed-media'
  and public.can_view_feed_media(name)
);

create policy "Feed media insert"
on storage.objects
for insert
with check (
  bucket_id = 'feed-media'
  and auth.uid() is not null
  and public.is_approved()
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "Feed media update"
on storage.objects
for update
using (false)
with check (false);

create policy "Feed media delete"
on storage.objects
for delete
using (
  bucket_id = 'feed-media'
  and auth.uid() is not null
  and public.is_approved()
  and split_part(name, '/', 1) = auth.uid()::text
);

-- 8) RPCs
-- 8.1) create_feed_post
create or replace function public.create_feed_post(
  p_caption text,
  p_media jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_post_id uuid;
  v_item jsonb;
  v_path text;
  v_content_type text;
  v_size bigint;
  v_sort int;
  v_author uuid;
  v_post_id_from_path uuid;
  v_author_from_path uuid;
  v_allowed boolean;
  v_max_bytes bigint := 20 * 1024 * 1024;
begin
  v_author := auth.uid();
  if v_author is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_approved() then
    raise exception 'Not approved';
  end if;

  insert into public.feed_posts(author_id, caption)
  values (v_author, nullif(btrim(coalesce(p_caption, '')), ''))
  returning id into v_post_id;

  if p_media is null then
    return v_post_id;
  end if;

  if jsonb_typeof(p_media) <> 'array' then
    raise exception 'media_must_be_array';
  end if;

  v_sort := 0;
  for v_item in select * from jsonb_array_elements(p_media)
  loop
    v_path := coalesce(v_item->>'storage_path', '');
    v_content_type := nullif(v_item->>'content_type', '');
    v_size := nullif(v_item->>'size_bytes', '')::bigint;

    if v_path = '' then
      raise exception 'storage_path_required';
    end if;

    -- valida path: {authorId}/{postId}/...
    begin
      v_author_from_path := split_part(v_path, '/', 1)::uuid;
      v_post_id_from_path := split_part(v_path, '/', 2)::uuid;
    exception when others then
      raise exception 'invalid_storage_path';
    end;

    if v_author_from_path <> v_author then
      raise exception 'invalid_storage_path_author';
    end if;

    if v_post_id_from_path <> v_post_id then
      raise exception 'invalid_storage_path_post';
    end if;

    if v_size is not null and v_size > v_max_bytes then
      raise exception 'file_too_large';
    end if;

    -- content types permitidos (MVP)
    v_allowed := (
      v_content_type is not null and (
        v_content_type like 'image/%'
        or v_content_type = 'video/mp4'
        or v_content_type = 'video/webm'
      )
    );

    if not v_allowed then
      raise exception 'invalid_content_type';
    end if;

    insert into public.feed_post_media(
      post_id,
      storage_bucket,
      storage_path,
      content_type,
      size_bytes,
      sort_order
    ) values (
      v_post_id,
      'feed-media',
      v_path,
      v_content_type,
      v_size,
      v_sort
    );

    v_sort := v_sort + 1;
  end loop;

  return v_post_id;
end;
$fn$;

-- 8.2) list_feed_posts
create or replace function public.list_feed_posts(
  p_mode text,
  p_limit int default 10,
  p_before timestamptz default null
)
returns table (
  post_id uuid,
  created_at timestamptz,
  caption text,
  author_user_id uuid,
  author_display_name text,
  author_username text,
  author_avatar_url text,
  media jsonb,
  like_count bigint,
  comment_count bigint,
  liked_by_me boolean
)
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_viewer uuid;
begin
  v_viewer := auth.uid();
  if v_viewer is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_approved() then
    raise exception 'Not approved';
  end if;

  return query
  with base as (
    select p.*
    from public.feed_posts p
    where (p_before is null or p.created_at < p_before)
      and public.can_view_author(p.author_id)
      and (
        p_mode = 'all'
        or (
          p_mode = 'following'
          and (p.author_id = v_viewer or exists (
            select 1 from public.follows f
            where f.follower_id = v_viewer
              and f.following_id = p.author_id
          ))
        )
      )
    order by p.created_at desc
    limit greatest(1, least(p_limit, 50))
  ),
  likes as (
    select l.post_id, count(*)::bigint as c
    from public.feed_post_likes l
    where l.post_id in (select id from base)
    group by l.post_id
  ),
  comments as (
    select c.post_id, count(*)::bigint as c
    from public.feed_post_comments c
    where c.post_id in (select id from base)
    group by c.post_id
  ),
  liked as (
    select l.post_id, true as me
    from public.feed_post_likes l
    where l.user_id = v_viewer
      and l.post_id in (select id from base)
  ),
  media_agg as (
    select m.post_id,
      jsonb_agg(
        jsonb_build_object(
          'storage_path', m.storage_path,
          'content_type', m.content_type,
          'sort_order', m.sort_order
        ) order by m.sort_order asc
      ) as media
    from public.feed_post_media m
    where m.post_id in (select id from base)
    group by m.post_id
  )
  select
    b.id as post_id,
    b.created_at,
    b.caption,
    b.author_id as author_user_id,
    coalesce(nullif(pr.display_name, ''), 'Membro') as author_display_name,
    pr.username as author_username,
    pr.avatar_url as author_avatar_url,
    coalesce(ma.media, '[]'::jsonb) as media,
    coalesce(li.c, 0) as like_count,
    coalesce(co.c, 0) as comment_count,
    coalesce(lk.me, false) as liked_by_me
  from base b
  join public.profiles pr on pr.user_id = b.author_id
  left join media_agg ma on ma.post_id = b.id
  left join likes li on li.post_id = b.id
  left join comments co on co.post_id = b.id
  left join liked lk on lk.post_id = b.id
  order by b.created_at desc;
end;
$fn$;

-- 8.3) list_profile_feed_posts
create or replace function public.list_profile_feed_posts(
  p_user_id uuid,
  p_limit int default 12,
  p_before timestamptz default null
)
returns table (
  post_id uuid,
  created_at timestamptz,
  caption text,
  media jsonb,
  like_count bigint,
  comment_count bigint,
  liked_by_me boolean
)
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_viewer uuid;
begin
  v_viewer := auth.uid();
  if v_viewer is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_approved() then
    raise exception 'Not approved';
  end if;

  if not public.can_view_author(p_user_id) then
    return;
  end if;

  return query
  with base as (
    select p.*
    from public.feed_posts p
    where p.author_id = p_user_id
      and (p_before is null or p.created_at < p_before)
    order by p.created_at desc
    limit greatest(1, least(p_limit, 50))
  ),
  likes as (
    select l.post_id, count(*)::bigint as c
    from public.feed_post_likes l
    where l.post_id in (select id from base)
    group by l.post_id
  ),
  comments as (
    select c.post_id, count(*)::bigint as c
    from public.feed_post_comments c
    where c.post_id in (select id from base)
    group by c.post_id
  ),
  liked as (
    select l.post_id, true as me
    from public.feed_post_likes l
    where l.user_id = v_viewer
      and l.post_id in (select id from base)
  ),
  media_agg as (
    select m.post_id,
      jsonb_agg(
        jsonb_build_object(
          'storage_path', m.storage_path,
          'content_type', m.content_type,
          'sort_order', m.sort_order
        ) order by m.sort_order asc
      ) as media
    from public.feed_post_media m
    where m.post_id in (select id from base)
    group by m.post_id
  )
  select
    b.id as post_id,
    b.created_at,
    b.caption,
    coalesce(ma.media, '[]'::jsonb) as media,
    coalesce(li.c, 0) as like_count,
    coalesce(co.c, 0) as comment_count,
    coalesce(lk.me, false) as liked_by_me
  from base b
  left join media_agg ma on ma.post_id = b.id
  left join likes li on li.post_id = b.id
  left join comments co on co.post_id = b.id
  left join liked lk on lk.post_id = b.id
  order by b.created_at desc;
end;
$fn$;

-- 8.4) get_public_profile_by_username
create or replace function public.get_public_profile_by_username(
  p_username text
)
returns table (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  city text,
  state text,
  region text,
  expertises text[],
  profile_visibility public.profile_visibility,
  can_view boolean
)
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_viewer uuid;
  v_u text;
begin
  v_viewer := auth.uid();
  if v_viewer is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_approved() then
    raise exception 'Not approved';
  end if;

  v_u := btrim(coalesce(p_username, ''));
  if v_u = '' then
    return;
  end if;
  if left(v_u, 1) = '@' then
    v_u := lower(v_u);
  else
    v_u := lower('@' || v_u);
  end if;

  return query
  select
    p.user_id,
    p.username,
    coalesce(nullif(p.display_name, ''), 'Membro') as display_name,
    p.avatar_url,
    p.bio,
    p.city,
    p.state,
    p.region,
    p.expertises,
    p.profile_visibility,
    public.can_view_author(p.user_id) as can_view
  from public.profiles p
  where p.username is not null
    and lower(p.username) = v_u
  limit 1;
end;
$fn$;

-- 8.5) get_follow_stats
create or replace function public.get_follow_stats(
  p_user_id uuid
)
returns table (
  followers_count bigint,
  following_count bigint,
  is_following boolean
)
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_viewer uuid;
begin
  v_viewer := auth.uid();
  if v_viewer is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_approved() then
    raise exception 'Not approved';
  end if;

  select count(*)::bigint into followers_count
  from public.follows f
  where f.following_id = p_user_id;

  select count(*)::bigint into following_count
  from public.follows f
  where f.follower_id = p_user_id;

  select exists(
    select 1 from public.follows f
    where f.follower_id = v_viewer
      and f.following_id = p_user_id
  ) into is_following;

  return next;
end;
$fn$;

-- 8.6) toggle_like
create or replace function public.toggle_feed_post_like(p_post_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_viewer uuid;
  v_exists boolean;
begin
  v_viewer := auth.uid();
  if v_viewer is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_approved() then
    raise exception 'Not approved';
  end if;

  if not public.can_view_post(p_post_id) then
    raise exception 'Forbidden';
  end if;

  select exists(
    select 1 from public.feed_post_likes l
    where l.post_id = p_post_id
      and l.user_id = v_viewer
  ) into v_exists;

  if v_exists then
    delete from public.feed_post_likes
    where post_id = p_post_id
      and user_id = v_viewer;
    return false;
  else
    insert into public.feed_post_likes(post_id, user_id)
    values (p_post_id, v_viewer)
    on conflict do nothing;
    return true;
  end if;
end;
$fn$;

-- 8.7) add_comment
create or replace function public.add_feed_post_comment(p_post_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_viewer uuid;
  v_id uuid;
  v_body text;
begin
  v_viewer := auth.uid();
  if v_viewer is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_approved() then
    raise exception 'Not approved';
  end if;

  if not public.can_view_post(p_post_id) then
    raise exception 'Forbidden';
  end if;

  v_body := nullif(btrim(coalesce(p_body, '')), '');
  if v_body is null then
    raise exception 'Body required';
  end if;

  insert into public.feed_post_comments(post_id, author_id, body)
  values (p_post_id, v_viewer, v_body)
  returning id into v_id;

  return v_id;
end;
$fn$;

-- 8.8) list_comments
create or replace function public.list_feed_post_comments(p_post_id uuid, p_limit int default 50)
returns table (
  comment_id uuid,
  created_at timestamptz,
  body text,
  author_user_id uuid,
  author_display_name text,
  author_username text,
  author_avatar_url text
)
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_viewer uuid;
begin
  v_viewer := auth.uid();
  if v_viewer is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_approved() then
    raise exception 'Not approved';
  end if;

  if not public.can_view_post(p_post_id) then
    raise exception 'Forbidden';
  end if;

  return query
  select
    c.id as comment_id,
    c.created_at,
    c.body,
    c.author_id as author_user_id,
    coalesce(nullif(pr.display_name, ''), 'Membro') as author_display_name,
    pr.username as author_username,
    pr.avatar_url as author_avatar_url
  from public.feed_post_comments c
  join public.profiles pr on pr.user_id = c.author_id
  where c.post_id = p_post_id
  order by c.created_at asc
  limit greatest(1, least(p_limit, 200));
end;
$fn$;

-- 8.9) delete_comment
create or replace function public.delete_feed_post_comment(p_comment_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_viewer uuid;
  v_author uuid;
  v_post uuid;
begin
  v_viewer := auth.uid();
  if v_viewer is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_approved() then
    raise exception 'Not approved';
  end if;

  select c.author_id, c.post_id
    into v_author, v_post
  from public.feed_post_comments c
  where c.id = p_comment_id;

  if v_author is null then
    return false;
  end if;

  if not public.can_view_post(v_post) then
    raise exception 'Forbidden';
  end if;

  if v_author <> v_viewer and not public.has_role(v_viewer, 'admin'::public.app_role) then
    raise exception 'Forbidden';
  end if;

  delete from public.feed_post_comments where id = p_comment_id;
  return true;
end;
$fn$;

-- 8.10) toggle_follow (UX)
create or replace function public.toggle_follow(p_target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_viewer uuid;
  v_exists boolean;
begin
  v_viewer := auth.uid();
  if v_viewer is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_approved() then
    raise exception 'Not approved';
  end if;

  if p_target_user_id is null or p_target_user_id = v_viewer then
    raise exception 'Invalid target';
  end if;

  select exists(
    select 1 from public.follows f
    where f.follower_id = v_viewer
      and f.following_id = p_target_user_id
  ) into v_exists;

  if v_exists then
    delete from public.follows
    where follower_id = v_viewer
      and following_id = p_target_user_id;
    return false;
  else
    insert into public.follows(follower_id, following_id)
    values (v_viewer, p_target_user_id)
    on conflict do nothing;
    return true;
  end if;
end;
$fn$;
