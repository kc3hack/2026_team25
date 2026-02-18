// ============================================
// StoreCard.tsx — 店舗情報カード（ピン選択時に表示）
// 【B専任】このファイルは B のみが編集する
// ============================================

import { X } from "lucide-react";
import type { StoreWithScore } from "../../types";
import { WEIGHT_LABELS } from "../../types";
import RadarChart from "./RadarChart";

interface StoreCardProps {
  store: StoreWithScore;
  onClose: () => void;
}

const SCORE_KEYS = [
  "price_score",
  "access_score",
  "rating_score",
  "vibe_score",
  "speed_score",
] as const;

const LABEL_KEYS: (keyof typeof WEIGHT_LABELS)[] = [
  "price",
  "access",
  "rating",
  "vibe",
  "speed",
];

export default function StoreCard({ store, onClose }: StoreCardProps) {
  const radarScores = SCORE_KEYS.map((key, i) => ({
    label: WEIGHT_LABELS[LABEL_KEYS[i]],
    value: store[key],
  }));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-bold">{store.name}</h3>
          <p className="text-xs text-gray-500">{store.genre}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-full p-1 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-600"
          aria-label="閉じる"
        >
          <X size={18} />
        </button>
      </div>

      <RadarChart scores={radarScores} size={160} />

      <div className="mt-1 text-center text-sm">
        <span className="text-gray-500">総合スコア: </span>
        <span style={{ color: store.pinColor }} className="text-lg font-bold">
          {(store.normalizedScore * 100).toFixed(0)}
        </span>
        <span className="text-gray-500">点</span>
      </div>
    </div>
  );
}
