// ============================================
// StoreCard.tsx — 店舗情報カード（ピン選択時に表示）
// 【B専任】このファイルは B のみが編集する
// ============================================

import type { StoreWithScore } from "../../types";

interface StoreCardProps {
  store: StoreWithScore | null;
}

export default function StoreCard({ store }: StoreCardProps) {
  if (!store) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
      <h3 className="text-lg font-bold">{store.name}</h3>
      <p className="text-sm text-gray-500">{store.genre}</p>
      <div className="mt-2 text-sm">
        <span className="font-medium">スコア: </span>
        <span style={{ color: store.pinColor }} className="font-bold">
          {(store.normalizedScore * 100).toFixed(0)}点
        </span>
      </div>
    </div>
  );
}
