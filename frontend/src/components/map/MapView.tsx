import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "../../styles/map.css";
import type { StoreWithScore } from "../../types";

/** KRP（京都リサーチパーク）の座標 */
const KRP_CENTER = { lng: 135.7467, lat: 34.9937 };
const DEFAULT_ZOOM = 15;

interface MapViewProps {
  stores?: StoreWithScore[];
}

export default function MapView({ stores = [] }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // 地図の初期化
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [KRP_CENTER.lng, KRP_CENTER.lat],
      zoom: DEFAULT_ZOOM,
    });

    try {
      mapRef.current.addControl(new maplibregl.NavigationControl(), "top-right");
    } catch (e) {
      // ignore if control not available in some envs
    }

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

    stores.forEach((store) => {
      const el = document.createElement("div");
      el.className = `map-pin ${store.visible ? "map-pin--visible" : "map-pin--hidden"}`;
      el.style.width = `${store.pinSize}px`;
      el.style.height = `${store.pinSize}px`;
      el.style.backgroundColor = store.pinColor;

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

    // map のサイズ調整（外部でコンテナサイズが変わったとき用）
    mapRef.current.resize();
  }, [stores]);

  return <div ref={mapContainer} className="map-container" style={{ width: "100%", height: "100%" }} />;
}
