-- 早期 messages 有 body NOT NULL；002 风格表仅有 original_content。补列以便 Edge 可统一写入。
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'messages'
  ) then
    return;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'messages' and column_name = 'body'
  ) then
    alter table public.messages add column body text not null default '';
    update public.messages
    set body = coalesce(nullif(trim(original_content), ''), nullif(trim(translated_content), ''), '')
    where body = '';
  end if;
end
$$;
