// ============================================
// StoreCard.tsx — 店舗情報カード（ピン選択時に表示）
// 【B専任】このファイルは B のみが編集する
// ============================================

import { useEffect, useRef, useState } from "react";
import { WEIGHT_LABELS } from "../../types";
import type { StoreWithScore } from "../../types";
import {
  TRAVEL_MODE_OPTIONS,
  type TravelMode,
  openDirectionsInGoogleMaps,
} from "../../lib/navigation";

interface StoreCardProps {
  store: StoreWithScore | null;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onClose?: () => void;
}

const SCORE_KEYS = [
  "price_score",
  "access_score",
  "rating_score",
  "vibe_score",
  "speed_score",
] as const;

const SCORE_TO_LABEL: Record<(typeof SCORE_KEYS)[number], keyof typeof WEIGHT_LABELS> = {
  price_score: "price",
  access_score: "access",
  rating_score: "rating",
  vibe_score: "vibe",
  speed_score: "speed",
};

/** 五角形の各頂点の角度（上から時計回り） */
const AXIS_COUNT = 5;
const ANGLE_OFFSET = -Math.PI / 2; // 上始まり

function polarToXY(cx: number, cy: number, r: number, i: number) {
  const angle = ANGLE_OFFSET + (2 * Math.PI * i) / AXIS_COUNT;
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

function buildPolygonPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: AXIS_COUNT }, (_, i) => {
    const p = polarToXY(cx, cy, r, i);
    return `${p.x},${p.y}`;
  }).join(" ");
}

function buildDataPoints(
  cx: number,
  cy: number,
  maxR: number,
  values: readonly number[]
): string {
  return values
    .map((v, i) => {
      const p = polarToXY(cx, cy, maxR * v, i);
      return `${p.x},${p.y}`;
    })
    .join(" ");
}

const CHART_SIZE = 200;
const CENTER = CHART_SIZE / 2;
const MAX_R = CHART_SIZE / 2 - 30;
const GRID_STEPS = [0.25, 0.5, 0.75, 1.0];
const SVG_PAD = 28;
const SVG_VIEWBOX_MIN = -SVG_PAD;
const SVG_VIEWBOX_SIZE = CHART_SIZE + SVG_PAD * 2;

function formatWalkDuration(seconds?: number): string | null {
  if (seconds === undefined || seconds === null || seconds < 0) return null;
  const mins = Math.round(seconds / 60);
  return `${mins}分`;
}

