-- Run this entire script in Supabase SQL Editor.
-- It creates the app profile model, role enum, triggers, and RLS policies.

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('student', 'teacher', 'admin');
  end if;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null default '',
  role public.app_role not null default 'student',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'system',
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_settings_updated_at on public.user_settings;
create trigger trg_user_settings_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text;
  v_role public.app_role;
begin
  v_full_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'User');
  v_role := coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'student');

  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, v_full_name, v_role)
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        role = excluded.role,
        updated_at = now();

  insert into public.user_settings (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
exception
  when others then
    raise warning 'handle_new_user failed for user %: %', new.id, sqlerrm;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "read own settings" on public.user_settings;
create policy "read own settings"
on public.user_settings
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "insert own settings" on public.user_settings;
create policy "insert own settings"
on public.user_settings
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "update own settings" on public.user_settings;
create policy "update own settings"
on public.user_settings
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

