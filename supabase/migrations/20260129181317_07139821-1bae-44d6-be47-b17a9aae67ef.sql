-- 1) Notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  actor_id uuid null,
  type text not null,
  entity_id uuid null,
  conversation_id uuid null,
  created_at timestamptz not null default now(),
  read_at timestamptz null,
  data jsonb not null default '{}'::jsonb
);

create index if not exists idx_notifications_user_unread_created
  on public.notifications (user_id, read_at, created_at desc);

create index if not exists idx_notifications_user_created
  on public.notifications (user_id, created_at desc);

-- 2) RLS
alter table public.notifications enable row level security;

drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
on public.notifications
for select
using (auth.uid() = user_id);

drop policy if exists "Users can mark own notifications read" on public.notifications;
create policy "Users can mark own notifications read"
on public.notifications
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "No direct insert notifications" on public.notifications;
create policy "No direct insert notifications"
on public.notifications
for insert
with check (false);

drop policy if exists "No direct delete notifications" on public.notifications;
create policy "No direct delete notifications"
on public.notifications
for delete
using (false);

-- 3) RPCs
create or replace function public.count_unread_notifications()
returns bigint
language plpgsql
stable
security definer
set search_path = 'public'
as $$
declare
  v_me uuid;
  v_count bigint;
begin
  v_me := auth.uid();
  if v_me is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_approved() then
    raise exception 'Not approved';
  end if;

  select count(*)::bigint into v_count
  from public.notifications n
  where n.user_id = v_me
    and n.read_at is null;

  return coalesce(v_count, 0);
end;
$$;

create or replace function public.list_my_notifications(
  p_limit int default 20,
  p_before timestamptz default null
)
returns table(
  id uuid,
  type text,
  entity_id uuid,
  conversation_id uuid,
  created_at timestamptz,
  read_at timestamptz,
  data jsonb,
  actor_user_id uuid,
  actor_display_name text,
  actor_username text,
  actor_avatar_url text
)
language plpgsql
stable
security definer
set search_path = 'public'
as $$
declare
  v_me uuid;
  v_lim int;
begin
  v_me := auth.uid();
  if v_me is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_approved() then
    raise exception 'Not approved';
  end if;

  v_lim := greatest(1, least(coalesce(p_limit, 20), 50));

  return query
  select
    n.id,
    n.type,
    n.entity_id,
    n.conversation_id,
    n.created_at,
    n.read_at,
    n.data,
    n.actor_id as actor_user_id,
    coalesce(nullif(p.display_name, ''), 'Membro') as actor_display_name,
    p.username as actor_username,
    p.avatar_url as actor_avatar_url
  from public.notifications n
  left join public.profiles p on p.user_id = n.actor_id
  where n.user_id = v_me
    and (p_before is null or n.created_at < p_before)
  order by n.created_at desc
  limit v_lim;
end;
$$;

create or replace function public.mark_notifications_read(p_before timestamptz)
returns integer
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_me uuid;
  v_before timestamptz;
  v_updated int;
begin
  v_me := auth.uid();
  if v_me is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_approved() then
    raise exception 'Not approved';
  end if;

  v_before := coalesce(p_before, now());

  update public.notifications
  set read_at = now()
  where user_id = v_me
    and read_at is null
    and created_at <= v_before;

  get diagnostics v_updated = row_count;
  return coalesce(v_updated, 0);
end;
$$;

-- 4) Trigger helper to insert notifications (internal)
create or replace function public._notify(
  p_user_id uuid,
  p_actor_id uuid,
  p_type text,
  p_entity_id uuid default null,
  p_conversation_id uuid default null,
  p_data jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if p_user_id is null then
    return;
  end if;

  insert into public.notifications(user_id, actor_id, type, entity_id, conversation_id, data)
  values (p_user_id, p_actor_id, p_type, p_entity_id, p_conversation_id, coalesce(p_data, '{}'::jsonb));
end;
$$;

-- 5) Triggers

-- 5A) Likes
create or replace function public.trg_notify_feed_like()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_author uuid;
begin
  select p.author_id into v_author
  from public.feed_posts p
  where p.id = new.post_id
  limit 1;

  if v_author is null then
    return new;
  end if;

  if new.user_id <> v_author then
    perform public._notify(v_author, new.user_id, 'feed_like', new.post_id, null, '{}'::jsonb);
  end if;

  return new;
