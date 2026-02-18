// ============================================
// App.tsx — レイアウト統合
// 【B専任】このファイルは B のみが編集する
// ============================================

import { useEffect, useState, useMemo } from "react";
import { MapView } from "./components/map";
import {
  SliderGroup,
  PresetButtons,
  BottomNav,
  ChatPlaceholder,
  SearchBar,
  GenrePresets,
  SliderDrawer,
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
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
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

  // ホームタブ内容 (モバイル用)
  const homeContent = (
    <>
      <div className="p-5 pb-2">
        <h1 className="text-2xl font-bold text-gray-900">
          Wagamama Gourmet
        </h1>
        <p className="text-xs text-gray-400">わがままグルメ</p>
      </div>

      <SearchBar />

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
      <div className="mt-auto p-4 text-xs text-gray-300">
        表示中: {filteredStores.filter((s) => s.visible).length} /{" "}
        {filteredStores.length} 店舗
      </div>
    </>
  );

  // デスクトップサイドバー内容 (スライダー含む)
  const desktopSidebar = (
    <>
      <div className="p-5 pb-2">
        <h1 className="text-2xl font-bold text-gray-900">
          Wagamama Gourmet
        </h1>
        <p className="text-xs text-gray-400">わがままグルメ</p>
      </div>

      <SearchBar />

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
