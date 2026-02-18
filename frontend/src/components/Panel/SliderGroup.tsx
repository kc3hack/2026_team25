// ============================================
// SliderGroup.tsx — 5本のスライダーUI
// 【B専任】このファイルは B のみが編集する
// ============================================

import type { Weights } from "../../types";
import { WEIGHT_LABELS } from "../../types";

interface SliderGroupProps {
  weights: Weights;
  onChange: (key: keyof Weights, value: number) => void;
}

export default function SliderGroup({ weights, onChange }: SliderGroupProps) {
  return (
    <div className="flex flex-col gap-4 p-4">
      {(Object.keys(WEIGHT_LABELS) as (keyof Weights)[]).map((key) => (
        <div key={key} className="flex flex-col gap-1">
          <label className="flex justify-between text-sm font-medium">
            <span>{WEIGHT_LABELS[key]}</span>
            <span className="min-w-10 text-right tabular-nums text-gray-500">
              {weights[key]}
            </span>
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
        </div>
      ))}
    </div>
  );
}
