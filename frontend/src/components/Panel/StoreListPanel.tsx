// ============================================
// StoreListPanel.tsx — 店舗リストパネル（デスクトップ中央列）
// 【B専任】このファイルは B のみが編集する
// ============================================

import { Users } from "lucide-react";
import type { StoreWithScore } from "../../types";
import StoreCard from "./StoreCard";

interface StoreListPanelProps {
  rankedStores: StoreWithScore[];
  filteredCount: number;
  selectedGenre: string | null;
  onGenreSelect: (genre: string | null) => void;
  selectedStore: StoreWithScore | null;
  onStoreSelect: (store: StoreWithScore) => void;
  onStoreClose: () => void;
  loading: boolean;
}

const GENRE_CHIPS: { genre: string; color: string }[] = [
  { genre: "ラーメン", color: "bg-red-500/15 text-red-400" },
  { genre: "カフェ", color: "bg-teal-500/15 text-teal-400" },
  { genre: "和食", color: "bg-emerald-500/15 text-emerald-400" },
  { genre: "中華", color: "bg-orange-500/15 text-orange-400" },
  { genre: "イタリアン", color: "bg-green-500/15 text-green-400" },
  { genre: "カレー", color: "bg-amber-500/15 text-amber-400" },
  { genre: "寿司", color: "bg-sky-500/15 text-sky-400" },
  { genre: "焼肉", color: "bg-rose-500/15 text-rose-400" },
  { genre: "居酒屋", color: "bg-purple-500/15 text-purple-400" },
  { genre: "飲食店", color: "bg-slate-500/15 text-slate-400" },
];

export default function StoreListPanel({
  rankedStores,
  filteredCount,
  selectedGenre,
  onGenreSelect,
  selectedStore,
  onStoreSelect,
  onStoreClose,
  loading,
}: StoreListPanelProps) {
  return (
    <div className="flex h-full flex-col">
      {/* ヘッダー */}
      <div className="shrink-0 border-b border-border-subtle px-5 pb-3 pt-5">
        <h1 className="text-xl font-bold text-text-primary">店舗</h1>
        <p className="mt-0.5 text-xs text-text-muted">
          {rankedStores.length} / {filteredCount} 店舗を表示中
        </p>
      </div>

      {/* ジャンルフィルターチップ */}
      <div className="flex shrink-0 flex-wrap gap-1.5 border-b border-border-subtle px-5 py-3">
        {GENRE_CHIPS.map(({ genre, color }) => {
          const isActive = selectedGenre === genre;
          return (
            <button
              key={genre}
              type="button"
              onClick={() => onGenreSelect(isActive ? null : genre)}
              className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 ${
                isActive
                  ? "bg-lime-accent text-dark-base shadow-sm font-semibold"
                  : `${color} hover:shadow-sm`
              }`}
            >
              {genre}
            </button>
          );
        })}
      </div>

      {/* 店舗リスト */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-text-muted">
            読み込み中...
          </div>
        ) : rankedStores.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-text-muted">
            <Users size={32} />
            <p className="text-sm">該当する店舗がありません</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {rankedStores.map((store, i) => {
              const isSelected = selectedStore?.id === store.id;
              return (
                <button
                  key={store.id}
                  type="button"
                  onClick={() => onStoreSelect(store)}
                  className={`flex cursor-pointer items-start gap-3 border-b border-border-subtle px-5 py-3 text-left transition-colors duration-150 hover:bg-dark-elevated/50 ${
                    isSelected ? "bg-dark-elevated" : ""
                  }`}
                >
                  {/* ランク番号 */}
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-dark-elevated font-mono-score text-[10px] font-bold text-text-muted">
                    {i + 1}
                  </span>

                  {/* ピンカラー */}
                  <span
                    className="mt-1.5 h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: store.pinColor }}
                  />

                  {/* 店舗情報 */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text-primary">
                      {store.name}
                    </p>
                    <p className="mt-0.5 text-xs text-text-secondary">
                      {store.genre}
                    </p>
                    {/* スコアタグ */}
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {store.price_score > 0.7 && (
                        <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                          コスパ◎
                        </span>
                      )}
                      {store.vibe_score > 0.7 && (
                        <span className="rounded-full bg-pink-500/15 px-2 py-0.5 text-[10px] font-medium text-pink-400">
                          雰囲気◎
                        </span>
                      )}
                      {store.speed_score > 0.7 && (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                          提供早い
                        </span>
                      )}
                      {store.access_score > 0.7 && (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                          駅近
                        </span>
                      )}
                    </div>
                  </div>

                  {/* スコア */}
                  <span
                    className="mt-0.5 shrink-0 font-mono-score text-sm font-bold"
                    style={{ color: store.pinColor }}
                  >
                    {(store.normalizedScore * 100).toFixed(0)}pt
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 選択中の店舗カード */}
      {selectedStore && (
        <div className="shrink-0 border-t border-border-subtle p-4">
          <StoreCard store={selectedStore} onClose={onStoreClose} />
        </div>
      )}
    </div>
  );
}
