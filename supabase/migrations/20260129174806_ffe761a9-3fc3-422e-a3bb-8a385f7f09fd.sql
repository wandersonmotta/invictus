-- Update RPC to accept frontend-generated post id
CREATE OR REPLACE FUNCTION public.create_feed_post(p_post_id uuid, p_caption text, p_media jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  if p_post_id is null then
    raise exception 'post_id_required';
  end if;

  v_post_id := p_post_id;

  begin
    insert into public.feed_posts(id, author_id, caption)
    values (v_post_id, v_author, nullif(btrim(coalesce(p_caption, '')), ''));
  exception
    when unique_violation then
      -- prevents replay/double submit with same id
      raise exception 'post_id_conflict';
  end;

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
$$;

-- Backwards-compatibility stub: keep old signature but force explicit post id usage
CREATE OR REPLACE FUNCTION public.create_feed_post(p_caption text, p_media jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
begin
  raise exception 'create_feed_post_requires_post_id';
end;
$$;