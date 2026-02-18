// ============================================
// App.tsx — レイアウト統合
// 【B専任】このファイルは B のみが編集する
// ============================================

import { useEffect, useState, useMemo } from "react";
import { MapView } from "./components/Map";
import {
  SliderGroup,
  PresetButtons,
  BottomNav,
  ChatPlaceholder,
} from "./components/Panel";
import type { Tab } from "./components/Panel";
import { useWeights } from "./hooks/useWeights";
import { calculateScores } from "./lib/scoreEngine";
import { fetchStores } from "./lib/api";
import type { Store } from "./types";

function App() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("map");
  const { weights, updateWeight, applyPreset } = useWeights();

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

  // パネル内容（デスクトップサイドバー & モバイルホームタブ共用）
  const panelContent = (
    <>
      <div className="border-b border-gray-200 p-4">
        <h1 className="text-xl font-bold text-emerald-600">
          Wagamama Gourmet
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
          データ取得エラー: {error}
        </div>
      )}
      <div className="mt-auto p-4 text-xs text-gray-300">
        表示中: {storesWithScore.filter((s) => s.visible).length} /{" "}
        {storesWithScore.length} 店舗
      </div>
    </>
  );

  return (
    <div className="flex h-dvh w-screen flex-col overflow-hidden md:flex-row">
      {/* ===== デスクトップ: 左パネル (md以上で表示) ===== */}
      <aside className="hidden w-80 shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-white md:flex">
        {panelContent}
      </aside>

      {/* ===== コンテンツ領域 ===== */}
      <div className="relative flex-1 overflow-hidden">
        {/* --- ホームタブ (モバイルのみ) --- */}
        <div
          className={`absolute inset-0 overflow-y-auto bg-white ${
            activeTab === "home" ? "z-10 visible" : "z-0 invisible"
          } md:hidden`}
        >
          {panelContent}
        </div>

        {/* --- 地図 (常にマウント、単一インスタンス) --- */}
        <div
          className={`absolute inset-0 touch-none ${
            activeTab === "map" ? "z-10 visible" : "z-0 invisible"
          } md:relative md:inset-auto md:z-auto md:visible md:h-full`}
        >
          <MapView stores={storesWithScore} />
        </div>

        {/* --- チャットタブ (モバイルのみ) --- */}
        <div
          className={`absolute inset-0 ${
            activeTab === "chat" ? "z-10 visible" : "z-0 invisible"
          } md:hidden`}
        >
          <ChatPlaceholder />
        </div>
      </div>

      {/* ===== モバイル: ボトムナビ ===== */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default App;
