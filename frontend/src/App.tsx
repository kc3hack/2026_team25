// ============================================
// App.tsx — レイアウト統合
// 【B専任】このファイルは B のみが編集する
// ============================================

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import BottomNav, { type Tab } from "./components/Panel/BottomNav";
import MapView from "./components/Map/MapView";
import ChatPlaceholder from "./components/Panel/ChatPlaceholder";
import ProfileView from "./components/Panel/ProfileView";
import PresetButtons from "./components/Panel/PresetButtons";
import SliderGroup from "./components/Panel/SliderGroup";
import StoreCard from "./components/Panel/StoreCard";
import { useWeights } from "./hooks/useWeights";
import { calculateScores } from "./lib/scoreEngine";
import { fetchStores } from "./lib/api";
import {
  type Store,
  type StoreWithScore,
  type Weights,
} from "./types";

type MobileSheetLevel = "full" | "mid" | "half" | "closed";
const TOP_BAR_HEIGHT = 68;
const GENRE_BAR_HEIGHT = 52;
const BOTTOM_NAV_HEIGHT = 56;

const MOBILE_SHEET_LEVELS: MobileSheetLevel[] = [
  "full",
  "mid",
  "half",
  "closed",
];

function getLevelHeightPx(
  level: MobileSheetLevel,
  viewportHeight: number,
  contentTopOffset: number
): number {
  const maxHeight = Math.max(
    260,
    viewportHeight - contentTopOffset - BOTTOM_NAV_HEIGHT
  );
  if (level === "full") return maxHeight;
  if (level === "mid") return Math.max(220, maxHeight * 0.5);
  if (level === "half") return Math.max(168, maxHeight * 0.28);
  return 92;
}

