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

interface MapViewProps {
  stores: StoreWithScore[];
  favoriteIds: Set<string>;
  onToggleFavorite: (storeId: string) => void;
}

type RankTier = 1 | 2 | 3 | null;
type MarkerEntry = {
  marker: maplibregl.Marker;
  root: Root;
  popup: maplibregl.Popup;
  lng: number;
  lat: number;
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
  return `${store.name}|${store.genre}|${favorite ? 1 : 0}`;
}

export default function MapView({ stores, favoriteIds, onToggleFavorite }: MapViewProps) {
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

    button.textContent = favorite ? "★" : "☆";
    button.setAttribute("aria-label", favorite ? "お気に入り解除" : "お気に入り登録");
    button.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();

      const nextFavorite = button.textContent !== "★";
      button.textContent = nextFavorite ? "★" : "☆";
      button.setAttribute("aria-label", nextFavorite ? "お気に入り解除" : "お気に入り登録");
      onToggleFavorite(storeId);
    };
  }, [onToggleFavorite]);

  const bindNavigateButton = useCallback((popup: maplibregl.Popup, store: StoreWithScore) => {
    const popupEl = popup.getElement();
    const button = popupEl?.querySelector<HTMLButtonElement>(`button[data-nav-store-id="${store.id}"]`);
    if (!button) return;

    button.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();

      const directionUrl = `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}&travelmode=walking`;
      window.open(directionUrl, "_blank", "noopener,noreferrer");
    };
  }, []);

  const applyPopupContent = useCallback((
    popup: maplibregl.Popup,
    store: StoreWithScore,
    favorite: boolean
  ) => {
    popup.setHTML(
      `
        <div style="display:flex;align-items:center;gap:8px;">
          <strong>${escapeHtml(store.name)}</strong>
          <button
            data-fav-store-id="${store.id}"
            style="border:1.5px solid #111;border-radius:9999px;background:#fff;padding:2px 6px;cursor:pointer;font-weight:700;line-height:1;"
            aria-label="${favorite ? "お気に入り解除" : "お気に入り登録"}"
          >
            ${favorite ? "★" : "☆"}
          </button>
        </div>
        <div>${escapeHtml(store.genre)}</div>
        <button
          data-nav-store-id="${store.id}"
          style="margin-top:8px;border:1.5px solid #111;border-radius:10px;background:#ff6b35;color:#fff;padding:6px 10px;cursor:pointer;font-weight:800;"
        >
          ここにいく
        </button>
      `
    );

    if (popup.isOpen()) {
      bindFavoriteButton(popup, store.id, favorite);
      bindNavigateButton(popup, store);
      return;
    }
    popup.once("open", () => {
      bindFavoriteButton(popup, store.id, favorite);
      bindNavigateButton(popup, store);
    });
  }, [bindFavoriteButton, bindNavigateButton]);

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
    [...stores]
      .sort((a, b) => b.normalizedScore - a.normalizedScore)
      .slice(0, 3)
      .forEach((store, index) => {
        rankMap.set(store.id, (index + 1) as 1 | 2 | 3);
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

      markersRef.current.set(store.id, {
        marker,
        root,
        popup,
        lng: store.lng,
        lat: store.lat,
        markerSignature,
        popupSignature,
      });
    });
  }, [stores, favoriteIds, applyPopupContent]);

  return <div ref={mapContainer} className="map-container" />;
}