end;
$$;

drop trigger if exists notify_feed_like on public.feed_post_likes;
create trigger notify_feed_like
after insert on public.feed_post_likes
for each row execute function public.trg_notify_feed_like();

-- 5B) Comments
create or replace function public.trg_notify_feed_comment()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_author uuid;
  v_preview text;
begin
  select p.author_id into v_author
  from public.feed_posts p
  where p.id = new.post_id
  limit 1;

  if v_author is null then
    return new;
  end if;

  if new.author_id <> v_author then
    v_preview := left(coalesce(new.body, ''), 80);
    perform public._notify(
      v_author,
      new.author_id,
      'feed_comment',
      new.post_id,
      null,
      jsonb_build_object('comment_preview', v_preview)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists notify_feed_comment on public.feed_post_comments;
create trigger notify_feed_comment
after insert on public.feed_post_comments
for each row execute function public.trg_notify_feed_comment();

-- 5C) Follow + connection
create or replace function public.trg_notify_follow()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_is_mutual boolean;
begin
  -- notify followed user
  if new.follower_id <> new.following_id then
    perform public._notify(new.following_id, new.follower_id, 'follow', null, null, '{}'::jsonb);
  end if;

  -- connection if reciprocal exists
  select exists(
    select 1
    from public.follows f
    where f.follower_id = new.following_id
      and f.following_id = new.follower_id
  ) into v_is_mutual;

  if v_is_mutual then
    perform public._notify(new.follower_id, new.following_id, 'connection', null, null, '{}'::jsonb);
  end if;

  return new;
end;
$$;

drop trigger if exists notify_follow on public.follows;
create trigger notify_follow
after insert on public.follows
for each row execute function public.trg_notify_follow();

-- 5D) Messages (dm_message vs dm_request)
create or replace function public.trg_notify_message()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  r record;
  v_type text;
begin
  for r in
    select cm.user_id, cm.folder, cm.accepted_at
    from public.conversation_members cm
    where cm.conversation_id = new.conversation_id
      and cm.user_id <> new.sender_id
  loop
    if r.folder = 'requests'::public.conversation_folder and r.accepted_at is null then
      v_type := 'dm_request';
    else
      v_type := 'dm_message';
    end if;

    perform public._notify(r.user_id, new.sender_id, v_type, null, new.conversation_id, '{}'::jsonb);
  end loop;

  return new;
end;
$$;

drop trigger if exists notify_message on public.messages;
create trigger notify_message
after insert on public.messages
for each row execute function public.trg_notify_message();

-- 5E) DM request accepted
create or replace function public.trg_notify_dm_request_accepted()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  r record;
begin
  if old.accepted_at is null and new.accepted_at is not null then
    for r in
      select cm.user_id
      from public.conversation_members cm
      where cm.conversation_id = new.conversation_id
        and cm.user_id <> new.user_id
    loop
      perform public._notify(r.user_id, new.user_id, 'dm_request_accepted', null, new.conversation_id, '{}'::jsonb);
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists notify_dm_request_accepted on public.conversation_members;
create trigger notify_dm_request_accepted
after update of accepted_at on public.conversation_members
for each row execute function public.trg_notify_dm_request_accepted();

-- 5F) New training published
create or replace function public.trg_notify_training_published()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_should_notify boolean := false;
  r record;
begin
  if tg_op = 'INSERT' then
    v_should_notify := (new.published = true);
  elsif tg_op = 'UPDATE' then
    v_should_notify := (old.published = false and new.published = true);
  end if;

  if not v_should_notify then
    return new;
  end if;

  for r in
    select p.user_id
    from public.profiles p
    where p.access_status = 'approved'::public.access_status
  loop
    perform public._notify(r.user_id, null, 'class_new_training', new.id, null, '{}'::jsonb);
  end loop;

  return new;
end;
$$;

drop trigger if exists notify_training_published on public.trainings;
create trigger notify_training_published
after insert or update of published on public.trainings
for each row execute function public.trg_notify_training_published();
