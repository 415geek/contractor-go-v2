-- Stripe 订阅与 public.users 关联（Clerk user id 为主键）
alter table public.users add column if not exists stripe_customer_id text;
alter table public.users add column if not exists stripe_subscription_id text;

create unique index if not exists users_stripe_customer_id_unique
  on public.users (stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists users_stripe_subscription_id_idx
  on public.users (stripe_subscription_id)
  where stripe_subscription_id is not null;

comment on column public.users.stripe_customer_id is 'Stripe Customer id (cus_...)';
comment on column public.users.stripe_subscription_id is 'Stripe Subscription id (sub_...)';
