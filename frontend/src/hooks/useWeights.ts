// ============================================
// useWeights.ts — 重み状態管理フック
// 【B専任】このファイルは B のみが編集する
// ============================================

import { useState, useCallback } from "react";
import type { Weights } from "../types";
import { DEFAULT_WEIGHTS } from "../types";

export function useWeights() {
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);

  /** 個別のスライダー変更 */
  const updateWeight = useCallback((key: keyof Weights, value: number) => {
    setWeights((prev) => ({ ...prev, [key]: value }));
  }, []);

  /** プリセットで一括設定 */
  const applyPreset = useCallback((preset: Weights) => {
    setWeights(preset);
  }, []);

  /** デフォルトにリセット */
  const resetWeights = useCallback(() => {
    setWeights(DEFAULT_WEIGHTS);
  }, []);

  return { weights, updateWeight, applyPreset, resetWeights };
}
