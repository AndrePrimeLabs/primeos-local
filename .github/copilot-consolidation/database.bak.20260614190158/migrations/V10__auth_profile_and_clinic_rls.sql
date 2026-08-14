-- V10: invite-only auth profile bootstrap + clinic-wide RLS guard
--
-- PrimeOS is an internal clinic OS. Data is shared across the clinic, but it
-- should be available only to invited users with an active profile.

insert into schema_migrations (version, description)
values ('V10', 'auth_profile_and_clinic_rls')
on conflict (version) do nothing;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_app_meta_data ->> 'role', 'user'),
    'active'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        updated_date = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

insert into public.profiles (id, email, full_name, role, status)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)),
  coalesce(u.raw_app_meta_data ->> 'role', 'user'),
  'active'
from auth.users u
on conflict (id) do nothing;

create or replace function public.is_primeos_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
  );
$$;

create or replace function public.is_primeos_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and p.role = 'admin'
  );
$$;

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.is_primeos_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update
  to authenticated
  using (id = auth.uid() or public.is_primeos_admin())
  with check (
    (id = auth.uid() and role = 'user')
    or public.is_primeos_admin()
  );

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all
  to authenticated
  using (public.is_primeos_admin())
  with check (public.is_primeos_admin());

do $$
declare
  table_name text;
begin
  for table_name in
    select t.table_name
    from information_schema.tables t
    where t.table_schema = 'public'
      and t.table_type = 'BASE TABLE'
      and t.table_name not in ('schema_migrations', 'profiles')
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists "allow_all_%s" on public.%I', table_name, table_name);
    execute format('drop policy if exists "%s_active_staff_all" on public.%I', table_name, table_name);
    execute format(
      'create policy "%s_active_staff_all" on public.%I for all to authenticated using (public.is_primeos_active_user()) with check (public.is_primeos_active_user())',
      table_name,
      table_name
    );
  end loop;
end $$;
