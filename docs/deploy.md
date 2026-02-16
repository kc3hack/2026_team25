# デプロイ手順（Vercel / Render）

このドキュメントはハッカソン MVP 用にフロントを Vercel、バックを Render にデプロイする際の最低限の手順と環境変数をまとめます。

前提
- フロントエンドは `frontend/`（Vite + React + TypeScript）
- バックエンドは `backend/`（FastAPI）
- リポジトリは GitHub にある（Vercel / Render は GitHub 連携でデプロイ）

## 1) フロント（Vercel）

- リポジトリを Vercel に接続（Import Project → GitHub）
- Framework Preset: Vite
- Build Command: `npm run build`（または `pnpm build` / `yarn build` に合わせる）
- Output Directory: `frontend/dist`

### Environment Variables (Vercel)
- `VITE_API_URL` = `https://<render-backend-url>`（開発は `http://localhost:8000`）

### 注意点（フロント）
- Vite の環境変数は `VITE_` プレフィックスが必要です。
- デバッグ中は Vercel の Environment を `Preview` と `Production` で分けて管理。

## 2) バックエンド（Render）

- Render に GitHub 連携でサービスを作成（Web Service）
- Runtime: Python 3.11 以上を指定

### 推奨設定
- Build Command: `pip install -r backend/requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Environment Variables (Render) — 必須
- `SUPABASE_URL` = `https://your-project.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = `<service-role-key>` （サーバー側でSupabase操作がある場合）
- `SUPABASE_ANON_KEY` = `<anon-key>`（フロント用に公開するキー、必要な場合）
- `VITE_API_URL` はフロント側で使うため、Render 側には不要だが外部から参照する場合は設定しておく

### CORS
- 本番では `backend` の CORS 設定を `https://<your-frontend-domain>` に限定してください。

## 3) データベース（Supabase）

- Supabase プロジェクトを作成しておく
- `backend/db/schema.sql` を Supabase SQL エディタで実行
- シードデータ: `backend/seeds/stores.json` を使う（`docs/seeding.md` を参照）

## 4) シークレット管理

- Render / Vercel のダッシュボードで環境変数を設定する（公開リポジトリではキーを直接コミットしない）
- チーム開発時は `.env.example` を参照してローカルに `.env` を作る

## 5) 手順（簡易まとめ）

1. Supabase: スキーマ適用 → seeds投入
2. Backend (Render): 環境変数を設定 → デプロイ
3. Frontend (Vercel): `VITE_API_URL` を Render の URL に設定 → デプロイ
4. 動作確認:
   - `GET <render-backend-url>/health` が 200 を返すこと
   - フロントで地図表示やスコア計算が期待通りに動くこと

## 6) トラブルシュート / よくある落とし穴

- 500 エラーが出る場合: Render のログを確認（依存のインストール漏れ、環境変数不足）
- CORS エラー: バックエンドの許可オリジンが正しいか確認
- Vite が API URL を読めない: `VITE_` プレフィックスか、Vercel の Environment が正しいかを確認

## 7) ローカルでの最終確認コマンド（macOS / zsh）

ローカルでバックエンドを起動してフロントをローカルビルドし、最短確認をするコマンド例:

```bash
# backend 仮想環境作成後
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# 別ターミナルで frontend
cd frontend
npm install
npm run dev
```

以上でデプロイ手順の概略は完了です。CI（GitHub Actions）で自動テストと lint を回す場合は、Render / Vercel に push したタイミングで `pytest` を実行するワークフローを追加することを推奨します。
