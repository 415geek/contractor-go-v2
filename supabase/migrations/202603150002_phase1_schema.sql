create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'subscription_tier'
  ) then
    create type public.subscription_tier as enum ('free', 'basic', 'pro');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'virtual_number_status'
  ) then
    create type public.virtual_number_status as enum ('active', 'inactive', 'expired');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'message_direction'
  ) then
    create type public.message_direction as enum ('inbound', 'outbound');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'message_status'
  ) then
    create type public.message_status as enum ('queued', 'sent', 'delivered', 'failed', 'read');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'project_status'
  ) then
    create type public.project_status as enum ('planning', 'active', 'on_hold', 'completed', 'cancelled');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'contract_type'
  ) then
    create type public.contract_type as enum ('fixed', 'hourly', 'cost_plus', 'other');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'device_type'
  ) then
    create type public.device_type as enum ('ios', 'android', 'web', 'unknown');
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

create or replace function public.set_conversation_last_message_at()
returns trigger
language plpgsql
as $$
begin
  update public.conversations
  set last_message_at = new.created_at
  where id = new.conversation_id;

  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text unique,
  email text unique,
  display_name text,
  avatar_url text,
  default_language text not null default 'zh-CN',
  target_language text not null default 'en-US',
  subscription_tier public.subscription_tier not null default 'free',
  subscription_expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.virtual_numbers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  phone_number text not null unique,
  provider text not null default 'voipms',
  provider_id text,
  area_code text,
  monthly_cost numeric(10, 2) not null default 0,
  status public.virtual_number_status not null default 'active',
  purchased_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  virtual_number_id uuid references public.virtual_numbers (id) on delete set null,
  contact_phone text not null,
  contact_name text,
  contact_language text not null default 'en-US',
  last_message_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  direction public.message_direction not null,
  message_type text not null default 'text',
  original_content text,
  translated_content text,
  original_language text,
  translated_language text,
  voice_url text,
  voice_duration integer,
  status public.message_status not null default 'sent',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  address text,
  client_name text,
  client_phone text,
  client_email text,
  total_cost numeric(12, 2) not null default 0,
  labor_cost numeric(12, 2) not null default 0,
  material_cost numeric(12, 2) not null default 0,
  contract_type public.contract_type,
  start_date date,
  end_date date,
  duration_days integer,
  status public.project_status not null default 'planning',
  ai_summary jsonb not null default '{}'::jsonb,
  construction_plan jsonb not null default '{}'::jsonb,
  material_list jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.material_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  image_urls text[] not null default '{}',
  description text,
  ai_recognized_material jsonb not null default '{}'::jsonb,
  search_results jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_analytics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  session_id text not null,
  page_path text not null,
  action_type text not null,
  action_data jsonb not null default '{}'::jsonb,
  duration_ms integer,
  ip_address inet,
  user_agent text,
  device_type public.device_type not null default 'unknown',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.otp_rate_limits (
  phone text primary key,
  last_sent_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'phone'
  ) then
    create index if not exists idx_users_phone on public.users (phone);
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'subscription_tier'
  ) then
    create index if not exists idx_users_subscription_tier on public.users (subscription_tier);
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'virtual_numbers' and column_name = 'user_id'
  ) then
    create index if not exists idx_virtual_numbers_user_id on public.virtual_numbers (user_id);
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'virtual_numbers' and column_name = 'status'
  ) then
    create index if not exists idx_virtual_numbers_status on public.virtual_numbers (status);
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'conversations' and column_name = 'user_id'
  ) then
    create index if not exists idx_conversations_user_id on public.conversations (user_id);
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'conversations' and column_name = 'virtual_number_id'
  ) then
    create index if not exists idx_conversations_virtual_number_id on public.conversations (virtual_number_id);
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'conversations' and column_name = 'last_message_at'
  ) then
    create index if not exists idx_conversations_last_message_at on public.conversations (last_message_at desc nulls last);
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'conversations' and column_name = 'contact_phone'
  ) then
    create index if not exists idx_conversations_contact_phone on public.conversations (contact_phone);
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'messages' and column_name = 'conversation_id'
  ) then
    create index if not exists idx_messages_conversation_id on public.messages (conversation_id);
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'messages' and column_name = 'created_at'
  ) then
    create index if not exists idx_messages_created_at on public.messages (created_at desc);
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'messages' and column_name = 'status'
  ) then
    create index if not exists idx_messages_status on public.messages (status);
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'projects' and column_name = 'user_id'
  ) then
    create index if not exists idx_projects_user_id on public.projects (user_id);
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'projects' and column_name = 'status'
  ) then
    create index if not exists idx_projects_status on public.projects (status);
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'projects' and column_name = 'start_date'
  ) then
    create index if not exists idx_projects_start_date on public.projects (start_date);
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'material_searches' and column_name = 'user_id'
  ) then
    create index if not exists idx_material_searches_user_id on public.material_searches (user_id);
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'material_searches' and column_name = 'project_id'
  ) then
    create index if not exists idx_material_searches_project_id on public.material_searches (project_id);
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'material_searches' and column_name = 'created_at'
  ) then
    create index if not exists idx_material_searches_created_at on public.material_searches (created_at desc);
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_analytics' and column_name = 'user_id'
  ) then
    create index if not exists idx_user_analytics_user_id on public.user_analytics (user_id);
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_analytics' and column_name = 'session_id'
  ) then
    create index if not exists idx_user_analytics_session_id on public.user_analytics (session_id);
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_analytics' and column_name = 'created_at'
  ) then
    create index if not exists idx_user_analytics_created_at on public.user_analytics (created_at desc);
  end if;
end
$$;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

drop trigger if exists set_otp_rate_limits_updated_at on public.otp_rate_limits;
create trigger set_otp_rate_limits_updated_at
before update on public.otp_rate_limits
for each row
execute function public.set_updated_at();

drop trigger if exists update_conversation_last_message_at on public.messages;
create trigger update_conversation_last_message_at
after insert on public.messages
for each row
execute function public.set_conversation_last_message_at();

alter table public.users enable row level security;
alter table public.virtual_numbers enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.projects enable row level security;
alter table public.material_searches enable row level security;
alter table public.user_analytics enable row level security;
alter table public.otp_rate_limits enable row level security;

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

drop policy if exists "users_delete_own" on public.users;
create policy "users_delete_own"
on public.users
for delete
using (auth.uid() = id);

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
using (
  exists (
    select 1
    from public.conversations
    where conversations.id = messages.conversation_id
      and conversations.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.conversations
    where conversations.id = messages.conversation_id
      and conversations.user_id = auth.uid()
  )
);

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

drop policy if exists "user_analytics_manage_own" on public.user_analytics;
create policy "user_analytics_manage_own"
on public.user_analytics
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
