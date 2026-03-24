-- 联系人扩展字段 + 短信/彩信附件 URL + chat-media 公开 bucket（供 Telnyx MMS 拉取）
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'conversations') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'conversations' and column_name = 'contact_company') then
      alter table public.conversations add column contact_company text;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'conversations' and column_name = 'contact_notes') then
      alter table public.conversations add column contact_notes text;
    end if;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'messages') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'messages' and column_name = 'media_url') then
      alter table public.messages add column media_url text;
    end if;
  end if;
end
$$;

insert into storage.buckets (id, name, public)
values ('chat-media', 'chat-media', true)
on conflict (id) do nothing;
