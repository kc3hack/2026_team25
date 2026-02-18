// ============================================
// SliderGroup.tsx — 5本のスライダーUI
// 【B専任】このファイルは B のみが編集する
// ============================================

import type { Weights } from "../../types";
import { WEIGHT_LABELS } from "../../types";

const DISPLAY_LABELS: Record<keyof Weights, string> = {
  price: "価格",
  access: "立地",
  rating: "評判",
  vibe: "雰囲気",
  speed: "速度",
};

const DIRECTION_LABELS: Record<keyof Weights, { left: string; right: string }> = {
  price: { left: "安い", right: "高い" },
  access: { left: "遠い", right: "近い" },
  rating: { left: "低い", right: "高い" },
  vibe: { left: "静か", right: "華やか" },
  speed: { left: "遅い", right: "速い" },
};

interface SliderGroupProps {
  weights: Weights;
  onChange: (key: keyof Weights, value: number) => void;
}

export default function SliderGroup({ weights, onChange }: SliderGroupProps) {
  return (
    <div className="flex flex-col gap-4 p-4">
      {(Object.keys(WEIGHT_LABELS) as (keyof Weights)[]).map((key) => (
        <div key={key} className="flex flex-col gap-2">
          <label className="grid grid-cols-[1fr_auto_1fr] items-center text-sm font-medium">
            <span className="text-center">{DISPLAY_LABELS[key]}</span>
            <span className="min-w-10 text-center tabular-nums text-gray-500">
              {weights[key]}
            </span>
            <span />
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={weights[key]}
            onChange={(e) => onChange(key, Number(e.target.value))}
            className="slider-custom h-[5px] w-full cursor-pointer appearance-none rounded-full"
            style={{
              background: `linear-gradient(to right, #34d399 ${weights[key]}%, #e5e7eb ${weights[key]}%)`,
            }}
          />
          <div className="grid grid-cols-2 text-xs text-gray-400">
            <span className="text-left">{DIRECTION_LABELS[key].left}</span>
            <span className="text-right">{DIRECTION_LABELS[key].right}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
