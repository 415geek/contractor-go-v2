-- Telnyx 出站消息 id：用于 message.finalized 回写送达/失败状态
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
    where table_schema = 'public' and table_name = 'messages' and column_name = 'external_message_id'
  ) then
    alter table public.messages add column external_message_id text;
    create index if not exists messages_external_message_id_idx
      on public.messages (external_message_id)
      where external_message_id is not null;
  end if;
end
$$;
