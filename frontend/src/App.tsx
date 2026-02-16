// ============================================
// App.tsx — レイアウト統合
// 【B専任】このファイルは B のみが編集する
// ============================================

import { useEffect, useState, useMemo } from "react";
import { MapView } from "./components/map";
import { SliderGroup, PresetButtons, StoreCard } from "./components/Panel";
import { useWeights } from "./hooks/useWeights";
import { calculateScores } from "./lib/scoreEngine";
import { fetchStores } from "./lib/api";
import type { Store, StoreWithScore } from "./types";

function App() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<StoreWithScore | null>(
    null
  );
  const { weights, updateWeight, applyPreset, resetWeights } = useWeights();

  // 初回: APIから店舗データ取得
  useEffect(() => {
    fetchStores()
      .then(setStores)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Unknown error")
      )
      .finally(() => setLoading(false));
  }, []);

  // スライダー変更ごとにフロントで再計算
  const storesWithScore = useMemo(
    () => calculateScores(stores, weights),
    [stores, weights]
  );

  // スコア順にソート（visible のみ）
  const rankedStores = useMemo(
    () =>
      [...storesWithScore]
        .filter((s) => s.visible)
        .sort((a, b) => b.normalizedScore - a.normalizedScore),
    [storesWithScore]
  );

  const visibleCount = rankedStores.length;
  const allZero = Object.values(weights).every((v) => v === 0);

  return (
    <div className="flex h-screen w-screen">
      {/* --- 左パネル --- */}
      <aside className="flex w-80 shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          <h1 className="text-xl font-bold text-emerald-600">
            Wagamama Gourmet
          </h1>
          <p className="text-xs text-gray-400">わがままグルメ</p>
        </div>

        <PresetButtons onSelect={applyPreset} onReset={resetWeights} />
        <SliderGroup weights={weights} onChange={updateWeight} />

        {loading && (
          <div className="p-4 text-sm text-gray-400">読み込み中...</div>
        )}
        {error && (
          <div className="p-4 text-sm text-red-500">
            データ取得エラー: {error}
          </div>
        )}

        {/* --- 選択中の店舗カード --- */}
        {selectedStore && (
          <div className="border-t border-gray-200 p-4">
            <StoreCard
              store={selectedStore}
              onClose={() => setSelectedStore(null)}
            />
          </div>
        )}

        {/* --- 全スライダー0のヒント --- */}
        {!loading && allZero && (
          <div className="border-t border-gray-200 p-4 text-center text-sm text-gray-400">
            スライダーを動かして条件を設定しましょう
          </div>
        )}

        {/* --- 店舗ランキング --- */}
        {!loading && rankedStores.length > 0 && (
          <div className="flex flex-col gap-1 border-t border-gray-200 p-4">
            <h2 className="mb-2 text-sm font-bold text-gray-600">
              ランキング（{visibleCount} / {storesWithScore.length} 店舗）
            </h2>
            {rankedStores.map((store, i) => (
              <button
                key={store.id}
                onClick={() => setSelectedStore(store)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 ${
                  selectedStore?.id === store.id ? "bg-gray-100" : ""
                }`}
              >
                <span className="w-5 shrink-0 text-center text-xs font-bold text-gray-400">
                  {i + 1}
                </span>
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: store.pinColor }}
                />
                <span className="flex-1 truncate font-medium">
                  {store.name}
                </span>
                <span className="shrink-0 text-xs text-gray-400">
                  {(store.normalizedScore * 100).toFixed(0)}pt
                </span>
              </button>
            ))}
          </div>
        )}
      </aside>

      {/* --- 地図エリア --- */}
      <main className="flex-1">
        <MapView stores={storesWithScore} />
      </main>
    </div>
  );
}

export default App;
