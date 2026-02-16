import { useEffect, useMemo, useRef, useState } from "react";
import MapView from "./MapView";
import type { StoreWithScore } from "../../types";

// simple color interpolation fallback (red->yellow->green) using stops
function interpolateHex(score: number): string {
  const stops = [
    { t: 0.0, hex: "#ef4444" },
    { t: 0.5, hex: "#eab308" },
    { t: 1.0, hex: "#22c55e" },
  ];
  if (score <= 0) return stops[0].hex;
  if (score >= 1) return stops[2].hex;
  // linear between stops
  const [a, b] = score < 0.5 ? [stops[0], stops[1]] : [stops[1], stops[2]];
  const localT = score < 0.5 ? score / 0.5 : (score - 0.5) / 0.5;
  const ah = parseInt(a.hex.slice(1), 16);
  const bh = parseInt(b.hex.slice(1), 16);
  const ar = (ah >> 16) & 0xff;
  const ag = (ah >> 8) & 0xff;
  const ab = ah & 0xff;
  const br = (bh >> 16) & 0xff;
  const bg = (bh >> 8) & 0xff;
  const bb = bh & 0xff;
  const rr = Math.round(ar + (br - ar) * localT);
  const rg = Math.round(ag + (bg - ag) * localT);
  const rb = Math.round(ab + (bb - ab) * localT);
  return `#${((rr << 16) | (rg << 8) | rb).toString(16).padStart(6, "0")}`;
}

export default function MapPlayground() {
  const [running, setRunning] = useState(true);
  const tRef = useRef(0);

  const baseStores = useMemo<StoreWithScore[]>(() => {
    const center = { lat: 34.9937, lng: 135.7467 };
    return [
      { id: "s1", name: "京都ラーメン太郎", lat: center.lat + 0.0003, lng: center.lng + 0.0003, genre: "ラーメン", price_score: 0.9, access_score: 0.8, rating_score: 0.7, vibe_score: 0.3, speed_score: 0.9, normalizedScore: 0.8, pinSize: 8 + 24 * 0.8, pinColor: "#22c55e", visible: true },
      { id: "s2", name: "お得な定食屋", lat: center.lat - 0.00025, lng: center.lng - 0.0002, genre: "定食", price_score: 0.95, access_score: 0.6, rating_score: 0.5, vibe_score: 0.2, speed_score: 0.8, normalizedScore: 0.6, pinSize: 8 + 24 * 0.6, pinColor: "#eab308", visible: true },
      { id: "s3", name: "カフェ・ノア", lat: center.lat + 0.00015, lng: center.lng - 0.00035, genre: "カフェ", price_score: 0.4, access_score: 0.7, rating_score: 0.85, vibe_score: 0.9, speed_score: 0.4, normalizedScore: 0.72, pinSize: 8 + 24 * 0.72, pinColor: "#84cc16", visible: true },
      { id: "s4", name: "駅前スピード弁当", lat: center.lat - 0.0004, lng: center.lng + 0.0001, genre: "弁当", price_score: 0.7, access_score: 0.95, rating_score: 0.3, vibe_score: 0.1, speed_score: 0.98, normalizedScore: 0.62, pinSize: 8 + 24 * 0.62, pinColor: "#eab308", visible: true },
      { id: "s5", name: "小さな割烹", lat: center.lat + 0.00045, lng: center.lng - 0.00005, genre: "和食", price_score: 0.2, access_score: 0.3, rating_score: 0.95, vibe_score: 0.95, speed_score: 0.2, normalizedScore: 0.58, pinSize: 8 + 24 * 0.58, pinColor: "#eab308", visible: true },
    ];
  }, []);

  const [stores, setStores] = useState<StoreWithScore[]>(baseStores);

  // animate normalizedScore with sine waves to simulate slider changes
  useEffect(() => {
    let rafId: number | null = null;
    function step(dt: number) {
      if (!running) return;
      tRef.current += dt / 1000;
      const t = tRef.current;
      setStores((prev) =>
        prev.map((s, i) => {
          const phase = i * 0.7;
          const v = 0.5 + 0.5 * Math.sin(t * (0.6 + i * 0.15) + phase);
          const normalized = Math.max(0, Math.min(1, v));
          return {
            ...s,
            normalizedScore: normalized,
            pinSize: 8 + 24 * normalized,
            pinColor: interpolateHex(normalized),
            visible: normalized >= 0.3,
          };
        })
      );
      rafId = requestAnimationFrame((now) => step(16));
    }
    rafId = requestAnimationFrame((now) => step(16));
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [running]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div style={{ position: "absolute", zIndex: 20, left: 12, top: 12 }}>
        <button onClick={() => setRunning((r) => !r)} style={{ marginRight: 8 }}>
          {running ? "Pause" : "Resume"}
        </button>
        <button onClick={() => setStores(baseStores)}>Reset</button>
      </div>
      <MapView stores={stores} />
    </div>
  );
}
