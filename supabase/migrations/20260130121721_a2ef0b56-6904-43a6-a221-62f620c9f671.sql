-- Waitlist leads (public landing)
create table if not exists public.waitlist_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text null,
  ip_hash text null,
  created_at timestamptz not null default now()
);

-- Basic sanity constraints (immutable)
alter table public.waitlist_leads
  add constraint waitlist_leads_email_not_blank check (length(btrim(email)) > 0);

alter table public.waitlist_leads
  add constraint waitlist_leads_email_length check (length(email) <= 255);

-- Uniqueness (case-insensitive)
create unique index if not exists waitlist_leads_email_lower_uidx
  on public.waitlist_leads (lower(email));

-- Enable RLS
alter table public.waitlist_leads enable row level security;

-- Public can insert (edge function validates further)
create policy "Anyone can join waitlist"
on public.waitlist_leads
for insert
with check (true);

-- Only admins can read
create policy "Admins can read waitlist"
on public.waitlist_leads
for select
using (public.has_role(auth.uid(), 'admin'::public.app_role));

-- No updates/deletes from clients
create policy "No updates for waitlist"
on public.waitlist_leads
for update
using (false)
with check (false);

create policy "No deletes for waitlist"
on public.waitlist_leads
for delete
using (false);