function App() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("すべて");
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [selectedStore, setSelectedStore] = useState<StoreWithScore | null>(
    null
  );
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);
  const [topBarHeight, setTopBarHeight] = useState(TOP_BAR_HEIGHT);
  const [mobileSheetLevel, setMobileSheetLevel] = useState<MobileSheetLevel>("closed");
  const [mobileTab, setMobileTab] = useState<"controls" | "list">("controls");
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const [mobileDragHeight, setMobileDragHeight] = useState<number | null>(null);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const { weights, updateWeight, applyPreset, resetWeights } = useWeights();
  const panelRef = useRef<HTMLElement | null>(null);
  const rankingSectionRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const dragStartYRef = useRef<number | null>(null);
  const dragStartHeightRef = useRef<number>(0);
  const activePointerIdRef = useRef<number | null>(null);

  // 初回: APIから店舗データ取得
  useEffect(() => {
    fetchStores()
      .then(setStores)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Unknown error")
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setKeyboardInset(0);
      return;
    }

    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateInset = () => {
      const inset = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop
      );
      setKeyboardInset(inset);
    };

    updateInset();
    viewport.addEventListener("resize", updateInset);
    viewport.addEventListener("scroll", updateInset);

    return () => {
      viewport.removeEventListener("resize", updateInset);
      viewport.removeEventListener("scroll", updateInset);
    };
  }, [isMobile]);

  // スライダー変更ごとにフロントで再計算
  const storesWithScore = useMemo(
    () => calculateScores(stores, weights),
    [stores, weights]
  );

  const genres = useMemo(() => {
    const unique = Array.from(new Set(stores.map((s) => s.genre))).sort();
    return ["すべて", ...unique];
  }, [stores]);

  const filteredStoresWithScore = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return storesWithScore.filter((store) => {
      const matchQuery =
        !query ||
        store.name.toLowerCase().includes(query) ||
        store.genre.toLowerCase().includes(query);
      const matchGenre =
        selectedGenre === "すべて" || store.genre === selectedGenre;
      return matchQuery && matchGenre;
    });
  }, [storesWithScore, searchQuery, selectedGenre]);

  // スコア順にソート（visible のみ）
  const rankedStores = useMemo(
    () =>
      [...filteredStoresWithScore]
        .filter((s) => s.visible)
        .sort((a, b) => b.normalizedScore - a.normalizedScore),
    [filteredStoresWithScore]
  );

  const favoriteStores = useMemo(
    () =>
      storesWithScore
        .filter((store) => favoriteIds.has(store.id))
        .sort((a, b) => b.normalizedScore - a.normalizedScore),
    [storesWithScore, favoriteIds]
  );

  useEffect(() => {
    const handleResize = () => {
      const measuredHeader = headerRef.current?.offsetHeight;
      if (measuredHeader && Number.isFinite(measuredHeader)) {
        setTopBarHeight(measuredHeader);
      }

      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileSheetLevel("half");
        setActiveTab("home");
      } else {
        setMobileSheetLevel("closed");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSheetPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!isMobile) return;

    activePointerIdRef.current = e.pointerId;
    dragStartYRef.current = e.clientY;
    dragStartHeightRef.current = getLevelHeightPx(
      mobileSheetLevel,
      window.innerHeight,
      homeTopOffset
    );
    setMobileDragHeight(dragStartHeightRef.current);
    setIsDraggingSheet(true);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // no-op
    }

    const onMove = (moveEvent: PointerEvent) => {
      if (activePointerIdRef.current !== moveEvent.pointerId) return;
      if (dragStartYRef.current === null) return;
      const viewportHeight = window.innerHeight;
      const minHeight = getLevelHeightPx("closed", viewportHeight, homeTopOffset);
      const maxHeight = getLevelHeightPx("full", viewportHeight, homeTopOffset);
      const delta = moveEvent.clientY - dragStartYRef.current;
      const nextHeight = Math.max(
        minHeight,
        Math.min(maxHeight, dragStartHeightRef.current - delta)
      );
      setMobileDragHeight(nextHeight);
    };

    const finishDrag = (upEvent: PointerEvent) => {
      if (activePointerIdRef.current !== null && activePointerIdRef.current !== upEvent.pointerId) {
        return;
      }

      const startY = dragStartYRef.current;
      activePointerIdRef.current = null;
      dragStartYRef.current = null;
      setIsDraggingSheet(false);
      setMobileDragHeight(null);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);

      if (startY === null) return;

      const delta = upEvent.clientY - startY;
      const viewportHeight = window.innerHeight;
      const minHeight = getLevelHeightPx("closed", viewportHeight, homeTopOffset);
      const maxHeight = getLevelHeightPx("full", viewportHeight, homeTopOffset);

      const draggedHeight = Math.max(
        minHeight,
        Math.min(maxHeight, dragStartHeightRef.current - delta)
      );

      const nearestLevel = MOBILE_SHEET_LEVELS.reduce((nearest, candidate) => {
        const nearestDiff = Math.abs(
          draggedHeight - getLevelHeightPx(nearest, viewportHeight, homeTopOffset)
        );
        const candidateDiff = Math.abs(
          draggedHeight - getLevelHeightPx(candidate, viewportHeight, homeTopOffset)
        );
        return candidateDiff < nearestDiff ? candidate : nearest;
      }, "half" as MobileSheetLevel);

      setMobileSheetLevel(nearestLevel);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", finishDrag, { passive: true });
    window.addEventListener("pointercancel", finishDrag, { passive: true });
  };

  const handleSheetTouchStart = (e: ReactTouchEvent<HTMLButtonElement>) => {
    if (!isMobile) return;
    const touch = e.touches[0];
    if (!touch) return;

    dragStartYRef.current = touch.clientY;
    dragStartHeightRef.current = getLevelHeightPx(
      mobileSheetLevel,
      window.innerHeight,
      homeTopOffset
    );
    setMobileDragHeight(dragStartHeightRef.current);
    setIsDraggingSheet(true);

    const onTouchMove = (moveEvent: TouchEvent) => {
      const nextTouch = moveEvent.touches[0];
      if (!nextTouch || dragStartYRef.current === null) return;
      moveEvent.preventDefault();

      const viewportHeight = window.innerHeight;
      const minHeight = getLevelHeightPx("closed", viewportHeight, homeTopOffset);
      const maxHeight = getLevelHeightPx("full", viewportHeight, homeTopOffset);
      const delta = nextTouch.clientY - dragStartYRef.current;
      const nextHeight = Math.max(
        minHeight,
        Math.min(maxHeight, dragStartHeightRef.current - delta)
      );
      setMobileDragHeight(nextHeight);
    };

    const onTouchEnd = (endEvent: TouchEvent) => {
      const startY = dragStartYRef.current;

      dragStartYRef.current = null;
      setIsDraggingSheet(false);
      setMobileDragHeight(null);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);

      if (startY === null) return;

      const changed = endEvent.changedTouches[0];
      if (!changed) return;

      const delta = changed.clientY - startY;
      const viewportHeight = window.innerHeight;
      const minHeight = getLevelHeightPx("closed", viewportHeight, homeTopOffset);
      const maxHeight = getLevelHeightPx("full", viewportHeight, homeTopOffset);

      const draggedHeight = Math.max(
        minHeight,
        Math.min(maxHeight, dragStartHeightRef.current - delta)
      );

      const nearestLevel = MOBILE_SHEET_LEVELS.reduce((nearest, candidate) => {
        const nearestDiff = Math.abs(
          draggedHeight - getLevelHeightPx(nearest, viewportHeight, homeTopOffset)
        );
        const candidateDiff = Math.abs(
          draggedHeight - getLevelHeightPx(candidate, viewportHeight, homeTopOffset)
        );
        return candidateDiff < nearestDiff ? candidate : nearest;
      }, "half" as MobileSheetLevel);

      setMobileSheetLevel(nearestLevel);
    };

    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
  };

  useEffect(() => {
    if (!selectedStore) return;
    const exists = filteredStoresWithScore.some((s) => s.id === selectedStore.id);
    if (!exists) setSelectedStore(null);
  }, [filteredStoresWithScore, selectedStore]);

  const visibleCount = rankedStores.length;
  const allZero = Object.values(weights).every((v) => v === 0);
  const showHomeGenreBar = !isMobile || activeTab === "home";
  const homeTopOffset = topBarHeight + (showHomeGenreBar ? GENRE_BAR_HEIGHT : 0);
  const showMobileBody = !isMobile || mobileSheetLevel !== "closed";
  const bottomNavOffset = isMobile && activeTab === "chat" ? keyboardInset : 0;
  const mobileSheetHeightPx = isMobile
    ? getLevelHeightPx(mobileSheetLevel, window.innerHeight, homeTopOffset)
    : null;
  const mobilePanelLayerClass = isMobile && isDraggingSheet ? "z-[70]" : "z-20";

  const toggleFavorite = useCallback((storeId: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(storeId)) {
        next.delete(storeId);
      } else {
        next.add(storeId);
      }
      return next;
    });
  }, []);

  const handleSelectSuggestedStore = useCallback(
    (store: StoreWithScore, nextWeights: Weights) => {
      applyPreset(nextWeights);
      setSelectedStore(store);
      setActiveTab("home");
      if (isMobile) {
        setMobileTab("list");
        setMobileSheetLevel("half");
      }
    },
    [applyPreset, isMobile]
  );

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchQuery((prev) => prev.trim());

    if (isMobile) {
      setMobileTab("list");
      setMobileSheetLevel("half");
    }

    rankingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative h-screen w-screen bg-slate-100">
      <header
        ref={headerRef}
        className="absolute inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/95 px-3 py-3 backdrop-blur md:px-4"
      >
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setActiveTab("home");
              setMobileTab("controls");
              setMobileSheetLevel("half");
            }}
            className="shrink-0"
            aria-label="ホームに戻る"
          >
            <img
              src="/WagamamaGourmetLogo.png"
              alt="Wagamama Gourmet"
              className="h-10 w-auto object-contain"
            />
          </button>

          <form
            onSubmit={handleSearchSubmit}
            className="flex w-full items-center gap-2 rounded-[28px] border-2 border-black bg-slate-100 px-4 py-2 shadow-[0_4px_0_0_rgba(0,0,0,1)]"
          >
            <label htmlFor="store-search" className="sr-only">
              店舗名またはジャンルで検索
            </label>
            <span className="text-xl">🔍</span>
            <input
              id="store-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="「激安で満腹になりたい！」"
              className="w-full bg-transparent text-base font-semibold outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              aria-label="検索を実行"
              className="ml-1 shrink-0 rounded-full border-2 border-black bg-orange-500 px-4 py-2 text-base font-black text-white shadow-[0_2px_0_0_rgba(0,0,0,1)] transition-transform hover:scale-105 active:translate-y-0.5"
            >
              GO!
            </button>
          </form>
        </div>
      </header>

      {showHomeGenreBar && (
        <section
          style={{ top: `${topBarHeight}px` }}
          className="absolute inset-x-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-2 backdrop-blur"
        >
          <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto pb-1">
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold transition-colors ${selectedGenre === genre
                  ? "border-black bg-black text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </section>
      )}

      <div
        style={{
          paddingTop: `${homeTopOffset}px`,
          height: `calc(100vh - ${homeTopOffset}px)`,
        }}
        className={`flex md:flex-row ${isMobile && activeTab !== "home" ? "hidden" : ""}`}
      >
        {/* --- 左パネル --- */}
        <aside
          ref={panelRef}
          style={
            isMobile
              ? {
                height: `${mobileDragHeight ?? mobileSheetHeightPx}px`,
                transitionDuration: mobileDragHeight !== null ? "0ms" : undefined,
              }
              : undefined
          }
          className={`${mobilePanelLayerClass} order-2 flex w-full shrink-0 flex-col overflow-y-auto bg-slate-50 transition-all duration-300 md:order-1 md:h-full md:w-[390px] md:border-r md:border-t-0 ${isMobile
            ? "absolute bottom-14 left-0 right-0 rounded-t-3xl border-t border-slate-200 shadow-[0_-8px_24px_rgba(15,23,42,0.18)]"
            : "h-full border-t"
            }`}
        >
          {isMobile && (
            <div className="sticky top-0 z-30 grid h-16 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 bg-white/95 px-3 backdrop-blur">
              <button
                onClick={() => {
                  setMobileTab("controls");
                  setMobileSheetLevel("half");
                }}
                type="button"
                className={`col-start-1 z-10 justify-self-start rounded-3xl border-[3px] px-3 py-1 text-xs font-black shadow-[0_3px_0_0_rgba(0,0,0,1)] transition-all ${mobileTab === "controls"
                  ? "border-black bg-black text-white"
                  : "border-black bg-slate-100 text-black"
                  }`}
              >
                調整
              </button>

              <button
                onPointerDown={handleSheetPointerDown}
                onTouchStart={handleSheetTouchStart}
                type="button"
                className={`pointer-events-auto absolute inset-x-0 top-1/2 z-0 mx-3 flex h-11 -translate-y-1/2 items-center justify-center rounded-full ${isDraggingSheet ? "cursor-grabbing" : "cursor-grab"
                  } touch-none select-none`}
                aria-label="パネル高さを切り替え"
              >
                <span className="pointer-events-none h-1.5 w-16 rounded-full bg-slate-300" />
              </button>

              <button
                onClick={() => {
                  setMobileTab("list");
                  setMobileSheetLevel("half");
                }}
                type="button"
                className={`col-start-3 z-10 justify-self-end rounded-3xl border-[3px] px-3 py-1 text-xs font-black shadow-[0_3px_0_0_rgba(0,0,0,1)] transition-all ${mobileTab === "list"
                  ? "border-black bg-black text-white"
                  : "border-black bg-slate-100 text-black"
                  }`}
              >
                ランキング
              </button>
            </div>
          )}

          {showMobileBody ? (
            <>
              {(!isMobile || mobileTab === "controls") && (
                <div className="space-y-3 p-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <p className="mb-2 text-xs font-black tracking-wide text-slate-500">クイックモード</p>
                    <PresetButtons onSelect={applyPreset} onReset={resetWeights} />
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <p className="mb-2 text-xs font-black tracking-wide text-slate-500">こだわりスライダー</p>
                    <SliderGroup weights={weights} onChange={updateWeight} />
                  </div>
                </div>
              )}

            </>
          ) : (
            <div className="h-14 bg-white" aria-hidden="true">
            </div>
          )}

          {loading && (
            <div className="px-4 pb-4 text-sm text-slate-400">読み込み中...</div>
          )}
          {error && (
            <div className="px-4 pb-4 text-sm text-rose-500">
              データ取得エラー: {error}
            </div>
          )}

          {/* --- 全スライダー0のヒント --- */}
          {!loading && allZero && (!isMobile || mobileSheetLevel !== "closed") && (
            <div className="border-t border-slate-200 p-4 text-center text-sm text-slate-400">
              スライダーを動かして条件を設定しましょう
            </div>
          )}

          {/* --- 店舗ランキング --- */}
          {!loading && rankedStores.length > 0 && (!isMobile || mobileTab === "list") && (
            <div
              ref={rankingSectionRef}
              className="flex flex-col gap-2 border-t border-slate-200 bg-white p-4"
            >
              <h2 className="mb-1 text-sm font-bold text-slate-600">
                ランキング（{visibleCount} / {filteredStoresWithScore.length} 店舗）
              </h2>
              {rankedStores.map((store, i) => {
                const isSelected = selectedStore?.id === store.id;

                return (
                  <div key={store.id} className="space-y-2">
                    <button
                      onClick={() => setSelectedStore(store)}
                      className={`relative flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm transition-colors hover:border-slate-300 hover:bg-slate-50 ${isSelected ? "border-black" : ""
                        }`}
                    >
                      {i < 3 && (
                        <span className="absolute -left-2 -top-2 rounded-md bg-orange-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                          TOP {i + 1}
                        </span>
                      )}
                      <span className="w-5 shrink-0 text-center text-xs font-bold text-slate-400">{i + 1}</span>
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: store.pinColor }}
                      />
                      <span className="flex-1 truncate font-medium">
                        {store.name}
                      </span>
                      <span className="shrink-0 rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {(store.normalizedScore * 100).toFixed(0)}pt
                      </span>
                    </button>

                    {isSelected && (
                      <StoreCard
                        store={store}
                        isFavorite={favoriteIds.has(store.id)}
                        onToggleFavorite={() => toggleFavorite(store.id)}
                        onClose={() => setSelectedStore(null)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        {/* --- 地図エリア --- */}
        <main className="relative z-10 order-1 h-full flex-1 p-0 md:order-2 md:h-full md:p-3">
          <div className="h-full w-full overflow-hidden bg-white md:rounded-2xl md:border md:border-slate-200 md:shadow-sm">
            <MapView
              stores={filteredStoresWithScore}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
            />
          </div>
        </main>

      </div>

      {isMobile && activeTab === "chat" && (
        <section
          style={{ top: `${topBarHeight}px` }}
          className="absolute inset-x-0 bottom-14 z-30"
        >
          <ChatPlaceholder
            stores={stores}
            selectedGenre={selectedGenre === "すべて" ? null : selectedGenre}
            topStoreNames={rankedStores.slice(0, 3).map((store) => store.name)}
            weights={weights}
            onSelectSuggestion={handleSelectSuggestedStore}
          />
        </section>
      )}

      {isMobile && activeTab === "profile" && (
        <section
          style={{ top: `${topBarHeight}px` }}
          className="absolute inset-x-0 bottom-14 z-30"
        >
          <ProfileView
            favoriteStores={favoriteStores}
            onOpenStore={(store) => {
              setSelectedStore(store);
              setActiveTab("home");
              setMobileTab("list");
              setMobileSheetLevel("half");
            }}
            onUnfavorite={toggleFavorite}
          />
        </section>
      )}

      {isMobile && (
        <div
          style={{ bottom: `${bottomNavOffset}px` }}
          className="absolute inset-x-0 z-50"
        >
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      )}
    </div>
  );
}

export default App;
