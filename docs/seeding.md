# デモデータ投入手順

このファイルでは `backend/seeds/stores.json` にあるデモ店舗データを Supabase/Postgres に投入する手順を説明します。

前提
- Supabase プロジェクトが作成済み
- `stores` テーブルは `backend/db/schema.sql` に基づいて作成済み（未作成の場合は schema.sql を先に実行してください）

方法 A: Supabase コンソールの SQL エディタを使う（簡単）
1. Supabase コンソールにログイン → SQL Editor を開く
2. 下の `INSERT` ステートメントをコピーして実行する

-- INSERT ステートメント（例）
INSERT INTO stores (id, name, lat, lng, genre, price_score, access_score, rating_score, vibe_score, speed_score)
VALUES
('store_001','京都ラーメン太郎',34.9937,135.7467,'ラーメン',0.9,0.8,0.7,0.3,0.9),
('store_002','Trattoria Bellissimo',34.9945,135.7480,'イタリアン',0.3,0.6,0.9,0.95,0.4),
('store_003','牛丼キング 五条店',34.9925,135.7450,'牛丼',0.95,0.85,0.5,0.15,0.95),
('store_004','隠れ家ダイニング 月灯り',34.9950,135.7455,'創作和食',0.2,0.4,0.85,0.9,0.3),
('store_005','カフェ・ド・ポルト',34.9932,135.7490,'カフェ',0.6,0.7,0.75,0.8,0.6),
('store_006','焼肉ホルモン 炎',34.9920,135.7475,'焼肉',0.4,0.7,0.8,0.5,0.5),
('store_007','立ち飲み 酔虎伝',34.9940,135.7442,'居酒屋',0.85,0.9,0.6,0.2,0.8),
('store_008','スパイスカレー NAMASTE',34.9928,135.7460,'カレー',0.7,0.65,0.8,0.6,0.7)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  genre = EXCLUDED.genre,
  price_score = EXCLUDED.price_score,
  access_score = EXCLUDED.access_score,
  rating_score = EXCLUDED.rating_score,
  vibe_score = EXCLUDED.vibe_score,
  speed_score = EXCLUDED.speed_score;

方法 B: psql を使う（CLI）
1. Supabase の Project → Settings → Database の Connection string（またはサービスロールキーから生成した接続情報）を取得する
2. ローカルで psql に接続して schema.sql を実行してから上記 INSERT を実行します。

例:
```bash
# スキーマの適用（初回のみ）
psql "postgresql://<user>:<password>@<host>:5432/<db>" -f backend/db/schema.sql

# データ投入
psql "postgresql://<user>:<password>@<host>:5432/<db>" -c "-- 上記の INSERT 文をここに貼る --"
```

方法 C: Supabase CLI（ローカルから一括投入）
1. supabase CLI をインストール
2. `supabase db reset` や `supabase db push` を使って schema を反映
3. psql と同様に INSERT 文を実行

補足: JSON から直接挿入したい場合
- PostgreSQL の `json_populate_recordset` を使う方法もありますが、簡単のため上記の INSERT を推奨します。

問題が発生したら
- `created_at` の制約や NOT NULL によるエラーが出る場合、`created_at` を指定して INSERT するか、schema のデフォルトを確認してください。
- lat/lng の CHECK エラーが出る場合は値の範囲を確認してください。

以上。投入を実行したら教えてください — 検証用の簡易クエリや、フロントで表示確認する手順も用意します。
