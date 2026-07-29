-- 启用 Supabase Realtime 发布（SQL Editor 执行）
-- 前置：已执行 schema.sql
-- 作用：观察台多设备可订阅 field_runs / field_notes 变更

alter publication supabase_realtime add table field_runs;
alter publication supabase_realtime add table field_notes;