function formatWalkDistance(meters?: number): string | null {
  if (meters === undefined || meters === null || meters < 0) return null;
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export default function StoreCard({
  store,
  isFavorite = false,
  onToggleFavorite,
  onClose,
}: StoreCardProps) {
  const [travelMode, setTravelMode] = useState<TravelMode>("walking");
  const [isNavigating, setIsNavigating] = useState(false);
  const [isTravelModeMenuOpen, setIsTravelModeMenuOpen] = useState(false);
  const controlsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isTravelModeMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (controlsRef.current && !controlsRef.current.contains(target)) {
        setIsTravelModeMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsTravelModeMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isTravelModeMenuOpen]);
  const handleNavigate = async () => {
    if (!store || isNavigating) return;
    setIsNavigating(true);
    try {
      await openDirectionsInGoogleMaps({
        destination: { lat: store.lat, lng: store.lng },
        mode: travelMode,
      });
    } finally {
      setIsNavigating(false);
    }
  };

  if (!store) return null;

  const values = SCORE_KEYS.map((k) => store[k]);
  const travelModeSelectId = `travel-mode-${store.id}`;
  const selectedTravelModeLabel =
    TRAVEL_MODE_OPTIONS.find((option) => option.value === travelMode)?.label ?? "徒歩";
  const walkDurationLabel = formatWalkDuration(store.walk_duration_sec);
  const walkDistanceLabel = formatWalkDistance(store.walk_distance_m);
  const walkSummary =
    walkDurationLabel || walkDistanceLabel
      ? `KRP起点の徒歩目安: ${walkDurationLabel ?? ""}${
        walkDurationLabel && walkDistanceLabel ? " / " : ""
      }${walkDistanceLabel ?? ""}`
      : null;
  const scorePointLabel = `${(store.normalizedScore * 100).toFixed(0)}pt`;

  return (
    <div className="rounded-2xl border-2 border-black bg-[#FDFBF7] p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-600">{store.genre}</p>
          <div className="flex items-center gap-2">
            <h3 className="truncate text-lg font-black text-black">{store.name}</h3>
            {walkSummary && (
              <span className="truncate text-sm font-semibold text-slate-700">{walkSummary}</span>
            )}
            {onToggleFavorite && (
              <button
                onClick={onToggleFavorite}
                aria-label={isFavorite ? "お気に入り解除" : "お気に入り登録"}
                className={`inline-flex h-11 min-w-11 shrink-0 items-center justify-center rounded-full border-2 border-black bg-white px-2 py-0.5 text-base leading-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-[transform,box-shadow] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:text-red-500 ${isFavorite ? "text-red-500" : "text-black"}`}
              >
                {isFavorite ? "♥" : "♡"}
              </button>
            )}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="店舗詳細を閉じる"
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-full border-2 border-black bg-white px-2 text-sm font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          >
            ×
          </button>
        )}
      </div>

      <div className="mt-3 flex items-start gap-4">
        <div className="relative shrink-0">
          <span
            className="absolute right-2 top-2 z-10 rounded-md bg-slate-900 px-2 py-1 text-xs font-bold text-white"
          >
            {scorePointLabel}
          </span>
          <svg
            width={CHART_SIZE}
            height={CHART_SIZE}
            viewBox={`${SVG_VIEWBOX_MIN} ${SVG_VIEWBOX_MIN} ${SVG_VIEWBOX_SIZE} ${SVG_VIEWBOX_SIZE}`}
          >
            {GRID_STEPS.map((step) => (
              <polygon
                key={step}
                points={buildPolygonPoints(CENTER, CENTER, MAX_R * step)}
                fill="none"
                stroke="#d1d5db"
                strokeWidth={1}
              />
            ))}

            {SCORE_KEYS.map((_, i) => {
              const p = polarToXY(CENTER, CENTER, MAX_R, i);
              return (
                <line
                  key={i}
                  x1={CENTER}
                  y1={CENTER}
                  x2={p.x}
                  y2={p.y}
                  stroke="#d1d5db"
                  strokeWidth={1}
                />
              );
            })}

            <polygon
              points={buildDataPoints(CENTER, CENTER, MAX_R, values)}
              fill="rgba(255, 107, 53, 0.25)"
              stroke="#ff6b35"
              strokeWidth={2}
            />

            {values.map((v, i) => {
              const p = polarToXY(CENTER, CENTER, MAX_R * v, i);
              return <circle key={i} cx={p.x} cy={p.y} r={4} fill="#ff6b35" />;
            })}

            {SCORE_KEYS.map((key, i) => {
              const p = polarToXY(CENTER, CENTER, MAX_R + 18, i);
              const textAnchor =
                p.x < CENTER - 18 ? "end" : p.x > CENTER + 18 ? "start" : "middle";
              return (
                <text
                  key={key}
                  x={p.x}
                  y={p.y}
                  textAnchor={textAnchor}
                  dominantBaseline="central"
                  className="fill-gray-600 text-[12px] font-bold"
                >
                  {WEIGHT_LABELS[SCORE_TO_LABEL[key]]}
                </text>
              );
            })}
          </svg>
        </div>

        <div ref={controlsRef} className="min-w-0 flex-1 grid gap-2">
          <label htmlFor={travelModeSelectId} className="text-xs font-bold text-slate-600">
            移動手段
          </label>
          <div className="relative">
            <button
              id={travelModeSelectId}
              type="button"
              aria-haspopup="listbox"
              aria-expanded={isTravelModeMenuOpen}
              onClick={() => setIsTravelModeMenuOpen((prev) => !prev)}
              className="h-11 w-full rounded-lg border-2 border-black bg-white px-3 py-2 text-left text-sm font-semibold text-black"
            >
              <span>{selectedTravelModeLabel}</span>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">▾</span>
            </button>

            {isTravelModeMenuOpen && (
              <div
                role="listbox"
                className="mt-2 overflow-hidden rounded-lg border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              >
                {TRAVEL_MODE_OPTIONS.map((option) => {
                  const active = option.value === travelMode;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        setTravelMode(option.value);
                        setIsTravelModeMenuOpen(false);
                      }}
                      className={`block h-10 w-full px-4 text-left text-sm font-semibold ${
                        active
                          ? "bg-orange-100 text-black"
                          : "bg-white text-black hover:bg-slate-100"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleNavigate}
            disabled={isNavigating}
            className="h-11 w-full rounded-xl border-2 border-black bg-[#FF6B35] px-4 py-2 text-sm font-black text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            {isNavigating ? "準備中..." : "現在地から道案内"}
          </button>
        </div>
      </div>
    </div>
  );
}
