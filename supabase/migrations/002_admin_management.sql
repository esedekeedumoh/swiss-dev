create table if not exists public.admin_users (
    id uuid primary key default gen_random_uuid(),
    email text not null unique,
    password_hash text not null,
    display_name text not null default 'Admin',
    must_change_password boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

  alter table public.admin_users
    add column if not exists must_change_password boolean not null default false;

insert into public.admin_users (email, password_hash, display_name, must_change_password)
values ('eddy@swiss.admin', crypt('admin12345', gen_salt('bf')), 'Primary admin', true)
on conflict (email) do nothing;

update public.admin_users
set password_hash = crypt('admin12345', gen_salt('bf')),
    display_name = 'Primary admin',
    must_change_password = true
where email = 'eddy@swiss.admin';

create or replace function public.verify_admin_login(login_email text, login_password text)
returns table (id uuid, email text, display_name text, must_change_password boolean)
language sql
security definer
set search_path = public
as $$
    select a.id, a.email, a.display_name, a.must_change_password
    from public.admin_users a
    where lower(a.email) = lower(login_email)
      and a.password_hash = crypt(login_password, a.password_hash)
    limit 1;
$$;

revoke all on function public.verify_admin_login(text, text) from public;
grant execute on function public.verify_admin_login(text, text) to service_role;

create or replace function public.create_admin_account(new_email text, new_password text, new_display_name text)
returns table (id uuid, email text, display_name text)
language sql
security definer
set search_path = public
as $$
  insert into public.admin_users (email, password_hash, display_name)
  values (lower(new_email), crypt(new_password, gen_salt('bf')), coalesce(nullif(new_display_name, ''), 'Admin'))
  returning admin_users.id, admin_users.email, admin_users.display_name, admin_users.must_change_password;
$$;

revoke all on function public.create_admin_account(text, text, text) from public;
grant execute on function public.create_admin_account(text, text, text) to service_role;

create or replace function public.update_admin_account(admin_id uuid, new_email text, new_password text, new_display_name text)
returns table (id uuid, email text, display_name text, must_change_password boolean)
language sql
security definer
set search_path = public
as $$
  update public.admin_users
  set email = coalesce(nullif(lower(new_email), ''), email),
    password_hash = case when nullif(new_password, '') is null then password_hash else crypt(new_password, gen_salt('bf')) end,
    display_name = coalesce(nullif(new_display_name, ''), display_name),
    must_change_password = case when nullif(new_password, '') is null then must_change_password else false end
  where admin_users.id = admin_id
  returning admin_users.id, admin_users.email, admin_users.display_name, admin_users.must_change_password;
$$;

create or replace function public.change_admin_password(admin_id uuid, new_password text)
returns boolean
language sql
security definer
set search_path = public
as $$
  update public.admin_users
  set password_hash = crypt(new_password, gen_salt('bf')), must_change_password = false
  where id = admin_id and length(new_password) >= 10;
  select found;
$$;

revoke all on function public.change_admin_password(uuid, text) from public;
grant execute on function public.change_admin_password(uuid, text) to service_role;

revoke all on function public.update_admin_account(uuid, text, text, text) from public;
grant execute on function public.update_admin_account(uuid, text, text, text) to service_role;

alter table public.admin_users enable row level security;

drop trigger if exists admin_users_set_updated_at on public.admin_users;
create trigger admin_users_set_updated_at before update on public.admin_users
for each row execute function public.set_updated_at();