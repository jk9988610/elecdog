-- ElecDog 田野云同步（Supabase SQL Editor 中执行）
-- 与 Beat-Battle / Card-World 共用同一 Supabase 项目
-- 1. Storage → New bucket：名称 elecdog-logs，勾选 Public bucket
-- 2. 在 SQL Editor 运行本文件
-- 3. 再运行 schema-storage-policies.sql

create table if not exists field_runs (
  id uuid primary key default gen_random_uuid(),
  place text not null default '01',
  world_name text,
  tick bigint not null default 0,
  alive_count int not null default 0,
  total_beings int not null default 0,
  observer_label text,
  summary jsonb,
  log_path text,
  created_at timestamptz not null default now()
);

create index if not exists field_runs_created_at_idx on field_runs (created_at desc);
create index if not exists field_runs_place_idx on field_runs (place);

create table if not exists field_notes (
  id uuid primary key default gen_random_uuid(),
  obs_id text not null,
  content text not null,
  related_run_id uuid references field_runs(id) on delete set null,
  author_label text,
  tags text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists field_notes_obs_id_idx on field_notes (obs_id);

alter table field_runs enable row level security;
alter table field_notes enable row level security;

create policy "field_runs_all" on field_runs for all using (true) with check (true);
create policy "field_notes_all" on field_notes for all using (true) with check (true);
