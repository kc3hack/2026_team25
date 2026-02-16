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
  price_score DOUBLE PRECISION NOT NULL CHECK (price_score BETWEEN 0 AND 1),
  access_score DOUBLE PRECISION NOT NULL CHECK (access_score BETWEEN 0 AND 1),
  rating_score DOUBLE PRECISION NOT NULL CHECK (rating_score BETWEEN 0 AND 1),
  vibe_score DOUBLE PRECISION NOT NULL CHECK (vibe_score BETWEEN 0 AND 1),
  speed_score DOUBLE PRECISION NOT NULL CHECK (speed_score BETWEEN 0 AND 1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
