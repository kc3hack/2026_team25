-- ============================================
-- 20260220_add_route_access_columns.sql
-- KRP起点の徒歩ルート事前計算カラムを追加
-- ============================================

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS walk_duration_sec INTEGER;

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS walk_distance_m INTEGER;

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS access_source TEXT;

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS access_updated_at TIMESTAMPTZ;

-- 既存データの最低限バックフィル（旧 access_score は維持）
UPDATE stores
SET access_source = COALESCE(access_source, 'legacy'),
    access_updated_at = COALESCE(access_updated_at, NOW())
WHERE access_score IS NOT NULL;
