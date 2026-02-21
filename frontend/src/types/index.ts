// ============================================
// Wagamama Gourmet — 共通型定義
// 【D専任】このファイルは D のみが編集する
// A/B/C は import して参照のみ
// ============================================

/** 店舗データ（DBから取得する生データ） */
export interface Store {
  id: string;
  name: string;
  lat: number;
  lng: number;
  genre: string;
  price_score: number;    // 0.0-1.0 価格のお手頃さ（1.0 = 激安）
  access_score: number;   // 0.0-1.0 アクセスの良さ（1.0 = 駅直結レベル）
  walk_duration_sec?: number;
  walk_distance_m?: number;
  access_source?: string;
  access_updated_at?: string;
  rating_score: number;   // 0.0-1.0 口コミ評価（1.0 = 最高評価）
  vibe_score: number;     // 0.0-1.0 雰囲気（1.0 = デート最適）
  speed_score: number;    // 0.0-1.0 提供速度（1.0 = 爆速）
}

/** スライダーの重み値 */
export interface Weights {
  price: number;   // 0-100
  access: number;  // 0-100
  rating: number;  // 0-100
  vibe: number;    // 0-100
  speed: number;   // 0-100
}

/** スコア計算後の店舗データ */
export interface StoreWithScore extends Store {
  normalizedScore: number;  // 0.0-1.0
  pinSize: number;          // 8-32 (px)
  pinColor: string;         // "#ef4444"(赤) ~ "#22c55e"(緑)
  visible: boolean;         // 閾値以上ならtrue
}

/** プリセット定義 */
export const PRESETS: Record<string, Weights> = {
  "金欠モード": { price: 90, access: 70, rating: 30, vibe: 10, speed: 50 },
  "デートモード": { price: 20, access: 40, rating: 60, vibe: 95, speed: 30 },
  "急ぎモード": { price: 30, access: 80, rating: 20, vibe: 10, speed: 95 },
};

/** デフォルトの重み */
export const DEFAULT_WEIGHTS: Weights = {
  price: 50,
  access: 50,
  rating: 50,
  vibe: 50,
  speed: 50,
};

/** スコア表示閾値 */
export const SCORE_THRESHOLD = 0.3;

/** 重みのラベル定義（UI表示用） */
export const WEIGHT_LABELS: Record<keyof Weights, string> = {
  price: "価格",
  access: "アクセス",
  rating: "評価",
  vibe: "雰囲気",
  speed: "スピード",
};

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatContext {
  selectedGenre?: string | null;
  topStoreNames?: string[];
  weights?: Weights;
}

export interface ChatRequest {
  message: string;
  history: ChatMessage[];
  context?: ChatContext;
}

export interface ChatResponse {
  assistant_message: string;
  suggested_queries: string[];
  detected_mode: string | null;
}
