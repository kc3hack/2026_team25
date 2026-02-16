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
      <h2 className="text-lg font-bold">こだわりスライダー</h2>
      {(Object.keys(WEIGHT_LABELS) as (keyof Weights)[]).map((key) => (
        <div key={key} className="flex flex-col gap-1">
          <label className="flex justify-between text-sm font-medium">
            <span>{WEIGHT_LABELS[key]}</span>
            <span className="text-gray-500">{weights[key]}</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={weights[key]}
            onChange={(e) => onChange(key, Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full accent-emerald-500"
            style={{
              background: `linear-gradient(to right, #10b981 0%, #10b981 ${weights[key]}%, #e5e7eb ${weights[key]}%, #e5e7eb 100%)`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
