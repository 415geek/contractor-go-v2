create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('contractor', 'admin');
  end if;

  if not exists (select 1 from pg_type where typname = 'virtual_number_status') then
    create type public.virtual_number_status as enum ('provisioning', 'active', 'inactive');
  end if;

  if not exists (select 1 from pg_type where typname = 'conversation_channel') then
    create type public.conversation_channel as enum ('sms', 'whatsapp', 'system');
  end if;

  if not exists (select 1 from pg_type where typname = 'conversation_status') then
    create type public.conversation_status as enum ('active', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'message_direction') then
    create type public.message_direction as enum ('inbound', 'outbound');
  end if;

  if not exists (select 1 from pg_type where typname = 'message_status') then
    create type public.message_status as enum ('queued', 'sent', 'delivered', 'failed');
  end if;

  if not exists (select 1 from pg_type where typname = 'project_status') then
    create type public.project_status as enum ('draft', 'active', 'paused', 'completed');
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.touch_conversation_last_message_at()
returns trigger
language plpgsql
as $$
begin
  update public.conversations
  set
    last_message_at = coalesce(new.sent_at, new.created_at),
    updated_at = timezone('utc', now())
  where id = new.conversation_id;

  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text not null unique,
  full_name text,
  role public.app_role not null default 'contractor',
  onboarding_completed boolean not null default false,
  last_sign_in_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint users_phone_e164 check (phone ~ '^\+[1-9][0-9]{7,14}$')
);

create table if not exists public.virtual_numbers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  provider text not null,
  label text,
  phone_number text not null unique,
  status public.virtual_number_status not null default 'provisioning',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint virtual_numbers_phone_e164 check (phone_number ~ '^\+[1-9][0-9]{7,14}$')
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  virtual_number_id uuid references public.virtual_numbers (id) on delete set null,
  title text,
  channel public.conversation_channel not null default 'sms',
  status public.conversation_status not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  last_message_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  direction public.message_direction not null,
  status public.message_status not null default 'queued',
  body text not null,
  external_message_id text,
  sent_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  description text,
  status public.project_status not null default 'draft',
  city text,
  budget_cents integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint projects_budget_non_negative check (budget_cents is null or budget_cents >= 0)
);

create table if not exists public.material_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  query text not null,
  filters jsonb not null default '{}'::jsonb,
  result_count integer not null default 0,
  last_run_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint material_searches_result_count_non_negative check (result_count >= 0)
);

create table if not exists public.user_analytics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  event_name text not null,
  subject_type text not null,
  subject_value text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists users_phone_idx on public.users (phone);
create index if not exists virtual_numbers_user_status_idx on public.virtual_numbers (user_id, status);
create index if not exists conversations_user_last_message_idx on public.conversations (user_id, last_message_at desc);
create index if not exists messages_conversation_created_idx on public.messages (conversation_id, created_at desc);
create index if not exists messages_user_created_idx on public.messages (user_id, created_at desc);
create index if not exists projects_user_status_idx on public.projects (user_id, status);
create index if not exists material_searches_user_created_idx on public.material_searches (user_id, created_at desc);
create index if not exists user_analytics_subject_event_idx on public.user_analytics (subject_type, subject_value, event_name, created_at desc);
create index if not exists user_analytics_user_event_idx on public.user_analytics (user_id, event_name, created_at desc);

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

drop trigger if exists set_virtual_numbers_updated_at on public.virtual_numbers;
create trigger set_virtual_numbers_updated_at
before update on public.virtual_numbers
for each row
execute function public.set_updated_at();

drop trigger if exists set_conversations_updated_at on public.conversations;
create trigger set_conversations_updated_at
before update on public.conversations
for each row
execute function public.set_updated_at();

drop trigger if exists set_messages_updated_at on public.messages;
create trigger set_messages_updated_at
before update on public.messages
for each row
execute function public.set_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

drop trigger if exists set_material_searches_updated_at on public.material_searches;
create trigger set_material_searches_updated_at
before update on public.material_searches
for each row
execute function public.set_updated_at();

drop trigger if exists messages_touch_conversation_last_message_at on public.messages;
create trigger messages_touch_conversation_last_message_at
after insert on public.messages
for each row
execute function public.touch_conversation_last_message_at();

alter table public.users enable row level security;
alter table public.virtual_numbers enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.projects enable row level security;
alter table public.material_searches enable row level security;
alter table public.user_analytics enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
on public.users
for select
using (auth.uid() = id);

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own"
on public.users
for insert
with check (auth.uid() = id);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
on public.users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "virtual_numbers_manage_own" on public.virtual_numbers;
create policy "virtual_numbers_manage_own"
on public.virtual_numbers
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "conversations_manage_own" on public.conversations;
create policy "conversations_manage_own"
on public.conversations
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "messages_manage_own" on public.messages;
create policy "messages_manage_own"
on public.messages
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "projects_manage_own" on public.projects;
create policy "projects_manage_own"
on public.projects
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "material_searches_manage_own" on public.material_searches;
create policy "material_searches_manage_own"
on public.material_searches
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_analytics_select_own" on public.user_analytics;
create policy "user_analytics_select_own"
on public.user_analytics
for select
using (auth.uid() = user_id);

drop policy if exists "user_analytics_insert_own" on public.user_analytics;
create policy "user_analytics_insert_own"
on public.user_analytics
for insert
with check (auth.uid() = user_id);
