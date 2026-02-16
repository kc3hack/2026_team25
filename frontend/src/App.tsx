// ============================================
// App.tsx — レイアウト統合
// 【B専任】このファイルは B のみが編集する
// ============================================

import { useEffect, useState, useMemo } from "react";
import { MapView } from "./components/Map";
import { SliderGroup, PresetButtons } from "./components/Panel";
import { useWeights } from "./hooks/useWeights";
import { calculateScores } from "./lib/scoreEngine";
import { fetchStores } from "./lib/api";
import type { Store } from "./types";

function App() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { weights, updateWeight, applyPreset } = useWeights();

  // 初回: APIから店舗データ取得
  useEffect(() => {
    fetchStores()
      .then(setStores)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // スライダー変更ごとにフロントで再計算
  const storesWithScore = useMemo(
    () => calculateScores(stores, weights),
    [stores, weights]
  );

  return (
    <div className="flex h-screen w-screen">
      {/* --- 左パネル --- */}
      <aside className="flex w-80 shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          <h1 className="text-xl font-bold text-emerald-600">
            🍽️ Wagamama Gourmet
          </h1>
          <p className="text-xs text-gray-400">わがままグルメ</p>
        </div>

        <PresetButtons onSelect={applyPreset} />
        <SliderGroup weights={weights} onChange={updateWeight} />

        {loading && (
          <div className="p-4 text-sm text-gray-400">読み込み中...</div>
        )}
        {error && (
          <div className="p-4 text-sm text-red-500">
            ⚠ データ取得エラー: {error}
          </div>
        )}
        <div className="mt-auto p-4 text-xs text-gray-300">
          表示中: {storesWithScore.filter((s) => s.visible).length} /{" "}
          {storesWithScore.length} 店舗
        </div>
      </aside>

      {/* --- 地図エリア --- */}
      <main className="flex-1">
        <MapView stores={storesWithScore} />
      </main>
    </div>
  );
}

export default App;
