-- ElecDog 辞典云同步（Phase 64）
-- 前置：schema.sql 已执行
-- 发布：scripts/codex-cloud-publish.mjs
-- Realtime：schema-realtime-codex.sql

create table if not exists codex_entries (
  id text primary key,
  title text not null,
  definition text not null,
  evidence text[] not null default '{}',
  falsifiable text not null,
  established date,
  tag text,
  updated_at timestamptz not null default now()
);

create index if not exists codex_entries_updated_idx on codex_entries (updated_at desc);

alter table codex_entries enable row level security;

create policy "codex_entries_all" on codex_entries for all using (true) with check (true);
