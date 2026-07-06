-- Garante que documentos de contratados aceitem qualquer tipo de arquivo.
update storage.buckets
set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = null
where id = 'hub-contratados-documentos';
