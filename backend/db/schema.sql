-- ============================================
-- schema.sql — テーブル定義
-- 【D専任】このファイルは D のみが編集する
-- ============================================

CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  genre TEXT NOT NULL,
  -- 緯度経度の簡易チェック
  CHECK (lat BETWEEN -90 AND 90),
  CHECK (lng BETWEEN -180 AND 180),

  price_score DOUBLE PRECISION NOT NULL CHECK (price_score BETWEEN 0 AND 1),
  access_score DOUBLE PRECISION NOT NULL CHECK (access_score BETWEEN 0 AND 1),
  rating_score DOUBLE PRECISION NOT NULL CHECK (rating_score BETWEEN 0 AND 1),
  vibe_score DOUBLE PRECISION NOT NULL CHECK (vibe_score BETWEEN 0 AND 1),
  speed_score DOUBLE PRECISION NOT NULL CHECK (speed_score BETWEEN 0 AND 1),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 推奨インデックス: ジャンルでのフィルタや作成日時でのソートを高速化
CREATE INDEX IF NOT EXISTS idx_stores_genre ON stores (genre);
CREATE INDEX IF NOT EXISTS idx_stores_created_at ON stores (created_at);

-- PostGIS を利用する場合のオプション（コメントアウト）:
-- CREATE EXTENSION IF NOT EXISTS postgis;
-- ALTER TABLE stores ADD COLUMN IF NOT EXISTS geom geography(POINT, 4326);
-- UPDATE stores SET geom = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography WHERE geom IS NULL;
-- CREATE INDEX IF NOT EXISTS idx_stores_geom ON stores USING GIST (geom);
