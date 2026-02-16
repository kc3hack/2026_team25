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
