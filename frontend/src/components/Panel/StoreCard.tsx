// ============================================
// StoreCard.tsx — 店舗情報カード（ピン選択時に表示）
// 【B専任】このファイルは B のみが編集する
// ============================================

import type { StoreWithScore } from "../../types";
import { WEIGHT_LABELS } from "../../types";

interface StoreCardProps {
  store: StoreWithScore | null;
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

const CHART_SIZE = 160;
const CENTER = CHART_SIZE / 2;
const MAX_R = CHART_SIZE / 2 - 24;
const GRID_STEPS = [0.25, 0.5, 0.75, 1.0];

export default function StoreCard({ store, onClose }: StoreCardProps) {
  if (!store) return null;

  const values = SCORE_KEYS.map((k) => store[k]);

  return (
    <div className="rounded-2xl border-2 border-black bg-[#FDFBF7] p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-black text-black">{store.name}</h3>
          <p className="text-sm font-semibold text-gray-600">{store.genre}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-full border-2 border-black bg-white px-2 text-sm font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          >
            x
          </button>
        )}
      </div>

      <div className="mt-2 text-sm">
        <span className="font-black text-black">総合スコア: </span>
        <span
          style={{ color: store.pinColor }}
          className="rounded-md border border-black bg-white px-2 py-0.5 text-lg font-black"
        >
          {(store.normalizedScore * 100).toFixed(0)}pt
        </span>
      </div>

      {/* --- レーダーチャート（五角形） --- */}
      <div className="mt-3 flex justify-center">
        <svg width={CHART_SIZE} height={CHART_SIZE} viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}>
          {/* グリッド線 */}
          {GRID_STEPS.map((step) => (
            <polygon
              key={step}
              points={buildPolygonPoints(CENTER, CENTER, MAX_R * step)}
              fill="none"
              stroke="#d1d5db"
              strokeWidth={1}
            />
          ))}

          {/* 軸線 */}
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

          {/* データ領域 */}
          <polygon
            points={buildDataPoints(CENTER, CENTER, MAX_R, values)}
            fill="rgba(255, 107, 53, 0.25)"
            stroke="#ff6b35"
            strokeWidth={2}
          />

          {/* データ頂点 */}
          {values.map((v, i) => {
            const p = polarToXY(CENTER, CENTER, MAX_R * v, i);
            return (
              <circle key={i} cx={p.x} cy={p.y} r={3} fill="#ff6b35" />
            );
          })}

          {/* ラベル */}
          {SCORE_KEYS.map((key, i) => {
            const p = polarToXY(CENTER, CENTER, MAX_R + 16, i);
            return (
              <text
                key={key}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-gray-600 text-[10px] font-bold"
              >
                {WEIGHT_LABELS[SCORE_TO_LABEL[key]]}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
