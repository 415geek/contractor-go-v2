-- Phase 3: house_estimates and permit_searches for tools
create table if not exists public.house_estimates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  image_urls text[] not null default '{}',
  analysis_result jsonb not null default '{}'::jsonb,
  total_estimate jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.permit_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  address text not null,
  city text,
  raw_data jsonb,
  parsed_result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_house_estimates_user_id on public.house_estimates (user_id);
create index if not exists idx_permit_searches_user_id on public.permit_searches (user_id);

alter table public.house_estimates enable row level security;
alter table public.permit_searches enable row level security;

drop policy if exists "house_estimates_manage_own" on public.house_estimates;
create policy "house_estimates_manage_own"
on public.house_estimates for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "permit_searches_manage_own" on public.permit_searches;
create policy "permit_searches_manage_own"
on public.permit_searches for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
