// ============================================
// App.tsx — レイアウト統合
// 【B専任】このファイルは B のみが編集する
// ============================================

import { useEffect, useState, useMemo } from "react";
import { ChevronDown, ChevronRight, SlidersHorizontal } from "lucide-react";
import { MapView } from "./components/map";
import {
  SliderGroup,
  PresetButtons,
  BottomNav,
  ChatPlaceholder,
  SearchBar,
  GenrePresets,
  SliderDrawer,
  StoreCard,
  StoreListPanel,
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

  // サイドバーの開閉状態
  const [openSections, setOpenSections] = useState({
    mode: true,
    genre: true,
    slider: false,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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

  // ===== モバイル用ランキングセクション =====
  const rankingSection = (
    <>
      {!loading && rankedStores.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-border-subtle p-4">
          <h2 className="mb-2 text-sm font-bold text-text-secondary">
            ランキング（{rankedStores.length} / {filteredStores.length} 店舗）
          </h2>
          {rankedStores.map((store, i) => (
            <button
              key={store.id}
              onClick={() => setSelectedStore(store)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-dark-elevated ${
                selectedStore?.id === store.id ? "bg-dark-elevated" : ""
              }`}
            >
              <span className="w-5 shrink-0 text-center text-xs font-bold text-text-muted">
                {i + 1}
              </span>
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: store.pinColor }}
              />
              <span className="flex-1 truncate font-medium text-text-primary">{store.name}</span>
              <span className="shrink-0 font-mono-score text-xs text-text-secondary">
                {(store.normalizedScore * 100).toFixed(0)}pt
              </span>
            </button>
          ))}
        </div>
      )}

      {selectedStore && (
        <div className="border-t border-border-subtle p-4">
          <StoreCard store={selectedStore} onClose={() => setSelectedStore(null)} />
        </div>
      )}
    </>
  );

  // ===== モバイル: ホームタブ内容 =====
  const homeContent = (
    <>
      <div className="flex flex-col gap-4 px-4 py-3">
        <h2 className="text-lg font-bold text-text-primary">モードで探す</h2>
        <PresetButtons onSelect={applyPreset} />

        <h2 className="text-lg font-bold text-text-primary">ジャンルから探す</h2>
        <GenrePresets
          selectedGenre={selectedGenre}
          onGenreSelect={setSelectedGenre}
        />
      </div>

      {loading && (
        <div className="p-4 text-sm text-text-muted">読み込み中...</div>
      )}
      {error && (
        <div className="p-4 text-sm text-red-400">
          データ取得エラー: {error}
        </div>
      )}
      {rankingSection}
      <div className="mt-auto p-4 text-xs text-text-muted">
        表示中: {filteredStores.filter((s) => s.visible).length} /{" "}
        {filteredStores.length} 店舗
      </div>
    </>
  );

  // ===== デスクトップ: 左サイドバー（ナロー） =====
  const desktopSidebar = (
    <>
      {/* ロゴ + 検索 */}
      <div className="flex items-center gap-2 border-b border-border-subtle p-3">
        <button
          type="button"
          onClick={() => setActiveTab("home")}
          className="shrink-0 cursor-pointer"
        >
          <img src="/logo.png" alt="Wagamama Gourmet" className="h-7" />
        </button>
      </div>

      <div className="px-3 py-2">
        <SearchBar compact />
      </div>

      {/* フィルター見出し */}
      <div className="px-4 pb-1 pt-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
          フィルター
        </span>

      </div>

      {/* モードで探す */}
      <div className="border-b border-border-subtle">
        <button
          type="button"
          onClick={() => toggleSection("mode")}
          className="flex w-full cursor-pointer items-center justify-between px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-dark-elevated"
        >
          <span>モードで探す</span>
          {openSections.mode ? (
            <ChevronDown size={14} className="text-text-muted" />
          ) : (
            <ChevronRight size={14} className="text-text-muted" />
          )}
        </button>
        {openSections.mode && (
          <div className="pb-2">
            <PresetButtons onSelect={applyPreset} variant="list" />
          </div>
        )}
      </div>

      {/* ジャンルから探す */}
      <div className="border-b border-border-subtle">
        <button
          type="button"
          onClick={() => toggleSection("genre")}
          className="flex w-full cursor-pointer items-center justify-between px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-dark-elevated"
        >
          <span>ジャンルから探す</span>
          {openSections.genre ? (
            <ChevronDown size={14} className="text-text-muted" />
          ) : (
            <ChevronRight size={14} className="text-text-muted" />
          )}
        </button>
        {openSections.genre && (
          <div className="max-h-60 overflow-y-auto pb-2">
            <GenrePresets
              selectedGenre={selectedGenre}
              onGenreSelect={setSelectedGenre}
              variant="list"
            />
          </div>
        )}
      </div>

      {/* こだわりスライダー */}
      <div className="border-b border-border-subtle">
        <button
          type="button"
          onClick={() => toggleSection("slider")}
          className="flex w-full cursor-pointer items-center justify-between px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-dark-elevated"
        >
          <span className="flex items-center gap-1.5">
            <SlidersHorizontal size={14} className="text-text-muted" />
            こだわりスライダー
          </span>
          {openSections.slider ? (
            <ChevronDown size={14} className="text-text-muted" />
          ) : (
            <ChevronRight size={14} className="text-text-muted" />
          )}
        </button>
        {openSections.slider && (
          <SliderGroup weights={weights} onChange={updateWeight} />
        )}
      </div>

      {/* フッター */}
      {error && (
        <div className="p-3 text-xs text-red-400">
          データ取得エラー: {error}
        </div>
      )}
      <div className="mt-auto p-3 text-[10px] text-text-muted">
        {filteredStores.filter((s) => s.visible).length} / {filteredStores.length} 店舗
      </div>
    </>
  );

  return (
    <div className="flex h-dvh w-screen flex-col overflow-hidden md:flex-row">
      {/* ===== デスクトップ: 左サイドバー (md以上) ===== */}
      <aside className="glass-panel hidden w-56 shrink-0 flex-col overflow-y-auto border-r border-border-subtle md:flex">
        {desktopSidebar}
      </aside>

      {/* ===== デスクトップ: 中央リストパネル (md以上) ===== */}
      <section className="hidden w-80 shrink-0 border-r border-border-subtle bg-dark-base md:block">
        <StoreListPanel
          rankedStores={rankedStores}
          filteredCount={filteredStores.length}
          selectedGenre={selectedGenre}
          onGenreSelect={setSelectedGenre}
          selectedStore={selectedStore}
          onStoreSelect={setSelectedStore}
          onStoreClose={() => setSelectedStore(null)}
          loading={loading}
        />
      </section>

      {/* ===== モバイル: ロゴヘッダー (全タブ共通) ===== */}
      <div className="flex items-center gap-2 border-b border-border-subtle bg-dark-surface px-3 py-2 md:hidden">
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
          className={`absolute inset-0 overflow-y-auto bg-dark-base ${
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
