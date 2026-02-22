// ============================================
// MapView.tsx — 地図本体コンポーネント
// 【A専任】このファイルは A のみが編集する
// ============================================

import { useCallback, useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import maplibregl from "maplibre-gl";
import type { StoreWithScore } from "../../types";
import { MapMarker } from "./MapMarker";
import "../../styles/map.css";

/** KRP（京都リサーチパーク）の座標 */
const KRP_CENTER = { lng: 135.7467, lat: 34.9937 };
const DEFAULT_ZOOM = 15;
const MAP_STYLE_URL = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";
const POPUP_LAYOUT_VERSION = 2;

interface MapViewProps {
  stores: StoreWithScore[];
  favoriteIds: Set<string>;
  onToggleFavorite: (storeId: string) => void;
  onOpenDetails: (storeId: string) => void;
  selectedStoreId?: string | null;
  topRankedStores?: Array<{ storeId: string; rank: RankTier }>;
}

type RankTier = 1 | 2 | 3 | null;
type MarkerEntry = {
  marker: maplibregl.Marker;
  root: Root;
  popup: maplibregl.Popup;
  lng: number;
  lat: number;
  markerZIndex: number;
  markerSignature: string;
  popupSignature: string;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createMarkerSignature(store: StoreWithScore, rank: RankTier): string {
  return JSON.stringify({
    rank,
    normalizedScore: store.normalizedScore,
    visible: store.visible,
    pinColor: store.pinColor,
  });
}

function createPopupSignature(store: StoreWithScore, favorite: boolean): string {
  return `${POPUP_LAYOUT_VERSION}|${store.name}|${store.genre}|${favorite ? 1 : 0}`;
}

export default function MapView({
  stores,
  favoriteIds,
  onToggleFavorite,
  onOpenDetails,
  selectedStoreId = null,
  topRankedStores = [],
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, MarkerEntry>>(new Map());

  const bindFavoriteButton = useCallback((
    popup: maplibregl.Popup,
    storeId: string,
    favorite: boolean
  ) => {
    const popupEl = popup.getElement();
    const button = popupEl?.querySelector<HTMLButtonElement>(`button[data-fav-store-id="${storeId}"]`);
    if (!button) return;

    button.textContent = favorite ? "♥" : "♡";
    button.style.color = favorite ? "#ef4444" : "#111";
    button.setAttribute("aria-label", favorite ? "お気に入り解除" : "お気に入り登録");
    button.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();

      const nextFavorite = button.textContent !== "♥";
      button.style.color = nextFavorite ? "#ef4444" : "#111";
      button.textContent = nextFavorite ? "♥" : "♡";
      button.setAttribute("aria-label", nextFavorite ? "お気に入り解除" : "お気に入り登録");
      onToggleFavorite(storeId);
    };
  }, [onToggleFavorite]);

  const bindDetailButton = useCallback((popup: maplibregl.Popup, store: StoreWithScore) => {
    const popupEl = popup.getElement();
    const button = popupEl?.querySelector<HTMLButtonElement>(`button[data-detail-store-id="${store.id}"]`);
    if (!button) return;

    button.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();

      onOpenDetails(store.id);
      popup.remove();
    };
  }, [onOpenDetails]);

  const applyPopupContent = useCallback((
    popup: maplibregl.Popup,
    store: StoreWithScore,
    favorite: boolean
  ) => {
    popup.setHTML(
      `
        <div style="font-size:12px;font-weight:600;color:#4b5563;">${escapeHtml(store.genre)}</div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:2px;">
          <strong>${escapeHtml(store.name)}</strong>
          <button
            data-fav-store-id="${store.id}"
            style="border:1.5px solid #111;border-radius:9999px;background:#fff;padding:2px 6px;cursor:pointer;font-weight:700;line-height:1;color:${favorite ? "#ef4444" : "#111"};"
            aria-label="${favorite ? "お気に入り解除" : "お気に入り登録"}"
          >
            ${favorite ? "♥" : "♡"}
          </button>
        </div>
        <button
          data-detail-store-id="${store.id}"
          style="margin-top:8px;border:1.5px solid #111;border-radius:10px;background:#ff6b35;color:#fff;padding:6px 10px;cursor:pointer;font-weight:800;"
        >
          詳細表示
        </button>
      `
    );

    if (popup.isOpen()) {
      bindFavoriteButton(popup, store.id, favorite);
      bindDetailButton(popup, store);
      return;
    }
    popup.once("open", () => {
      bindFavoriteButton(popup, store.id, favorite);
      bindDetailButton(popup, store);
    });
  }, [bindDetailButton, bindFavoriteButton]);

  // 地図の初期化
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const markers = markersRef.current;

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE_URL,
      center: [KRP_CENTER.lng, KRP_CENTER.lat],
      zoom: DEFAULT_ZOOM,
    });

    return () => {
      // Cleanup roots before removing markers
      markers.forEach(({ marker, root }) => {
        if (root) root.unmount();
        marker.remove();
      });
      markers.clear();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // ピンの更新
  useEffect(() => {
    if (!mapRef.current) return;

    const rankMap = new Map<string, RankTier>();
    const zIndexMap = new Map<string, number>();
    topRankedStores.forEach(({ storeId, rank }) => {
      if (rank) {
        rankMap.set(storeId, rank);
      }
    });

    const rankedVisibleStores = [...stores]
      .filter((store) => store.visible)
      .sort((a, b) => {
        const scoreDiff = b.normalizedScore - a.normalizedScore;
        if (Math.abs(scoreDiff) > Number.EPSILON) return scoreDiff;
        return a.id.localeCompare(b.id);
      });
    rankedVisibleStores.forEach((store, index) => {
      zIndexMap.set(store.id, rankedVisibleStores.length - index);
    });

    topRankedStores.forEach(({ storeId, rank }) => {
      const weight = rank ?? 999;
      zIndexMap.set(storeId, 100000 - weight);
    });

    const nextStoreIds = new Set(stores.map((store) => store.id));

    // 削除された店舗のマーカーを掃除
    markersRef.current.forEach(({ marker, root }, storeId) => {
      if (!nextStoreIds.has(storeId)) {
        root.unmount();
        marker.remove();
        markersRef.current.delete(storeId);
      }
    });

    stores.forEach((store) => {
      const favorite = favoriteIds.has(store.id);
      const rank = rankMap.get(store.id) ?? null;
      const markerZIndex = zIndexMap.get(store.id) ?? 0;
      const markerSignature = createMarkerSignature(store, rank);
      const popupSignature = createPopupSignature(store, favorite);
      const existing = markersRef.current.get(store.id);

      if (existing) {
        if (existing.lng !== store.lng || existing.lat !== store.lat) {
          existing.marker.setLngLat([store.lng, store.lat]);
          existing.lng = store.lng;
          existing.lat = store.lat;
        }

        if (existing.popupSignature !== popupSignature) {
          applyPopupContent(existing.popup, store, favorite);
          existing.popupSignature = popupSignature;
        }

        if (existing.markerZIndex !== markerZIndex) {
          existing.marker.getElement().style.zIndex = String(markerZIndex);
          existing.markerZIndex = markerZIndex;
        }

        if (existing.markerSignature !== markerSignature) {
          existing.root.render(<MapMarker store={store} rank={rank} />);
          existing.markerSignature = markerSignature;
        }
        return;
      }

      const el = document.createElement("div");
      const root = createRoot(el);
      root.render(<MapMarker store={store} rank={rank} />);
      const popup = new maplibregl.Popup({ offset: 15 });
      applyPopupContent(popup, store, favorite);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([store.lng, store.lat])
        .setPopup(popup)
        .addTo(mapRef.current!);
      marker.getElement().style.zIndex = String(markerZIndex);

      markersRef.current.set(store.id, {
        marker,
        root,
        popup,
        lng: store.lng,
        lat: store.lat,
        markerZIndex,
        markerSignature,
        popupSignature,
      });
    });
  }, [stores, favoriteIds, applyPopupContent, topRankedStores]);

  useEffect(() => {
    if (!selectedStoreId) return;

    const entry = markersRef.current.get(selectedStoreId);
    const map = mapRef.current;
    if (!entry || !map) return;

    entry.popup.addTo(map);
    map.easeTo({
      center: [entry.lng, entry.lat],
      duration: 300,
    });
  }, [selectedStoreId]);

  return <div ref={mapContainer} className="map-container" />;
}
