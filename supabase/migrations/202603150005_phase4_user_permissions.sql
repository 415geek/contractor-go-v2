-- Phase 4: user_permissions + optional users columns for admin
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'subscription_tier') then
    alter table public.users add column subscription_tier text not null default 'free';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'email') then
    alter table public.users add column email text unique;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'display_name') then
    alter table public.users add column display_name text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'subscription_expires_at') then
    alter table public.users add column subscription_expires_at timestamptz;
  end if;
end
$$;

create table if not exists public.user_permissions (
  user_id uuid primary key references public.users (id) on delete cascade,
  permissions jsonb not null default '{}'::jsonb
);

create index if not exists idx_user_permissions_user_id on public.user_permissions (user_id);

alter table public.user_permissions enable row level security;

-- Users can read own permissions; only service_role (admin) can insert/update/delete
drop policy if exists "user_permissions_select_own" on public.user_permissions;
create policy "user_permissions_select_own"
on public.user_permissions for select
using (auth.uid() = user_id);
