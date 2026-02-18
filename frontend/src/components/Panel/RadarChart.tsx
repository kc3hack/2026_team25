// ============================================
// RadarChart.tsx — SVG五角形レーダーチャート
// 【B専任】このファイルは B のみが編集する
// ============================================

interface RadarChartProps {
  scores: { label: string; value: number }[];
  size?: number;
}

const GRID_LEVELS = [0.25, 0.5, 0.75, 1.0];

function polarToXY(
  cx: number,
  cy: number,
  radius: number,
  index: number,
  total: number
): [number, number] {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
}

function polygonPoints(
  cx: number,
  cy: number,
  radius: number,
  values: number[]
): string {
  return values
    .map((v, i) => {
      const [x, y] = polarToXY(cx, cy, radius * v, i, values.length);
      return `${x},${y}`;
    })
    .join(" ");
}

export default function RadarChart({ scores, size = 160 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size / 2 - 24;
  const total = scores.length;

  return (
    <svg width={size} height={size} className="mx-auto">
      {/* グリッド線 */}
      {GRID_LEVELS.map((level) => (
        <polygon
          key={level}
          points={polygonPoints(
            cx,
            cy,
            maxRadius * level,
            Array(total).fill(1) as number[]
          )}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={1}
        />
      ))}

      {/* 軸線 */}
      {scores.map((_, i) => {
        const [x, y] = polarToXY(cx, cy, maxRadius, i, total);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
        );
      })}

      {/* データポリゴン */}
      <polygon
        points={polygonPoints(
          cx,
          cy,
          maxRadius,
          scores.map((s) => s.value)
        )}
        fill="rgba(52, 211, 153, 0.25)"
        stroke="#10b981"
        strokeWidth={2}
      />

      {/* ラベル */}
      {scores.map((s, i) => {
        const [x, y] = polarToXY(cx, cy, maxRadius + 16, i, total);
        return (
          <text
            key={s.label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-gray-600 text-[10px] font-medium"
          >
            {s.label}
          </text>
        );
      })}
    </svg>
  );
}
