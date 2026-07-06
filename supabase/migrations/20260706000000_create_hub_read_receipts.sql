create table if not exists public.hub_read_receipts (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('message', 'notification')),
  item_id text not null,
  read_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id)
);

alter table public.hub_read_receipts enable row level security;

grant select, insert, update, delete on public.hub_read_receipts to authenticated;

drop policy if exists "hub_read_receipts_own" on public.hub_read_receipts;
create policy "hub_read_receipts_own"
on public.hub_read_receipts
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
