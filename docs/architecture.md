# Wagamama Gourmet — 本番想定アーキテクチャ (AWS)

> 【D専任】このファイルは D のみが編集する。
> MVP版は Vercel + Render + Supabase で構築。以下は本番スケール時の構成。

## AWS構成図

```
                    ┌──────────────┐
                    │  CloudFront  │
                    │  (CDN)       │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │    S3        │
                    │ (React SPA)  │
                    └──────────────┘
                           │
                    ┌──────▼───────┐
                    │ API Gateway  │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   Lambda     │
                    │ (Python/     │
                    │  FastAPI)    │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──┐  ┌──────▼──┐  ┌─────▼──────┐
       │DynamoDB │  │  SQS    │  │ CloudWatch │
       │(stores) │  │(future) │  │ (logs)     │
       └─────────┘  └─────────┘  └────────────┘
```

## 移行計画

| MVP (現在)          | 本番 (将来)           |
|--------------------|-----------------------|
| Vercel             | S3 + CloudFront       |
| Render (FastAPI)   | Lambda + API Gateway  |
| Supabase           | DynamoDB              |
| -                  | CloudWatch (監視)     |
| -                  | SQS (非同期処理)     |
