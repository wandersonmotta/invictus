-- RPC: delete notifications (selected or all)
create or replace function public.delete_my_notifications(
  p_ids uuid[] default null,
  p_all boolean default false
)
returns integer
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_me uuid;
  v_deleted int;
begin
  v_me := auth.uid();
  if v_me is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_approved() then
    raise exception 'Not approved';
  end if;

  if coalesce(p_all, false) then
    delete from public.notifications n
    where n.user_id = v_me;
  else
    delete from public.notifications n
    where n.user_id = v_me
      and n.id = any(coalesce(p_ids, array[]::uuid[]));
  end if;

  get diagnostics v_deleted = row_count;
  return coalesce(v_deleted, 0);
end;
$$;
