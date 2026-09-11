-- Swiss Dev initial Supabase schema
-- Run with Supabase SQL Editor or: supabase db push

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text,
    avatar_url text,
    plan text not null default 'free' check (plan in ('free', 'builder', 'pro')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.plan_catalog (
    slug text primary key check (slug in ('free', 'builder', 'pro')),
    monthly_price_cents integer not null check (monthly_price_cents >= 0),
    annual_price_cents integer not null check (annual_price_cents >= 0),
    daily_runtime_seconds integer,
    monthly_domain_limit integer,
    agent_limit integer,
    ai_tier text not null,
    can_publish boolean not null default false,
    branding_required boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

insert into public.plan_catalog (slug, monthly_price_cents, annual_price_cents, daily_runtime_seconds, monthly_domain_limit, agent_limit, ai_tier, can_publish, branding_required)
values
    ('free', 0, 0, 7200, 0, 1, 'basic', false, true),
    ('builder', 799, 7500, 21600, 5, 3, 'higher', true, false),
    ('pro', 2199, 19900, null, null, null, 'best', true, false)
on conflict (slug) do update set
    monthly_price_cents = excluded.monthly_price_cents,
    annual_price_cents = excluded.annual_price_cents,
    daily_runtime_seconds = excluded.daily_runtime_seconds,
    monthly_domain_limit = excluded.monthly_domain_limit,
    agent_limit = excluded.agent_limit,
    ai_tier = excluded.ai_tier,
    can_publish = excluded.can_publish,
    branding_required = excluded.branding_required,
    updated_at = now();

create table if not exists public.subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique references auth.users(id) on delete cascade,
    plan text not null check (plan in ('free', 'builder', 'pro')),
    status text not null default 'active' check (status in ('trialing', 'active', 'past_due', 'canceled', 'incomplete')),
    billing_interval text check (billing_interval in ('month', 'year')),
    provider text,
    provider_customer_id text,
    provider_subscription_id text unique,
    current_period_start timestamptz,
    current_period_end timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id) on delete cascade,
    name text not null default 'Untitled project',
    description text,
    messages jsonb not null default '[]'::jsonb,
    file_data jsonb not null default '{}'::jsonb,
    status text not null default 'active' check (status in ('active', 'archived', 'deleted')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.workspace_files (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    path text not null,
    content text not null default '',
    language text,
    is_entrypoint boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (workspace_id, path)
);

create table if not exists public.agents (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id) on delete cascade,
    workspace_id uuid references public.workspaces(id) on delete cascade,
    name text not null,
    role text not null default 'builder',
    model text not null default 'basic',
    status text not null default 'idle' check (status in ('idle', 'running', 'paused', 'error')),
    instructions text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.custom_domains (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id) on delete cascade,
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    hostname text not null,
    status text not null default 'pending' check (status in ('pending', 'verified', 'active', 'failed')),
    verification_token text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (hostname)
);

create table if not exists public.daily_usage (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    usage_date date not null default current_date,
    runtime_seconds integer not null default 0 check (runtime_seconds >= 0),
    ai_requests integer not null default 0 check (ai_requests >= 0),
    agent_count integer not null default 0 check (agent_count >= 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, usage_date)
);

create table if not exists public.plan_comments (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    author_id uuid not null references auth.users(id) on delete cascade,
    text_selector text not null,
    comment text not null,
    created_at timestamptz not null default now()
);

create table if not exists public.visual_comments (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    author_id uuid not null references auth.users(id) on delete cascade,
    selector_path text not null,
    x_percent numeric(5,2) not null check (x_percent between 0 and 100),
    y_percent numeric(5,2) not null check (y_percent between 0 and 100),
    comment text not null,
    created_at timestamptz not null default now()
);

create index if not exists workspaces_owner_updated_idx on public.workspaces(owner_id, updated_at desc);
create index if not exists workspace_files_workspace_idx on public.workspace_files(workspace_id, path);
create index if not exists agents_owner_idx on public.agents(owner_id);
create index if not exists custom_domains_owner_idx on public.custom_domains(owner_id);
create index if not exists daily_usage_user_date_idx on public.daily_usage(user_id, usage_date desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists plan_catalog_set_updated_at on public.plan_catalog;
create trigger plan_catalog_set_updated_at before update on public.plan_catalog for each row execute function public.set_updated_at();
drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();
drop trigger if exists workspaces_set_updated_at on public.workspaces;
create trigger workspaces_set_updated_at before update on public.workspaces for each row execute function public.set_updated_at();
drop trigger if exists workspace_files_set_updated_at on public.workspace_files;
create trigger workspace_files_set_updated_at before update on public.workspace_files for each row execute function public.set_updated_at();
drop trigger if exists agents_set_updated_at on public.agents;
create trigger agents_set_updated_at before update on public.agents for each row execute function public.set_updated_at();
drop trigger if exists custom_domains_set_updated_at on public.custom_domains;
create trigger custom_domains_set_updated_at before update on public.custom_domains for each row execute function public.set_updated_at();
drop trigger if exists daily_usage_set_updated_at on public.daily_usage;
create trigger daily_usage_set_updated_at before update on public.daily_usage for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.profiles (id, display_name, avatar_url)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), new.raw_user_meta_data ->> 'avatar_url')
    on conflict (id) do nothing;
    insert into public.subscriptions (user_id, plan, status)
    values (new.id, 'free', 'active')
    on conflict (user_id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.plan_catalog enable row level security;
alter table public.subscriptions enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_files enable row level security;
alter table public.agents enable row level security;
alter table public.custom_domains enable row level security;
alter table public.daily_usage enable row level security;
alter table public.plan_comments enable row level security;
alter table public.visual_comments enable row level security;

create policy profiles_owner_read on public.profiles for select using (id = auth.uid());
create policy profiles_owner_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and plan = (select p.plan from public.profiles p where p.id = auth.uid()));
create policy plan_catalog_public_read on public.plan_catalog for select using (true);
create policy subscriptions_owner_read on public.subscriptions for select using (user_id = auth.uid());
create policy workspaces_owner_access on public.workspaces for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy workspace_files_owner_access on public.workspace_files for all using (exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = auth.uid())) with check (exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = auth.uid()));
create policy agents_owner_access on public.agents for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy custom_domains_owner_access on public.custom_domains for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy daily_usage_owner_access on public.daily_usage for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy plan_comments_owner_access on public.plan_comments for all using (exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = auth.uid())) with check (author_id = auth.uid() and exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = auth.uid()));
create policy visual_comments_owner_access on public.visual_comments for all using (exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = auth.uid())) with check (author_id = auth.uid() and exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = auth.uid()));
