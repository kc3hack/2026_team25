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
  SearchBar,
  GenrePresets,
  SliderDrawer,
  StoreCard,
} from "./components/Panel";
import type { Tab } from "./components/Panel";
import { useWeights } from "./hooks/useWeights";
import { calculateScores } from "./lib/scoreEngine";
import { fetchStores } from "./lib/api";
import type { Store, StoreWithScore } from "./types";

function App() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("map");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<StoreWithScore | null>(null);
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

  // ジャンルフィルター適用
  const filteredStores = useMemo(
    () =>
      selectedGenre
        ? storesWithScore.filter((s) => s.genre === selectedGenre)
        : storesWithScore,
    [storesWithScore, selectedGenre]
  );

  const rankedStores = useMemo(
    () =>
      [...filteredStores]
        .filter((store) => store.visible)
        .sort((a, b) => b.normalizedScore - a.normalizedScore),
    [filteredStores]
  );

  const rankingSection = (
    <>
      {!loading && rankedStores.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-gray-200 p-4">
          <h2 className="mb-2 text-sm font-bold text-gray-600">
            ランキング（{rankedStores.length} / {filteredStores.length} 店舗）
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
              <span className="flex-1 truncate font-medium">{store.name}</span>
              <span className="shrink-0 text-xs text-gray-400">
                {(store.normalizedScore * 100).toFixed(0)}pt
              </span>
            </button>
          ))}
        </div>
      )}

      {selectedStore && (
        <div className="border-t border-gray-200 p-4">
          <StoreCard store={selectedStore} onClose={() => setSelectedStore(null)} />
        </div>
      )}
    </>
  );

  // ホームタブ内容 (モバイル用)
  const homeContent = (
    <>
      <div className="flex flex-col gap-4 px-4 py-3">
        <h2 className="text-lg font-bold text-gray-900">モードで探す</h2>
        <PresetButtons onSelect={applyPreset} />

        <h2 className="text-lg font-bold text-gray-900">ジャンルから探す</h2>
        <GenrePresets
          selectedGenre={selectedGenre}
          onGenreSelect={setSelectedGenre}
        />
      </div>

      {loading && (
        <div className="p-4 text-sm text-gray-400">読み込み中...</div>
      )}
      {error && (
        <div className="p-4 text-sm text-red-500">
          データ取得エラー: {error}
        </div>
      )}
      {rankingSection}
      <div className="mt-auto p-4 text-xs text-gray-300">
        表示中: {filteredStores.filter((s) => s.visible).length} /{" "}
        {filteredStores.length} 店舗
      </div>
    </>
  );

  // デスクトップサイドバー内容 (スライダー含む)
  const desktopSidebar = (
    <>
      <div className="flex items-center gap-2 border-b border-gray-200 p-3">
        <button
          type="button"
          onClick={() => setActiveTab("home")}
          className="cursor-pointer"
        >
          <img src="/logo.png" alt="Wagamama Gourmet" className="h-8" />
        </button>
        <SearchBar className="min-w-0 flex-1" compact />
      </div>

      <div className="flex flex-col gap-4 px-4 py-3">
        <h2 className="text-lg font-bold text-gray-900">モードで探す</h2>
        <PresetButtons onSelect={applyPreset} />

        <h2 className="text-lg font-bold text-gray-900">ジャンルから探す</h2>
        <GenrePresets
          selectedGenre={selectedGenre}
          onGenreSelect={setSelectedGenre}
        />
      </div>

      <SliderGroup weights={weights} onChange={updateWeight} />

      {loading && (
        <div className="p-4 text-sm text-gray-400">読み込み中...</div>
      )}
      {error && (
        <div className="p-4 text-sm text-red-500">
          データ取得エラー: {error}
        </div>
      )}
      {rankingSection}
      <div className="mt-auto p-4 text-xs text-gray-300">
        表示中: {filteredStores.filter((s) => s.visible).length} /{" "}
        {filteredStores.length} 店舗
      </div>
    </>
  );

  return (
    <div className="flex h-dvh w-screen flex-col overflow-hidden md:flex-row">
      {/* ===== デスクトップ: 左パネル (md以上で表示) ===== */}
      <aside className="hidden w-80 shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-white md:flex">
        {desktopSidebar}
      </aside>

      {/* ===== モバイル: ロゴヘッダー (全タブ共通) ===== */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-3 py-2 md:hidden">
        <button
          type="button"
          onClick={() => setActiveTab("home")}
          className="shrink-0 cursor-pointer"
        >
          <img src="/logo.png" alt="Wagamama Gourmet" className="h-8" />
        </button>
        <SearchBar className="min-w-0 flex-1" compact />
      </div>

      {/* ===== コンテンツ領域 ===== */}
      <div className="relative flex-1 overflow-hidden">
        {/* --- ホームタブ (モバイルのみ) --- */}
        <div
          className={`absolute inset-0 overflow-y-auto bg-white ${
            activeTab === "home" ? "z-10 visible" : "z-0 invisible"
          } md:hidden`}
        >
          {homeContent}
        </div>

        {/* --- 地図 + スライダードロワー (モバイル) --- */}
        <div
          className={`absolute inset-0 touch-none ${
            activeTab === "map" ? "z-10 visible" : "z-0 invisible"
          } md:relative md:inset-auto md:z-auto md:visible md:h-full`}
        >
          <MapView stores={filteredStores} />
          {/* モバイル: 地図上のスライダードロワー */}
          <div className="touch-auto md:hidden">
            <SliderDrawer weights={weights} onChange={updateWeight} />
          </div>
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
