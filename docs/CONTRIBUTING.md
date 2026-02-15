# 開発ルール（衝突最小化）

## 担当領域
- A: `frontend/src/components/map/**`
- B: `frontend/src/components/panel/**`, `frontend/src/lib/**`
- C: `backend-go/**`
- D: `data/**`, `infra/**`, `docs/**`, `.github/**`

## 固定ルール
- 共通ファイル（環境変数、依存管理、共通型）は D のみ編集
- 1タスク = 1ブランチ = 1担当領域
- 他領域の差分が出たら PR を分割
- 毎日午前に `main` 取り込み
- 毎日夕方に小PR提出
- 2/20夜以降は UI レイアウト改修禁止（バグ修正のみ）
