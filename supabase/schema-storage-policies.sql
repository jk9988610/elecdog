-- Supabase Storage：elecdog-logs 桶策略（SQL Editor 执行）
-- 前置：Dashboard → Storage → New bucket → 名称 elecdog-logs → Public bucket ON

create policy "elecdog_logs_public_read"
  on storage.objects for select
  using (bucket_id = 'elecdog-logs');

create policy "elecdog_logs_anon_insert"
  on storage.objects for insert
  with check (bucket_id = 'elecdog-logs');

create policy "elecdog_logs_anon_update"
  on storage.objects for update
  using (bucket_id = 'elecdog-logs')
  with check (bucket_id = 'elecdog-logs');
