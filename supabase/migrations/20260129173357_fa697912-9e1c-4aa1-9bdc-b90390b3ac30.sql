-- Suporte a trim (início/fim) para vídeos no feed
alter table public.feed_post_media
  add column if not exists trim_start_seconds numeric null,
  add column if not exists trim_end_seconds numeric null;

create index if not exists idx_feed_post_media_post_sort_order on public.feed_post_media(post_id, sort_order);

-- Atualiza RPCs para incluir trim e aceitar no create
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
  v_trim_start numeric;
  v_trim_end numeric;
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
    v_trim_start := nullif(v_item->>'trim_start_seconds', '')::numeric;
    v_trim_end := nullif(v_item->>'trim_end_seconds', '')::numeric;

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

    if v_trim_start is not null and v_trim_start < 0 then
      raise exception 'invalid_trim_start';
    end if;

    if v_trim_end is not null and v_trim_end < 0 then
      raise exception 'invalid_trim_end';
    end if;

    if v_trim_start is not null and v_trim_end is not null and v_trim_end <= v_trim_start then
      raise exception 'invalid_trim_range';
    end if;

    insert into public.feed_post_media(
      post_id,
      storage_bucket,
      storage_path,
      content_type,
      size_bytes,
      sort_order,
      trim_start_seconds,
      trim_end_seconds
    ) values (
      v_post_id,
      'feed-media',
      v_path,
      v_content_type,
      v_size,
      v_sort,
      v_trim_start,
      v_trim_end
    );

    v_sort := v_sort + 1;
  end loop;

  return v_post_id;
end;
$fn$;

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
          'sort_order', m.sort_order,
          'trim_start_seconds', m.trim_start_seconds,
          'trim_end_seconds', m.trim_end_seconds
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
          'sort_order', m.sort_order,
          'trim_start_seconds', m.trim_start_seconds,
          'trim_end_seconds', m.trim_end_seconds
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
