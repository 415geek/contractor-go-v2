-- Phase 2: Add columns for messaging if missing (align with 002 schema)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'conversations') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'conversations' and column_name = 'contact_phone') then
      alter table public.conversations add column contact_phone text;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'conversations' and column_name = 'contact_name') then
      alter table public.conversations add column contact_name text;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'conversations' and column_name = 'contact_language') then
      alter table public.conversations add column contact_language text default 'en-US';
    end if;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'messages') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'messages' and column_name = 'original_content') then
      alter table public.messages add column original_content text;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'messages' and column_name = 'translated_content') then
      alter table public.messages add column translated_content text;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'messages' and column_name = 'message_type') then
      alter table public.messages add column message_type text default 'text';
    end if;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'users') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'default_language') then
      alter table public.users add column default_language text default 'zh-CN';
    end if;
  end if;
end
$$;
