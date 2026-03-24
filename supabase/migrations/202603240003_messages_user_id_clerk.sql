-- messages.user_id：早期 phase1_core 为 uuid；Clerk 迁移后 users.id 为 text，Edge 插入未带 user_id 会 NOT NULL 失败。
-- 统一为 text，并从 conversations.user_id 回填。
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'messages'
  ) then
    return;
  end if;

  -- 无 user_id 列（仅 002 风格表）：新增并回填
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'messages' and column_name = 'user_id'
  ) then
    alter table public.messages
      add column user_id text references public.users (id) on delete cascade;
    update public.messages m
    set user_id = c.user_id
    from public.conversations c
    where m.conversation_id = c.id;
    if exists (select 1 from public.messages where user_id is null) then
      raise exception 'messages: cannot set user_id NOT NULL, rows without conversation owner';
    end if;
    alter table public.messages alter column user_id set not null;
    create index if not exists messages_user_created_idx on public.messages (user_id, created_at desc);
    return;
  end if;

  -- 遗留 uuid 列：换为 text + Clerk id
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'messages' and column_name = 'user_id'
      and udt_name = 'uuid'
  ) then
    alter table public.messages drop constraint if exists messages_user_id_fkey;
    alter table public.messages add column user_id_clerk text references public.users (id) on delete cascade;
    update public.messages m
    set user_id_clerk = c.user_id
    from public.conversations c
    where m.conversation_id = c.id;
    if exists (select 1 from public.messages where user_id_clerk is null) then
      raise exception 'messages: user_id_clerk backfill left NULL rows';
    end if;
    alter table public.messages drop column user_id;
    alter table public.messages rename column user_id_clerk to user_id;
    alter table public.messages alter column user_id set not null;
    create index if not exists messages_user_created_idx on public.messages (user_id, created_at desc);
    return;
  end if;

  -- 已是 text：只补空值并保证 NOT NULL
  update public.messages m
  set user_id = c.user_id
  from public.conversations c
  where m.conversation_id = c.id and m.user_id is null;
  if exists (select 1 from public.messages where user_id is null) then
    raise exception 'messages.user_id still NULL after backfill from conversations';
  end if;
  alter table public.messages alter column user_id set not null;
end
$$;
