-- send-message / voip-webhook 写入语言字段；phase2 迁移曾漏加
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'messages'
  ) then
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'messages' and column_name = 'original_language'
    ) then
      alter table public.messages add column original_language text;
    end if;
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'messages' and column_name = 'translated_language'
    ) then
      alter table public.messages add column translated_language text;
    end if;
  end if;
end
$$;
