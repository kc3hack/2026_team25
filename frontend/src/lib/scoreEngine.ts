// ============================================
// scoreEngine.ts — フロント側スコア計算
// 【B専任】このファイルは B のみが編集する
// バックエンド (scoring.py) と完全に同一のロジック
// ============================================

import type { Store, Weights, StoreWithScore } from "../types";
import { SCORE_THRESHOLD } from "../types";

/**
 * normalizedScore から色(hex)を補間する
 * 0.0=赤(#ef4444) → 0.5=黄(#eab308) → 1.0=緑(#22c55e)
 */
function interpolateColor(score: number): string {
  const clamp = Math.max(0, Math.min(1, score));

  let r: number, g: number, b: number;

  if (clamp < 0.5) {
    // 赤 → 黄
    const t = clamp / 0.5;
    r = Math.round(239 + (234 - 239) * t);
    g = Math.round(68 + (179 - 68) * t);
    b = Math.round(68 + (8 - 68) * t);
  } else {
    // 黄 → 緑
    const t = (clamp - 0.5) / 0.5;
    r = Math.round(234 + (34 - 234) * t);
    g = Math.round(179 + (197 - 179) * t);
    b = Math.round(8 + (94 - 8) * t);
  }

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * 店舗配列と重みからスコアを計算し、StoreWithScore[] を返す
 */
export function calculateScores(
  stores: Store[],
  weights: Weights
): StoreWithScore[] {
  const totalWeight =
    weights.price +
    weights.access +
    weights.rating +
    weights.vibe +
    weights.speed;

  return stores.map((store) => {
    const normalizedScore =
      totalWeight === 0
        ? 0
        : (store.price_score * weights.price +
            store.access_score * weights.access +
            store.rating_score * weights.rating +
            store.vibe_score * weights.vibe +
            store.speed_score * weights.speed) /
          totalWeight;

    return {
      ...store,
      normalizedScore,
      pinSize: 8 + 24 * normalizedScore,
      pinColor: interpolateColor(normalizedScore),
      visible: normalizedScore >= SCORE_THRESHOLD,
    };
  });
}
