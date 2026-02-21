# デプロイ手順（スマホアプリ化/PWA）

このプロジェクトは **Frontend: Vercel** / **Backend: Render** で最短公開できます。  
公開後、スマホのホーム画面に追加してアプリとして利用できます。

## 0. 追加済み設定ファイル

- Render Blueprint: [render.yaml](../render.yaml)
- Vercel 設定: [frontend/vercel.json](../frontend/vercel.json)
- Backend 環境変数例: [backend/.env.render.example](../backend/.env.render.example)
- Frontend 環境変数例: [frontend/.env.production.example](../frontend/.env.production.example)

## 1. Backend を Render にデプロイ

1. Render で `New +` → `Web Service`
2. GitHub リポジトリを接続
3. 設定
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. 環境変数（必要に応じて）
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `CORS_ORIGINS` = `https://<frontend-domain>`
     - 複数ある場合はカンマ区切り

デプロイ後、`https://<backend-domain>/health` が `{"status":"ok"}` を返すことを確認。

### Render 環境変数に入れる値（具体）

- `SUPABASE_URL`: Supabase プロジェクトの URL
- `SUPABASE_KEY`: Supabase のキー
- `CORS_ORIGINS`: `https://<your-frontend>.vercel.app`

## 2. Frontend を Vercel にデプロイ

1. Vercel で `New Project`
2. 設定
   - Root Directory: `frontend`
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. 環境変数
   - `VITE_API_URL` = `https://<backend-domain>`

### Vercel 環境変数に入れる値（具体）

- `VITE_API_URL`: `https://<your-backend>.onrender.com`

デプロイ後、アプリを開いて API が正常に動くか確認。

## 3. スマホでアプリとして使う（PWA）

### iPhone (Safari)
1. 公開URLを開く
2. 共有ボタン → `ホーム画面に追加`

### Android (Chrome)
1. 公開URLを開く
2. `アプリをインストール` または `ホーム画面に追加`

## 4. トラブル時チェック

- チャットがローカル回答になる
  - `VITE_API_URL` が未設定 or Backend 停止
- API が CORS エラー
  - Backend の `CORS_ORIGINS` に Frontend ドメインを追加
- インストールが出ない
  - HTTPS で公開されているか
  - `manifest.webmanifest` と `sw.js` が配信されているか

## 5. 最短デプロイ順（推奨）

1. Render で backend を先に公開
2. Backend URL を Vercel の `VITE_API_URL` に設定して frontend を公開
3. Frontend URL を Render の `CORS_ORIGINS` に設定して backend を再デプロイ
