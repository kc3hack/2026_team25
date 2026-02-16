// ============================================
// StoreCard.tsx — 店舗情報カード（ピン選択時に表示）
// 【B専任】このファイルは B のみが編集する
// ============================================

import type { StoreWithScore } from "../../types";
import { WEIGHT_LABELS } from "../../types";

interface StoreCardProps {
  store: StoreWithScore | null;
  onClose?: () => void;
}

const SCORE_KEYS = [
  "price_score",
  "access_score",
  "rating_score",
  "vibe_score",
  "speed_score",
] as const;

const SCORE_TO_LABEL: Record<(typeof SCORE_KEYS)[number], keyof typeof WEIGHT_LABELS> = {
  price_score: "price",
  access_score: "access",
  rating_score: "rating",
  vibe_score: "vibe",
  speed_score: "speed",
};

export default function StoreCard({ store, onClose }: StoreCardProps) {
  if (!store) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold">{store.name}</h3>
          <p className="text-sm text-gray-500">{store.genre}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            x
          </button>
        )}
      </div>

      <div className="mt-2 text-sm">
        <span className="font-medium">総合スコア: </span>
        <span style={{ color: store.pinColor }} className="text-lg font-bold">
          {(store.normalizedScore * 100).toFixed(0)}pt
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        {SCORE_KEYS.map((key) => {
          const value = store[key];
          return (
            <div key={key} className="flex items-center gap-2 text-xs">
              <span className="w-16 shrink-0 text-gray-500">
                {WEIGHT_LABELS[SCORE_TO_LABEL[key]]}
              </span>
              <div className="h-1.5 flex-1 rounded-full bg-gray-200">
                <div
                  className="h-1.5 rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${value * 100}%` }}
                />
              </div>
              <span className="w-7 shrink-0 text-right text-gray-400">
                {(value * 100).toFixed(0)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
