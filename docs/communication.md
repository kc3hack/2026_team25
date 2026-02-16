# 型・スキーマ変更フロー（D 向けテンプレ）

目的
- フロント (`frontend/src/types/index.ts`) とバック (`backend/app/models/schemas.py`) の契約（型／スキーマ）を変更する際、チーム混乱を避けるための手順と通知テンプレを提供します。

基本ルール（必須）
1. 型／スキーマの変更は D が責任を持って同時に行う。フロント／バックの不整合を防ぐため、必ず両方を同一 PR で変更する。
2. ブランチ命名規則: `D/<短い説明>` 例: `D/update-store-weight-labels`
3. PR タイトルテンプレ: `[D] types/schemas: <短い説明>` 例: `[D] types/schemas: add new weight 'comfort'`
4. PR 本文の最初に「目的」「影響範囲（どのファイル・どの案内に追記が必要か）」「互換性（breaking change か）」を書いておく。

マージ前チェックリスト（PR テンプレに含める）
- [ ] `frontend/src/types/index.ts` の更新を行った（diff を確認）
- [ ] `backend/app/models/schemas.py` の更新を行った（Pydantic バリデーション追加等）
- [ ] `docs/api-contract.md` を必要に応じて更新済み
- [ ] `docs/deploy.md` / `docs/seeding.md` の更新が必要なら追記済み
- [ ] 単純な互換性テストを実施（例: `pytest backend/tests/test_scoring.py` をローカルで実行）※今回は任意
- [ ] PR 説明と Slack 通知文（下記テンプレ）を用意

レビュールール
- レビュア: 少なくとも 1 人の別メンバー（A/B/C）にレビュー依頼すること
- 重要な後方互換性破壊（breaking change）がある場合は、事前に Slack で通知して合意を得ること
- D が最終確認してマージする（コンフリクトがないことを確認のこと）

Slack 通知テンプレ（PR 作成時にコピペして使う）

チャンネル: `#team-dev` または `#通知-開発`

メッセージ:

```
【D: 型/スキーマ更新のお知らせ】
PR: <PR URL>
概要: <短い説明>
影響範囲:
- frontend: `frontend/src/types/index.ts` を更新
- backend: `backend/app/models/schemas.py` を更新
互換性: <互換性あり / breaking change>
作業内容:
- 変更点の要約（最大3行）
お願い:
- A/B/C の各自、ローカルで最新ブランチを pull して動作確認をお願いします（簡単なチェック手順を下に記載）

簡易チェック手順：
1. backend を起動: `uvicorn app.main:app --reload`
2. frontend を起動: `npm run dev`
3. フロントで主要画面（地図・スコア）を触って問題がないか確認

問題が見つかった場合はこのスレッドで報告してください。
```

Pull Request のテンプレ（README または PR テンプレに追加推奨）
- Title: `[D] types/schemas: <短い要約>`
- Body:
  - 概要
  - 変更ファイル
  - 影響のある画面/API
  - 互換性（breaking change の有無）
  - ローカル確認手順（必要ならコマンド）

備考 / ベストプラクティス
- 可能であれば小さな変更ごとに分けず、関連する型変更はまとめて行う（PR が大きくなり過ぎない程度に）
- CI（GitHub Actions）で `pytest` を自動で回すワークフローを用意しておくと安心（Push/PR 時）
- 重大な変更（データベースのカラム変更など）は事前にリードタイムを通知し、マイグレーション手順を docs に明記すること

---

これでチーム周知テンプレの雛形は完了です。必要ならこのファイルを PR テンプレに追加して自動で読み込めるようにします（`.github/PULL_REQUEST_TEMPLATE.md` を追加するなど）。
