update storage.buckets
set allowed_mime_types = null,
    file_size_limit = 10485760,
    public = false
where id = 'hub-contratados-documentos';
