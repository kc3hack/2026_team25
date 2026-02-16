# Wagamama Gourmet — 統合設計ドキュメント

> **最終更新**: 2026/02/16
> 3つのAI案（Go+AWS構成、FastAPI+Supabase構成、Next.js構成）を統合し、
> ハッカソン優勝（デモ映え）と開発効率（コンフリクト回避）を両立する最適構成を策定。

---

## 目次

1. [アプリ概要・コンセプト](#1-アプリ概要コンセプト)
2. [用途・ユースケース](#2-用途ユースケース)
3. [確定スタック・選定理由](#3-確定スタック選定理由)
4. [アーキテクチャ・データフロー](#4-アーキテクチャデータフロー)
5. [データモデル・スコア仕様](#5-データモデルスコア仕様)
6. [API仕様](#6-api仕様)
7. [ディレクトリ構成・担当割当](#7-ディレクトリ構成担当割当)
8. [4人タスク分解表（フェーズ別）](#8-4人タスク分解表フェーズ別)
9. [コンフリクト回避ルール](#9-コンフリクト回避ルール)
10. [今後の展望（高難易度タスク）](#10-今後の展望高難易度タスク)
11. [AI実装用マスタープロンプト](#11-ai実装用マスタープロンプト)
12. [4人個別AIプロンプト](#12-4人個別aiプロンプト)

---

## 1. アプリ概要・コンセプト

### プロダクト名

**Wagamama Gourmet**（わがままグルメ）

### コンセプト

「今の自分のわがまま」に合わせて、地図上の飲食店が瞬時に姿を変える。

従来のグルメ検索は「条件を入力 → 結果リスト表示」の静的体験。
Wagamama Gourmetは、スライダーを動かすだけで地図上のピンがリアルタイムに
サイズ・色・表示/非表示を変える **「Liquid Map」** 体験を提供する。

### ターゲットユーザー

- 学生（金欠だけど美味しいものが食べたい）
- カップル（雰囲気重視でサクッと探したい）
- ビジネスパーソン（時間がない中でパッと決めたい）

### コア体験

1. **スライダーを動かす** → 地図上のピンが瞬時に変化（サーバー通信なし）
2. **プリセットボタン** → 「金欠モード」「デートモード」「急ぎモード」で一発切替
3. **視覚的インパクト** → ピンが大きく緑色 = 今のあなたにベスト、小さく赤色 = 合わない

---

## 2. 用途・ユースケース

| シーン | 操作 | 地図の変化 |
|--------|------|-----------|
| 金欠の学生 | 「価格」スライダーを最大に | 安い店のピンが大きく緑に、高い店は消える |
| デート前 | 「デートモード」プリセット押下 | 雰囲気と評価が高い店が浮かび上がる |
| 昼休みに急いでる | 「急ぎモード」プリセット押下 | 提供が速くアクセスが良い店が強調 |
| こだわり派 | 各スライダーを手動で微調整 | 自分だけの条件で店が最適化される |

### デモシナリオ（3分プレゼン用）

1. **導入（30秒）**: 「飲食店選び、条件が多すぎて面倒じゃないですか？」
2. **金欠モード（45秒）**: スライダー操作 → 安くて近い店が浮かぶ → 「学生にピッタリ」
3. **デートモード切替（45秒）**: ボタン一発 → 地図が劇的に変化 → 「同じ街でも見え方が変わる」
4. **技術説明（30秒）**: 構成図を見せる → 「フロント完結の即応体験 + サーバー検証」
5. **将来展望（30秒）**: LLM連携・全国対応・リアルタイム口コミ分析

---

## 3. 確定スタック・選定理由

| レイヤー | 技術 | 選定理由 |
|---------|------|---------|
| **Frontend** | React (Vite) + TypeScript + Tailwind CSS + MapLibre GL JS | SSR不要の地図SPA。Viteの方がHMR高速・設定シンプル。Next.jsのApp Routerの複雑さは不要 |
| **Backend** | FastAPI (Python 3.11+) | スコア計算・将来のLLM連携が書きやすい。Go比で開発速度2-3倍。型ヒントでドキュメント自動生成 |
| **Database** | Supabase (PostgreSQL) | DynamoDBよりセットアップ10倍速い。管理画面でデータ投入が楽。PostGISで将来の地理クエリも対応可 |
| **Deploy** | Vercel (Front) + Render (Backend) | AWS構築時間を演出実装に回す。審査にはAWS構成図を「本番想定アーキテクチャ」として提示 |

### 不採用技術と理由

| 技術 | 不採用理由 |
|------|-----------|
| Next.js (App Router) | SSR不要。App Routerの学習コストがハッカソンに見合わない |
| Go (Lambda) | 16h制約で型定義の厳密さがオーバーヘッド。計算ロジックの記述量が多い |
| AWS (Lambda + DynamoDB + API Gateway) | コールドスタート・CORS・IAM設定でハマる時間がデモ品質に直結しない |
| Supabase Auth | ユーザー認証はデモで見せる必要なし。`user_id=1`固定で十分 |

---

## 4. アーキテクチャ・データフロー

### システム構成図

```
┌─────────────────────────────────────────────────────┐
│                      Frontend (Vercel)               │
│  React (Vite) + TypeScript + Tailwind + MapLibre     │
│                                                       │
│  ┌─────────┐   ┌──────────────┐   ┌──────────────┐  │
│  │  Panel   │──▶│ scoreEngine  │──▶│   MapView    │  │
│  │ Sliders  │   │ (フロント    │   │ (ピン描画    │  │
│  │ Presets  │   │  再計算)     │   │  アニメ)     │  │
│  └─────────┘   └──────────────┘   └──────────────┘  │
│       │                                               │
│       │ 初回のみ                                      │
│       ▼                                               │
│  ┌─────────┐                                         │
│  │ api.ts  │─── GET /api/stores ──────────┐          │
│  └─────────┘                               │          │
└────────────────────────────────────────────│──────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────┐
│                     Backend (Render)                  │
│  FastAPI (Python 3.11+)                              │
│                                                       │
│  ┌─────────────┐   ┌──────────────┐                 │
│  │ stores.py   │──▶│ scoring.py   │                 │
│  │ (router)    │   │ (検証用計算) │                 │
│  └─────────────┘   └──────────────┘                 │
│       │                                               │
│       ▼                                               │
│  ┌──────────────┐                                    │
│  │ connection.py│── Supabase Client ──┐              │
│  └──────────────┘                      │              │
└────────────────────────────────────────│──────────────┘
                                          │
                                          ▼
                              ┌──────────────────┐
                              │   Supabase        │
                              │   (PostgreSQL)    │
                              │   stores table    │
                              └──────────────────┘
```

### データフロー詳細

1. **初回ロード**: ブラウザ → `GET /api/stores` → FastAPI → Supabase → 全店舗データ返却
2. **スライダー操作**: フロントの `scoreEngine.ts` で即座に再計算 → MapViewのPropsが更新 → ピン再描画
3. **プリセット**: ボタン押下 → スライダー値を一括設定 → 上記2と同じフロー
4. **サーバー側計算**: 同一スコア式をPythonでも保持（検証・将来のAPI拡張用）

---

## 5. データモデル・スコア仕様

### 店舗データ (Store)

```typescript
// frontend/src/types/index.ts

interface Store {
  id: string;
  name: string;
  lat: number;
  lng: number;
  genre: string;
  price_score: number;    // 0.0-1.0 価格のお手頃さ（1.0 = 激安）
  access_score: number;   // 0.0-1.0 アクセスの良さ（1.0 = 駅直結レベル）
  rating_score: number;   // 0.0-1.0 口コミ評価（1.0 = 最高評価）
  vibe_score: number;     // 0.0-1.0 雰囲気（1.0 = デート最適）
  speed_score: number;    // 0.0-1.0 提供速度（1.0 = 爆速）
}
```

### 重み (Weights) — スライダーで操作

```typescript
interface Weights {
  price: number;   // 0-100
  access: number;  // 0-100
  rating: number;  // 0-100
  vibe: number;    // 0-100
  speed: number;   // 0-100
}
```

### スコア付き店舗 (StoreWithScore) — 計算後

```typescript
interface StoreWithScore extends Store {
  normalizedScore: number;  // 0.0-1.0
  pinSize: number;          // 8-32 (px)
  pinColor: string;         // 例: "#ef4444"(赤) ~ "#22c55e"(緑)
  visible: boolean;         // 閾値以上ならtrue
}
```

### スコア計算式（フロント・バック完全共通）

```
totalWeight = weights.price + weights.access + weights.rating + weights.vibe + weights.speed

if totalWeight == 0:
  normalizedScore = 0
else:
  normalizedScore = (
    store.price_score  × weights.price  +
    store.access_score × weights.access +
    store.rating_score × weights.rating +
    store.vibe_score   × weights.vibe   +
    store.speed_score  × weights.speed
  ) / totalWeight

pinSize  = 8 + 24 × normalizedScore           // 8px（最小）〜 32px（最大）
pinColor = interpolate(normalizedScore)         // 0.0=赤, 0.5=黄, 1.0=緑
visible  = normalizedScore >= 0.3              // 閾値未満は非表示
```

### 色の補間ルール

| normalizedScore | 色     | Hex       |
|-----------------|--------|-----------|
| 0.0             | 赤     | `#ef4444` |
| 0.25            | オレンジ | `#f97316` |
| 0.5             | 黄     | `#eab308` |
| 0.75            | 黄緑   | `#84cc16` |
| 1.0             | 緑     | `#22c55e` |

### プリセット定義

| プリセット | price | access | rating | vibe | speed | 想定シーン |
|-----------|-------|--------|--------|------|-------|-----------|
| 金欠モード | 90 | 70 | 30 | 10 | 50 | 給料日前の学生 |
| デートモード | 20 | 40 | 60 | 95 | 30 | 恋人との食事 |
| 急ぎモード | 30 | 80 | 20 | 10 | 95 | 昼休み残り15分 |

---

## 6. API仕様

### `GET /api/stores`

全店舗データを返却する。

**レスポンス (200)**:
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

### `GET /health`

ヘルスチェック用。

**レスポンス (200)**:
```json
{"status": "ok"}
```

### `POST /api/stores/score` （検証用・将来拡張用）

サーバー側でスコアを計算して返す。フロントの計算結果と比較検証に使用。

**リクエスト**:
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

**レスポンス (200)**:
```json
{
  "scores": [
    { "store_id": "store_001", "normalized_score": 0.82 },
    { "store_id": "store_002", "normalized_score": 0.45 }
  ]
}
```

---

## 7. ディレクトリ構成・担当割当

```
wagamama-gourmet/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map/                    ← 【A専任】
│   │   │   │   ├── MapView.tsx            地図本体
│   │   │   │   ├── MapMarker.tsx          ピン描画・アニメ
│   │   │   │   └── index.ts              re-export
│   │   │   └── Panel/                  ← 【B専任】
│   │   │       ├── SliderGroup.tsx        スライダー群
│   │   │       ├── PresetButtons.tsx      プリセットボタン
│   │   │       ├── StoreCard.tsx          店舗情報カード
│   │   │       └── index.ts              re-export
│   │   ├── hooks/                      ← 【B専任】
│   │   │   └── useWeights.ts             重みの状態管理
│   │   ├── lib/                        ← 【B専任】
│   │   │   ├── scoreEngine.ts            フロント側スコア計算
│   │   │   └── api.ts                    APIクライアント
│   │   ├── types/                      ← 【D専任】(A/B/C参照のみ)
│   │   │   └── index.ts                  共通型定義(TS)
│   │   ├── styles/                     ← 【A専任】
│   │   │   └── map.css                   地図カスタムCSS・アニメ
│   │   ├── App.tsx                     ← 【B専任】(レイアウト結合)
│   │   └── main.tsx                    ← 【D初期作成】(以後変更なし)
│   ├── index.html                      ← 【D管理】
│   ├── package.json                    ← 【D管理】
│   ├── tailwind.config.ts              ← 【D初期作成】
│   ├── tsconfig.json                   ← 【D初期作成】
│   └── vite.config.ts                  ← 【D初期作成】
├── backend/
│   ├── app/
│   │   ├── routers/                    ← 【C専任】
│   │   │   └── stores.py                /api/stores エンドポイント
│   │   ├── services/                   ← 【C専任】
│   │   │   └── scoring.py               Python版スコア計算
│   │   ├── models/                     ← 【D作成 → C参照のみ】
│   │   │   └── schemas.py               Pydanticスキーマ
│   │   └── main.py                     ← 【C専任】
│   ├── db/                             ← 【D専任】
│   │   ├── connection.py                 Supabase接続
│   │   └── schema.sql                    テーブル定義SQL
│   ├── seeds/                          ← 【D専任】
│   │   └── stores.json                   デモ用店舗データ
│   ├── tests/                          ← 【C専任】
│   │   └── test_scoring.py
│   └── requirements.txt                ← 【D管理】
├── docs/                               ← 【D専任】
│   ├── architecture.md                   AWS本番構成図(審査用)
│   └── api-contract.md                   API仕様書
├── .env.example                        ← 【D管理】
├── .gitignore                          ← 【D管理】
├── detail.md                           ← 本ドキュメント
└── README.md                           ← 【D管理】
```

### 担当サマリー

| メンバー | 役割名 | 担当ファイル | 責任の一言 |
|---------|--------|-------------|-----------|
| **A** | Map Visualizer | `components/Map/`, `styles/` | 「見た目の気持ちよさ」を作る |
| **B** | UI Controller | `components/Panel/`, `hooks/`, `lib/`, `App.tsx` | 「アプリの動き」を作る |
| **C** | Backend Logic | `app/routers/`, `app/services/`, `app/main.py`, `tests/` | 「ロジックの正しさ」を担保する |
| **D** | Infra & Data | `types/`, `models/`, `db/`, `seeds/`, `docs/`, 設定ファイル全般 | 「土台の安定」を支える |

---

## 8. 4人タスク分解表（フェーズ別）

### Phase 0: 環境構築（0〜1h）

| A: Map Visualizer | B: UI Controller | C: Backend Logic | D: Infra & Data |
|-------------------|-------------------|-------------------|-------------------|
| MapLibre GL JS ドキュメント読み込み。地図アプリの実装例を調査 | React スライダーライブラリ調査（rc-slider等）。状態管理パターン検討 | FastAPI + Supabaseクライアント調査。Python版スコア計算の設計 | **リポジトリ初期セットアップ**: `npm create vite@latest`、Tailwind/MapLibre導入、共通型定義 `types/index.ts` 作成、`schemas.py` 作成、`.env.example` 作成、`.gitignore` 作成 |

### Phase 1: 基盤構築（1〜3h）

| A: Map Visualizer | B: UI Controller | C: Backend Logic | D: Infra & Data |
|-------------------|-------------------|-------------------|-------------------|
| `MapView.tsx` 作成。KRP（京都リサーチパーク）中心の地図を表示。タイルレイヤー設定、ベースのズームレベル設定 | `SliderGroup.tsx` 作成。5本のスライダーUI。`useWeights.ts` 作成。重みの状態管理フック | `main.py` 作成。FastAPIアプリ初期化。CORS設定。`/health` エンドポイント実装 | Supabaseプロジェクト作成。`schema.sql` でテーブル定義実行。`connection.py` でSupabase接続実装。`api-contract.md` 作成 |

### Phase 2: コア実装（3〜8h）

| A: Map Visualizer | B: UI Controller | C: Backend Logic | D: Infra & Data |
|-------------------|-------------------|-------------------|-------------------|
| `MapMarker.tsx` 作成。propsの店舗配列をピンとして地図上に描画。ダミーデータで5個のピン表示を確認 | `api.ts` 作成。GET /api/stores の呼び出し。`App.tsx` でMap + Panel を結合。取得データをMapコンポーネントにpropsで渡す | `stores.py` (router) 実装。GET /api/stores エンドポイント。Supabaseから店舗データ取得。Pydanticでバリデーション | `stores.json` 作成。デモ用ネタ店舗 5〜10件のデータ作成。Supabase管理画面またはSQLでデータ投入 |

### Phase 3: 連携・演出（8〜12h）

| A: Map Visualizer | B: UI Controller | C: Backend Logic | D: Infra & Data |
|-------------------|-------------------|-------------------|-------------------|
| **Liquid Map実装**: normalizedScoreに応じたピンサイズ/色変化。CSSトランジションで滑らかなアニメ。`map.css` にキーフレーム・トランジション定義 | `scoreEngine.ts` 作成。フロント側スコア計算ロジック。スライダー変更 → 即再計算 → State更新。`PresetButtons.tsx` 作成。金欠/デート/急ぎプリセット | `scoring.py` 実装。Python版スコア計算。`test_scoring.py` 作成。フロント(TS)と結果が完全一致するかテスト | Frontend → Vercel デプロイ。Backend → Render デプロイ。環境変数設定。CORS調整。本番動作確認 |

### Phase 4: 仕上げ（12〜16h）

| A: Map Visualizer | B: UI Controller | C: Backend Logic | D: Infra & Data |
|-------------------|-------------------|-------------------|-------------------|
| アニメーション微調整。ピン表示/非表示のフェードイン・フェードアウト。モバイル表示確認。デモ映えする演出の最終調整 | デモモード最終調整。金欠→デート切替のスムーズさ確認。`StoreCard.tsx` 作成（ピンクリック時の店舗情報表示） | レスポンス最適化。不要フィールド除去。エラーハンドリング強化。POST /api/stores/score の実装 | 通しリハーサル実施。AWS構成図作成 (`docs/architecture.md`)。README.md 完成。デモシナリオ確定。最終デプロイ |

---

## 9. コンフリクト回避ルール

### 鉄則

1. **Dが全ての「契約ファイル」の唯一の編集者**
   - `frontend/src/types/index.ts`（TS型定義）
   - `backend/app/models/schemas.py`（Pydanticスキーマ）
   - `docs/api-contract.md`（API仕様書）
   - A/B/C はこれらを import / 参照するだけ。変更が必要なら D に依頼する

2. **担当ディレクトリは完全排他**
   - 同じファイルを2人が編集することはゼロ
   - 担当外のファイルを変更したい場合は、担当者に依頼する

3. **結合ポイント**
   - A と B の結合: B が `App.tsx` で Map コンポーネントに props を渡す。A は props の型だけ合わせれば良い
   - B と C の結合: B が `api.ts` で C の API を呼ぶ。D の `api-contract.md` が契約
   - C と D の結合: C が `schemas.py` と `connection.py` を import する

4. **ブランチ戦略**
   - `main` ← `feature/A-map` / `feature/B-panel` / `feature/C-backend` / `feature/D-infra`
   - 各メンバーは自分のブランチでのみ作業
   - マージは D が統括（Phase毎にまとめてマージ推奨）

---

## 10. 今後の展望（高難易度タスク）

以下はMVPでは実装せず、デモ・プレゼンで「将来構想」として言及する。

| 難易度 | タスク | 技術的課題 | 対応方針 |
|--------|--------|-----------|---------|
| ★★★★★ | LLMリアルタイム店舗解析 | API応答5〜10秒。デモの即応体験を破壊する | 事前にAIで生成したJSONデータを使用 |
| ★★★★☆ | AWS Lambda + DynamoDB 完全構築 | コールドスタート・CORS・IAM設定で大幅な時間消費 | 構成図のみ作成し「本番想定」として提示 |
| ★★★★☆ | 口コミ自動収集→感情分析パイプライン | スクレイピング + LLM + データパイプライン構築 | 将来ロードマップとして言及 |
| ★★★☆☆ | 地図上「ぷるん」アニメを60FPS維持 | MapLibreカスタムレイヤー + requestAnimationFrame最適化 | CSSトランジションで簡易版を実装 |
| ★★★☆☆ | 時間帯と営業実態のリアルタイム同期 | 外部API連携 + キャッシュ戦略 | デモデータは全店舗「営業中」固定 |
| ★★☆☆☆ | ユーザー認証・お気に入り機能 | 認証フロー・DB設計の追加 | `user_id=1` 固定で対応 |
| ★★☆☆☆ | 全国対応・ピンクラスタリング | 大量ピンの描画負荷・クラスタリングアルゴリズム | KRP周辺5〜10店舗に限定 |

---

## 11. AI実装用マスタープロンプト

各メンバーがAI（Cursor / Copilot / ChatGPT 等）に送る共通プロンプト。
**個別プロンプト（セクション12）の冒頭に、このマスタープロンプトを貼り付けてから使用する。**

````markdown
# Wagamama Gourmet — AI実装コンテキスト

あなたはハッカソンプロジェクト「Wagamama Gourmet」の実装担当AIです。
以下の仕様と【あなたの担当役割】を厳守してください。

---

## 1. プロジェクト概要
- **名前**: Wagamama Gourmet（わがままグルメ）
- **目的**: ユーザーの状況（金欠・デート・急ぎ etc.）に応じて、地図上の店舗評価を
  リアルタイムに再計算し、ピンの色・サイズ・表示/非表示を瞬時に更新する。
- **コア体験**: スライダーを動かした瞬間にサーバー通信なしでピンが変化する「Liquid Map」。
- **デモシナリオ**: 「金欠モード」→「デートモード」の劇的な切替をスムーズに見せる。

## 2. 確定スタック
- **Frontend**: React (Vite) + TypeScript + Tailwind CSS + MapLibre GL JS
- **Backend**: FastAPI (Python 3.11+)
- **Database**: Supabase (PostgreSQL)
- **Deploy**: Vercel (Front) + Render (Backend)

## 3. アーキテクチャ
1. **初回ロード**: ブラウザ → `GET /api/stores` → FastAPI → Supabase → 全店舗データ返却
2. **スライダー操作**: フロントのみでスコア再計算＋地図更新（APIコールなし）
3. **プリセット**: 「金欠」「デート」「急ぎ」ボタンでスライダー値を一括設定→再計算
4. **サーバー側計算**: 同一スコア式をPythonでも持つ（検証・将来拡張用）

## 4. データモデル

### Store（店舗）
```typescript
interface Store {
  id: string;
  name: string;
  lat: number;
  lng: number;
  genre: string;
  price_score: number;    // 0.0-1.0 価格のお手頃さ
  access_score: number;   // 0.0-1.0 アクセスの良さ
  rating_score: number;   // 0.0-1.0 口コミ評価
  vibe_score: number;     // 0.0-1.0 雰囲気
  speed_score: number;    // 0.0-1.0 提供速度
}
```

### Weights（重み — スライダー値）
```typescript
interface Weights {
  price: number;   // 0-100
  access: number;  // 0-100
  rating: number;  // 0-100
  vibe: number;    // 0-100
  speed: number;   // 0-100
}
```

### StoreWithScore (計算後)
```typescript
interface StoreWithScore extends Store {
  normalizedScore: number;  // 0.0-1.0
  pinSize: number;          // 8-32 (px)
  pinColor: string;         // "#ef4444"(赤) ~ "#22c55e"(緑)
  visible: boolean;         // 閾値以上ならtrue
}
```

### プリセット値
| プリセット | price | access | rating | vibe | speed |
|-----------|-------|--------|--------|------|-------|
| 金欠モード | 90 | 70 | 30 | 10 | 50 |
| デートモード | 20 | 40 | 60 | 95 | 30 |
| 急ぎモード | 30 | 80 | 20 | 10 | 95 |

## 5. スコア計算式（フロント・バック完全共通）
```
totalWeight = price + access + rating + vibe + speed

if totalWeight == 0:
  normalizedScore = 0
else:
  normalizedScore = (
    store.price_score  × weights.price  +
    store.access_score × weights.access +
    store.rating_score × weights.rating +
    store.vibe_score   × weights.vibe   +
    store.speed_score  × weights.speed
  ) / totalWeight

pinSize  = 8 + 24 × normalizedScore            // 8px〜32px
pinColor = interpolate(normalizedScore)          // 0.0=赤, 0.5=黄, 1.0=緑
visible  = normalizedScore >= 0.3               // 閾値未満は非表示
```

## 6. API仕様

### GET /api/stores
- 全店舗データを配列で返す
- レスポンス: `{ "stores": Store[] }`

### GET /health
- レスポンス: `{ "status": "ok" }`

### POST /api/stores/score （検証用・将来拡張）
- リクエスト: `{ "store_ids": string[], "weights": Weights }`
- レスポンス: `{ "scores": [{ "store_id": string, "normalized_score": number }] }`

## 7. ディレクトリ構成と担当分離

```
frontend/src/
  components/Map/     ← A専任（地図描画・ピンアニメ）
  components/Panel/   ← B専任（スライダーUI・プリセット）
  hooks/              ← B専任（状態管理）
  lib/                ← B専任（スコア計算・APIクライアント）
  types/              ← D専任（型定義、他は参照のみ）
  styles/             ← A専任（地図CSS）
  App.tsx             ← B専任（レイアウト統合）

backend/app/
  routers/            ← C専任（APIエンドポイント）
  services/           ← C専任（Python版スコア計算）
  models/             ← D作成→C参照のみ（Pydanticスキーマ）
  main.py             ← C専任（FastAPIアプリ）

backend/db/           ← D専任（DB接続・スキーマ）
backend/seeds/        ← D専任（初期データ）
backend/tests/        ← C専任（テスト）
```

## 8. 禁止事項（全メンバー共通）
- MVP外の機能追加（認証、お気に入り、全国対応 etc.）
- スタックの変更
- 他メンバー担当ファイルの無断変更
- 共有型定義（`types/index.ts`, `schemas.py`）の無断変更

## 9. 出力フォーマット
実装時は必ず以下の形式で出力すること:
1. **実装対象**: 何を実装するか1行で
2. **編集ファイル**: 変更するファイルパスの一覧
3. **実装内容**: コード
4. **動作確認方法**: 確認手順
5. **残課題**: あれば記載

---
以上を理解しましたか？理解したら、具体的な指示を待ってください。
````

---

## 12. 4人個別AIプロンプト

各メンバーが自分の担当AIに送るプロンプト。
**使い方**: セクション11のマスタープロンプト → 以下の個別プロンプト の順に貼り付ける。

---

### 12-A. Member A: Map Visualizer（地図演出担当）用プロンプト

````markdown
## あなたの担当: Member A — Map Visualizer（地図演出担当）

### 担当ファイル（これだけを編集すること）
- `frontend/src/components/Map/MapView.tsx`
- `frontend/src/components/Map/MapMarker.tsx`
- `frontend/src/components/Map/index.ts`
- `frontend/src/styles/map.css`

### あなたの責務
あなたは「地図上の視覚体験」の全責任者です。
MapLibre GL JS を使い、店舗データをピンとして地図上に描画し、
スコアに応じてピンのサイズ・色・表示/非表示をリアルタイムに変化させます。

### 技術詳細
- **MapView.tsx**: MapLibre GL JSの初期化。中心座標は KRP（京都リサーチパーク）
  `{ lat: 34.9937, lng: 135.7467 }` ズームレベル: 15
- **MapMarker.tsx**: ピン1つ分の描画コンポーネント。
  受け取る props:
  ```typescript
  interface MarkerProps {
    store: StoreWithScore;  // types/index.ts からimport
  }
  ```
  - `store.pinSize` でピンのサイズを制御
  - `store.pinColor` でピンの色を制御
  - `store.visible` が false なら非表示
- **map.css**: ピンのCSSトランジションを定義
  - サイズ変化: `transition: width 0.3s ease, height 0.3s ease;`
  - 色変化: `transition: background-color 0.3s ease;`
  - 表示切替: `opacity` + `transition` でフェードイン/アウト

### MapViewが受け取るProps
```typescript
interface MapViewProps {
  stores: StoreWithScore[];  // B が計算して渡してくる
}
```
あなたはこの props を受け取って描画するだけ。
データの取得やスコア計算は一切しないこと。

### 実装の順序
1. **Phase 1**: MapView.tsx で KRP中心の地図を表示するだけ
2. **Phase 2**: MapMarker.tsx を作成。ダミーデータでピンを5個表示
3. **Phase 3**: normalizedScore に応じたサイズ/色変化のCSS実装
4. **Phase 4**: アニメーション微調整、フェードイン・フェードアウト

### 禁止事項
- `fetch` や API呼び出しのコードを書かないこと
- スライダーUIを実装しないこと
- `hooks/` や `lib/` のファイルを作成・変更しないこと
- `types/index.ts` を変更しないこと（importのみ）

### 品質基準
- スライダー操作後、ピンの変化が **0.3秒以内** に視認できること
- ピンの色が赤→黄→緑のグラデーションで正しく表現されること
- 非表示ピンがフェードアウトで消え、再表示時にフェードインすること
````

---

### 12-B. Member B: UI Controller（操作・ロジック担当）用プロンプト

````markdown
## あなたの担当: Member B — UI Controller（操作・ロジック担当）

### 担当ファイル（これだけを編集すること）
- `frontend/src/components/Panel/SliderGroup.tsx`
- `frontend/src/components/Panel/PresetButtons.tsx`
- `frontend/src/components/Panel/StoreCard.tsx`
- `frontend/src/components/Panel/index.ts`
- `frontend/src/hooks/useWeights.ts`
- `frontend/src/lib/scoreEngine.ts`
- `frontend/src/lib/api.ts`
- `frontend/src/App.tsx`

### あなたの責務
あなたは「アプリの動き・頭脳」の全責任者です。
ユーザー操作（スライダー・プリセット）を受け取り、スコアを再計算し、
Mapコンポーネントに計算結果を渡すまでの全フローを担当します。

### 技術詳細

#### useWeights.ts（状態管理フック）
```typescript
// Reactの useState でシンプルに管理
const [weights, setWeights] = useState<Weights>({
  price: 50, access: 50, rating: 50, vibe: 50, speed: 50
});
```

#### scoreEngine.ts（フロントスコア計算）
```typescript
function calculateScores(stores: Store[], weights: Weights): StoreWithScore[] {
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  return stores.map(store => {
    const normalizedScore = totalWeight === 0 ? 0 : (
      store.price_score  * weights.price +
      store.access_score * weights.access +
      store.rating_score * weights.rating +
      store.vibe_score   * weights.vibe +
      store.speed_score  * weights.speed
    ) / totalWeight;

    return {
      ...store,
      normalizedScore,
      pinSize: 8 + 24 * normalizedScore,
      pinColor: interpolateColor(normalizedScore),
      visible: normalizedScore >= 0.3,
    };
  });
}
```

#### api.ts（APIクライアント）
```typescript
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function fetchStores(): Promise<Store[]> {
  const res = await fetch(`${API_BASE}/api/stores`);
  const data = await res.json();
  return data.stores;
}
```

#### App.tsx（レイアウト統合）
```
App.tsx の責務:
1. useEffect で初回 fetchStores() を呼ぶ
2. useWeights で重みの状態を管理
3. スライダー変更時に calculateScores() を実行
4. 結果を <MapView stores={storesWithScore} /> に渡す
5. <SliderGroup> と <PresetButtons> を配置
```

#### PresetButtons.tsx
```typescript
const PRESETS: Record<string, Weights> = {
  金欠モード: { price: 90, access: 70, rating: 30, vibe: 10, speed: 50 },
  デートモード: { price: 20, access: 40, rating: 60, vibe: 95, speed: 30 },
  急ぎモード: { price: 30, access: 80, rating: 20, vibe: 10, speed: 95 },
};
```

### 実装の順序
1. **Phase 1**: SliderGroup.tsx + useWeights.ts で5本のスライダーUIを作成
2. **Phase 2**: api.ts 作成。App.tsx で Map + Panel を結合し、APIデータをMapに渡す
3. **Phase 3**: scoreEngine.ts 作成。スライダー変更→即再計算→Map更新の全フロー実現。PresetButtons.tsx 作成
4. **Phase 4**: StoreCard.tsx 作成（ピンクリック時の情報表示）。デモモード最終調整

### 禁止事項
- MapLibre GL JS を直接操作しないこと（データを渡すだけ）
- `components/Map/` 配下のファイルを変更しないこと
- `types/index.ts` を変更しないこと（importのみ）
- バックエンドのコードを変更しないこと

### 品質基準
- スライダー操作から地図更新まで **体感遅延ゼロ**（16ms以内の再計算）
- プリセット切替がボタン1つで完了すること
- API接続エラー時にユーザーに通知を表示すること
````

---

### 12-C. Member C: Backend Logic（バックエンド担当）用プロンプト

````markdown
## あなたの担当: Member C — Backend Logic（バックエンド担当）

### 担当ファイル（これだけを編集すること）
- `backend/app/main.py`
- `backend/app/routers/stores.py`
- `backend/app/services/scoring.py`
- `backend/tests/test_scoring.py`

### あなたの責務
あなたは「ロジックの正しさ」の全責任者です。
FastAPIで店舗データを提供するAPIと、フロントと完全一致するスコア計算ロジック（Python版）を実装します。

### 技術詳細

#### main.py
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import stores

app = FastAPI(title="Wagamama Gourmet API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番では制限する
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stores.router, prefix="/api")

@app.get("/health")
def health():
    return {"status": "ok"}
```

#### routers/stores.py
```python
from fastapi import APIRouter
from app.models.schemas import StoreResponse, ScoreRequest, ScoreResponse
# schemas.py は D が作成済み。import して使うだけ

router = APIRouter()

@router.get("/stores", response_model=StoreResponse)
async def get_stores():
    # db/connection.py の関数を使って Supabase からデータ取得
    # connection.py は D が作成済み。import して使うだけ
    pass

@router.post("/stores/score", response_model=ScoreResponse)
async def calculate_scores(request: ScoreRequest):
    # services/scoring.py の関数を使ってスコア計算
    pass
```

#### services/scoring.py
```python
def calculate_normalized_score(store: dict, weights: dict) -> float:
    """フロントの scoreEngine.ts と完全に同一のロジック"""
    total_weight = sum(weights.values())
    if total_weight == 0:
        return 0.0

    score = (
        store["price_score"]  * weights["price"] +
        store["access_score"] * weights["access"] +
        store["rating_score"] * weights["rating"] +
        store["vibe_score"]   * weights["vibe"] +
        store["speed_score"]  * weights["speed"]
    ) / total_weight

    return round(score, 4)
```

#### tests/test_scoring.py
```python
# フロント(TS)の計算結果と完全一致するかを検証するテスト
# テストケース例:
# - 全重みゼロ → スコア0
# - 金欠プリセット + 安い店 → 高スコア
# - デートプリセット + 安い店 → 低スコア
```

### 実装の順序
1. **Phase 1**: main.py 作成。FastAPI初期化・CORS設定・/health 実装
2. **Phase 2**: stores.py 実装。GET /api/stores で Supabase から全店舗取得
3. **Phase 3**: scoring.py 実装。Python版スコア計算。test_scoring.py でテスト
4. **Phase 4**: POST /api/stores/score 実装。レスポンス最適化。エラーハンドリング強化

### 利用するが編集しないファイル（D が作成・管理）
- `backend/app/models/schemas.py` — Pydanticスキーマ（import のみ）
- `backend/db/connection.py` — Supabase接続（import のみ）
- `backend/seeds/stores.json` — テストデータ参照

### 禁止事項
- フロントエンドのコードを変更しないこと
- `schemas.py` を変更しないこと（変更が必要なら D に依頼）
- `connection.py` を変更しないこと
- `db/` や `seeds/` 配下のファイルを変更しないこと

### 品質基準
- GET /api/stores のレスポンスタイムが **200ms以下**
- scoring.py の計算結果がフロント(TS)と **小数第4位まで一致**
- 全テストが `pytest` で PASS すること
````

---

### 12-D. Member D: Infra & Data（インフラ・データ担当）用プロンプト

````markdown
## あなたの担当: Member D — Infra & Data（インフラ・データ・統括担当）

### 担当ファイル（これだけを編集すること）

#### 共有契約ファイル（あなただけが編集権限を持つ最重要ファイル）
- `frontend/src/types/index.ts` — TypeScript共通型定義
- `backend/app/models/schemas.py` — Pydanticスキーマ定義

#### インフラ・DB
- `backend/db/connection.py` — Supabase接続設定
- `backend/db/schema.sql` — テーブル定義SQL

#### 初期データ
- `backend/seeds/stores.json` — デモ用店舗データ

#### 設定ファイル
- `frontend/index.html`
- `frontend/package.json`
- `frontend/tailwind.config.ts`
- `frontend/tsconfig.json`
- `frontend/vite.config.ts`
- `frontend/src/main.tsx`
- `backend/requirements.txt`
- `.env.example`
- `.gitignore`
- `README.md`

#### ドキュメント
- `docs/architecture.md` — AWS本番想定構成図
- `docs/api-contract.md` — API仕様書

### あなたの責務
あなたは「土台の安定」と「チーム全体の契約管理」の全責任者です。
他の3人（A/B/C）が安心して開発できるよう、型定義・スキーマ・DB・環境を整備します。

### 技術詳細

#### types/index.ts（TypeScript型定義）
```typescript
export interface Store {
  id: string;
  name: string;
  lat: number;
  lng: number;
  genre: string;
  price_score: number;
  access_score: number;
  rating_score: number;
  vibe_score: number;
  speed_score: number;
}

export interface Weights {
  price: number;
  access: number;
  rating: number;
  vibe: number;
  speed: number;
}

export interface StoreWithScore extends Store {
  normalizedScore: number;
  pinSize: number;
  pinColor: string;
  visible: boolean;
}

export const PRESETS: Record<string, Weights> = {
  "金欠モード": { price: 90, access: 70, rating: 30, vibe: 10, speed: 50 },
  "デートモード": { price: 20, access: 40, rating: 60, vibe: 95, speed: 30 },
  "急ぎモード": { price: 30, access: 80, rating: 20, vibe: 10, speed: 95 },
};
```

#### schemas.py（Pydanticスキーマ）
```python
from pydantic import BaseModel

class StoreSchema(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    genre: str
    price_score: float
    access_score: float
    rating_score: float
    vibe_score: float
    speed_score: float

class StoreResponse(BaseModel):
    stores: list[StoreSchema]

class WeightsSchema(BaseModel):
    price: int
    access: int
    rating: int
    vibe: int
    speed: int

class ScoreRequest(BaseModel):
    store_ids: list[str]
    weights: WeightsSchema

class ScoreItem(BaseModel):
    store_id: str
    normalized_score: float

class ScoreResponse(BaseModel):
    scores: list[ScoreItem]
```

#### connection.py
```python
import os
from supabase import create_client, Client

url = os.environ.get("SUPABASE_URL", "")
key = os.environ.get("SUPABASE_KEY", "")
supabase: Client = create_client(url, key)
```

#### schema.sql
```sql
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
```

#### stores.json（デモ用データ — KRP周辺の架空店舗）
```json
[
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
```
※ 合計5〜10件のネタ店舗を作成。金欠向き/デート向き/万能型など偏りを持たせる。

### 実装の順序
1. **Phase 0**: リポジトリ初期化。Viteプロジェクト作成。Tailwind/MapLibre導入。全設定ファイル作成
2. **Phase 1**: types/index.ts + schemas.py 作成配布。Supabaseプロジェクト作成。schema.sql 実行。connection.py 作成。api-contract.md 作成
3. **Phase 2**: stores.json 作成（5〜10件）。Supabaseにデータ投入
4. **Phase 3**: Vercel + Render デプロイ。環境変数設定。CORS調整
5. **Phase 4**: 通しリハーサル。architecture.md（AWS構成図）作成。README.md 完成

### 禁止事項
- ロジックの実装（スコア計算など）をしないこと
- UIの実装（コンポーネント作成など）をしないこと
- A/B/C の担当ファイルを変更しないこと

### 品質基準
- A/B/C 全員が Phase 1 開始前に、型定義・スキーマ・DB接続が利用可能な状態であること
- Supabase のテーブルにデモ用データが投入済みであること
- デプロイが完了し、本番URLでアプリが動作すること
- AWS構成図が審査員向けに説明可能な品質であること

### 契約変更ルール
A/B/C から「型を追加してほしい」「フィールドを変えてほしい」と依頼が来た場合:
1. 依頼内容を確認
2. types/index.ts と schemas.py を **同時に** 更新（片方だけ変えると型不一致が起きる）
3. 変更内容を全員に周知
````

---

## 補足: プロンプトの使い方

### ステップ1: マスタープロンプトを貼る
セクション11の内容をAIチャットに貼り付ける。

### ステップ2: 個別プロンプトを貼る
セクション12の自分の担当プロンプト（12-A/B/C/D）を続けて貼り付ける。

### ステップ3: 具体的な指示を出す
例:
- A: 「Phase 1 の MapView.tsx を実装してください」
- B: 「Phase 2 の api.ts と App.tsx を実装してください」
- C: 「Phase 2 の GET /api/stores エンドポイントを実装してください」
- D: 「Phase 0 のリポジトリ初期セットアップを実行してください」

### ステップ4: フェーズごとにマージ
D が各メンバーのブランチを main にマージする。
担当ファイルが完全に分離されているため、コンフリクトは発生しない。
