// ============================================
// MapView.tsx — 地図本体コンポーネント
// 【A専任】このファイルは A のみが編集する
// ============================================

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { StoreWithScore } from "../../types";
import { createPinElement } from "./MapMarker";
import "../../styles/map.css";

/** KRP（京都リサーチパーク）の座標 */
const KRP_CENTER = { lng: 135.7467, lat: 34.9937 };
const DEFAULT_ZOOM = 15;

interface MapViewProps {
  stores: StoreWithScore[];
}

export default function MapView({ stores }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // ダミーデータ（stores が空の場合に表示する）
  const dummyStores: StoreWithScore[] = [
    {
      id: "dummy_1",
      name: "京都ラーメン太郎",
      lat: KRP_CENTER.lat + 0.0006,
      lng: KRP_CENTER.lng - 0.0012,
      genre: "ラーメン",
      price_score: 0.9,
      access_score: 0.8,
      rating_score: 0.7,
      vibe_score: 0.3,
      speed_score: 0.9,
      normalizedScore: 0.85,
      pinSize: 8 + 24 * 0.85,
      pinColor: "#22c55e",
      visible: true,
    },
    {
      id: "dummy_2",
      name: "カフェ花",
      lat: KRP_CENTER.lat - 0.0008,
      lng: KRP_CENTER.lng + 0.0009,
      genre: "カフェ",
      price_score: 0.4,
      access_score: 0.6,
      rating_score: 0.9,
      vibe_score: 0.8,
      speed_score: 0.5,
      normalizedScore: 0.67,
      pinSize: 8 + 24 * 0.67,
      pinColor: "#84cc16",
      visible: true,
    },
    {
      id: "dummy_3",
      name: "お好み焼き三郎",
      lat: KRP_CENTER.lat + 0.0012,
      lng: KRP_CENTER.lng + 0.0004,
      genre: "お好み焼き",
      price_score: 0.7,
      access_score: 0.5,
      rating_score: 0.4,
      vibe_score: 0.2,
      speed_score: 0.6,
      normalizedScore: 0.52,
      pinSize: 8 + 24 * 0.52,
      pinColor: "#eab308",
      visible: true,
    },
    {
      id: "dummy_4",
      name: "定食まる",
      lat: KRP_CENTER.lat - 0.0010,
      lng: KRP_CENTER.lng - 0.0007,
      genre: "定食",
      price_score: 0.95,
      access_score: 0.4,
      rating_score: 0.3,
      vibe_score: 0.1,
      speed_score: 0.95,
      normalizedScore: 0.68,
      pinSize: 8 + 24 * 0.68,
      pinColor: "#f97316",
      visible: true,
    },
    {
      id: "dummy_5",
      name: "バー夜空",
      lat: KRP_CENTER.lat + 0.0003,
      lng: KRP_CENTER.lng + 0.0013,
      genre: "バー",
      price_score: 0.2,
      access_score: 0.7,
      rating_score: 0.8,
      vibe_score: 0.9,
      speed_score: 0.2,
      normalizedScore: 0.6,
      pinSize: 8 + 24 * 0.6,
      pinColor: "#eab308",
      visible: true,
    },
  ];

  // 地図の初期化
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [KRP_CENTER.lng, KRP_CENTER.lat],
      zoom: DEFAULT_ZOOM,
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // ピンの更新
  useEffect(() => {
    if (!mapRef.current) return;

    // 既存マーカーを全削除
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const source = stores && stores.length > 0 ? stores : dummyStores;

    source.forEach((store) => {
      const el = createPinElement(store);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([store.lng, store.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 15 }).setHTML(
            `<strong>${store.name}</strong><br/>${store.genre}`
          )
        )
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [stores]);

  return <div ref={mapContainer} className="map-container" />;
}
