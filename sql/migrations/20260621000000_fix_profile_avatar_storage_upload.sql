-- Storage finalizes object metadata after the INSERT RLS check.
-- MIME and size remain enforced by the private bucket configuration.
drop policy if exists "hub_chat_files_role_insert" on storage.objects;

create policy "hub_chat_files_role_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'hub-chat-files'
  and (
    app_private.hub_is_rh()
    or name like 'avatars/%'
    or (
      name like 'chat/%'
      and app_private.hub_can_access_chat_channel(split_part(name, '/', 2))
    )
  )
);
