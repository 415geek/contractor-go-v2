-- 允许 Clerk-only 用户在无手机号时创建 public.users 记录
-- 之前 get-user.ts 仅 upsert { id }，会触发 users.phone NOT NULL (23502)
alter table public.users
  alter column phone drop not null;
