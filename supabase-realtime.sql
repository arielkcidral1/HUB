﻿alter table public.hub_chat_messages add column if not exists canal text not null default 'geral';

do $$
begin
  alter publication supabase_realtime add table public.hub_denuncias;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.hub_chat_messages;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.hub_malotes;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.hub_vagas;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.hub_users;
exception
  when duplicate_object then null;
end $$;
