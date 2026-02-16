# API 契約書

このドキュメントは `GET /api/stores` / `GET /health` / `POST /api/stores/score` の API 仕様を定義します。
フロントエンド（B）とバックエンド（C）が実装で参照してください。

ベース URL
- 開発環境: `http://localhost:8000`（`VITE_API_URL` に設定）
- 本番: Render にデプロイした URL

認証
- MVP では認証無し（`user_id=1` を仮定）。将来的に Supabase Auth 等を導入する場合は別途仕様を追加します。

共通型（要点）
- Store:
  - id: string
  - name: string
  - lat: number
  - lng: number
  - genre: string
  - price_score: number (0.0-1.0)
  - access_score: number (0.0-1.0)
  - rating_score: number (0.0-1.0)
  - vibe_score: number (0.0-1.0)
  - speed_score: number (0.0-1.0)
- Weights:
  - price, access, rating, vibe, speed: integer (0-100)

1) GET /api/stores

- 概要: 全店舗データを返す。フロントは初回ロードでこのエンドポイントを呼ぶ。
- HTTP: GET
- パス: `/api/stores`
- 認証: なし
- リクエストボディ: なし
- クエリパラメータ: なし（将来: limit, bbox などを追加可能）

レスポンス (200)

```json
{
  "stores": [
    {
      "id": "store_001",
      "name": "京都ラーメン太郎",
      "lat": 34.9937,
      "lng": 135.7467,
      "genre": "ラーメン",
      "price_score": 0.9,
      "access_score": 0.8,
      "rating_score": 0.7,
      "vibe_score": 0.3,
      "speed_score": 0.9
    }
  ]
}
```

エラー
- 500: サーバー内部エラー（DB接続等）

実装メモ
- FastAPI 側では `response_model=StoreResponse` を設定する。

2) GET /health

- 概要: ヘルスチェック
- HTTP: GET
- パス: `/health`
- 認証: なし

レスポンス (200)

```json
{ "status": "ok" }
```

3) POST /api/stores/score

- 概要: 指定した店舗 ID 群について、与えられた重みでサーバー側の計算を行い検証用にスコアを返す（フロントと Python ロジックの一致確認用）。
- HTTP: POST
- パス: `/api/stores/score`
- 認証: なし

リクエストボディ (application/json)

```json
{
  "store_ids": ["store_001", "store_002"],
  "weights": { "price": 90, "access": 70, "rating": 30, "vibe": 10, "speed": 50 }
}
```

レスポンス (200)

```json
{
  "scores": [
    { "store_id": "store_001", "normalized_score": 0.82 },
    { "store_id": "store_002", "normalized_score": 0.45 }
  ]
}
```

エラー
- 400: リクエストバリデーションエラー（weights の型不正や store_ids が空など）
- 404: 指定した store_id が見つからない場合（オプション — 現状は見つからない ID は無視して返す実装でも可）

計算ロジック（共有ルール）

- totalWeight = sum(weights)
- if totalWeight == 0: normalizedScore = 0
- else: normalizedScore = (sum(store.<metric> * weights.<metric>)) / totalWeight
- pinSize = 8 + 24 * normalizedScore (8-32 px)
- pinColor = interpolate(normalizedScore) (0=赤, 0.5=黄, 1=緑)
- visible = normalizedScore >= 0.3

注意事項
- フロント側 `scoreEngine.ts` とバックエンド `services/scoring.py` は同一ロジックを保持し、小数第4位まで一致させること（テストで検証する）。
- CORS: 開発時は `allow_origins=['*']` を許可しているが、本番では適切なオリジンを限定すること。
- レート制限や認証は MVP では不要。ただしデプロイ時に公開範囲を検討してください。

テスト用 cURL（例）

```bash
curl -sS -X POST "$VITE_API_URL/api/stores/score" \
  -H "Content-Type: application/json" \
  -d '{"store_ids":["store_001"],"weights":{"price":90,"access":70,"rating":30,"vibe":10,"speed":50}}'
```

開発者向けメモ
- Pydantic スキーマ: `backend/app/models/schemas.py` に定義済み（`StoreSchema`, `StoreResponse`, `WeightsSchema`, `ScoreRequest`, `ScoreResponse`）。
- DB: `backend/db/schema.sql` に stores テーブルを定義済み。
- シード: `backend/seeds/stores.json` と `docs/seeding.md` を参照。

変更履歴
- 2026-02-16: 初版（D が作成）
# Wagamama Gourmet — API仕様書

> 【D専任】このファイルは D のみが編集する。A/B/C は参照のみ。

## Base URL

- 開発: `http://localhost:8000`
- 本番: `https://wagamama-gourmet-api.onrender.com` (予定)

---

## GET /health

ヘルスチェック。

**Response 200:**
```json
{ "status": "ok" }
```

---

## GET /api/stores

全店舗データを返却する。

**Response 200:**
```json
{
  "stores": [
    {
      "id": "store_001",
      "name": "京都ラーメン太郎",
      "lat": 34.9937,
      "lng": 135.7467,
      "genre": "ラーメン",
      "price_score": 0.9,
      "access_score": 0.8,
      "rating_score": 0.7,
      "vibe_score": 0.3,
      "speed_score": 0.9
    }
  ]
}
```

---

## POST /api/stores/score

サーバー側でスコアを計算して返す（検証用・将来拡張用）。

**Request:**
```json
{
  "store_ids": ["store_001", "store_002"],
  "weights": {
    "price": 90,
    "access": 70,
    "rating": 30,
    "vibe": 10,
    "speed": 50
  }
}
```

**Response 200:**
```json
{
  "scores": [
    { "store_id": "store_001", "normalized_score": 0.8240 },
    { "store_id": "store_002", "normalized_score": 0.4520 }
  ]
}
```
