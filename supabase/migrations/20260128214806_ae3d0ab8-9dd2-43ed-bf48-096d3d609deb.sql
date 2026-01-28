-- 1) Helpers
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2) Profiles
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'update_profiles_updated_at'
  ) then
    create trigger update_profiles_updated_at
    before update on public.profiles
    for each row execute function public.update_updated_at_column();
  end if;
end $$;

create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = user_id);

-- 3) Roles (separate table)
do $$ begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'moderator', 'user');
  end if;
end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Users can see their own roles
create policy "Users can view own roles"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id);

-- Admins can manage roles
create policy "Admins can insert roles"
on public.user_roles
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete roles"
on public.user_roles
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- 4) Training content
create table if not exists public.training_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.training_categories enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'update_training_categories_updated_at'
  ) then
    create trigger update_training_categories_updated_at
    before update on public.training_categories
    for each row execute function public.update_updated_at_column();
  end if;
end $$;

create policy "Authenticated can view categories"
on public.training_categories
for select
to authenticated
using (true);

create policy "Admins manage categories"
on public.training_categories
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create table if not exists public.trainings (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.training_categories(id) on delete set null,
  title text not null,
  description text,
  youtube_url text not null,
  cover_path text,
  cover_url text,
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_trainings_category_sort on public.trainings (category_id, sort_order, created_at desc);

alter table public.trainings enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'update_trainings_updated_at'
  ) then
    create trigger update_trainings_updated_at
    before update on public.trainings
    for each row execute function public.update_updated_at_column();
  end if;
end $$;

create policy "Authenticated can view published trainings"
on public.trainings
for select
to authenticated
using (published = true or public.has_role(auth.uid(), 'admin'));

create policy "Admins manage trainings"
on public.trainings
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- 5) Storage bucket for covers
insert into storage.buckets (id, name, public)
values ('training-covers', 'training-covers', true)
on conflict (id) do nothing;

-- RLS policies for storage.objects (covers)
create policy "Anyone can view training covers"
on storage.objects
for select
to public
using (bucket_id = 'training-covers');

create policy "Admins can upload training covers"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'training-covers' and public.has_role(auth.uid(), 'admin'));

create policy "Admins can update training covers"
on storage.objects
for update
to authenticated
using (bucket_id = 'training-covers' and public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete training covers"
on storage.objects
for delete
to authenticated
using (bucket_id = 'training-covers' and public.has_role(auth.uid(), 'admin'));
