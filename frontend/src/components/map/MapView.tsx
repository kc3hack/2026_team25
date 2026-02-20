// ============================================
// MapView.tsx — 地図本体コンポーネント
// 【A専任】このファイルは A のみが編集する
// ============================================

import { useEffect, useRef } from "react";
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
}

type RankTier = 1 | 2 | 3 | null;
type MarkerEntry = {
  marker: maplibregl.Marker;
  root: Root;
  signature: string;
  popupHtml: string;
  lng: number;
  lat: number;
};

function createMarkerSignature(store: StoreWithScore, rank: RankTier): string {
  return JSON.stringify({
    normalizedScore: store.normalizedScore,
    visible: store.visible,
    pinColor: store.pinColor,
    rank,
  });
}

function createPopupHtml(store: StoreWithScore): string {
  return `<strong>${store.name}</strong><br/>${store.genre}`;
}

export default function MapView({ stores }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, MarkerEntry>>(new Map());

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
      const rank = rankMap.get(store.id) ?? null;
      const popupHtml = createPopupHtml(store);
      const signature = createMarkerSignature(store, rank);
      const existing = markersRef.current.get(store.id);

      if (existing) {
        if (existing.lng !== store.lng || existing.lat !== store.lat) {
          existing.marker.setLngLat([store.lng, store.lat]);
          existing.lng = store.lng;
          existing.lat = store.lat;
        }

        if (existing.popupHtml !== popupHtml) {
          existing.marker.getPopup()?.setHTML(popupHtml);
          existing.popupHtml = popupHtml;
        }

        if (existing.signature !== signature) {
          existing.root.render(<MapMarker store={store} rank={rank} />);
          existing.signature = signature;
        }
        return;
      }

      const el = document.createElement("div");
      const root = createRoot(el);
      root.render(<MapMarker store={store} rank={rank} />);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([store.lng, store.lat])
        .setPopup(new maplibregl.Popup({ offset: 15 }).setHTML(popupHtml))
        .addTo(mapRef.current!);

      markersRef.current.set(store.id, {
        marker,
        root,
        signature,
        popupHtml,
        lng: store.lng,
        lat: store.lat,
      });
    });
  }, [stores]);

  return <div ref={mapContainer} className="map-container" />;
}
