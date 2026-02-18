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
        <div key={key} className="rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <label className="grid grid-cols-[1fr_auto_1fr] items-center text-sm font-black">
            <span className="text-center text-black">{DISPLAY_LABELS[key]}</span>
            <span className="min-w-10 rounded-md border border-black bg-black px-1.5 py-0.5 text-center tabular-nums text-xs text-white">
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
            className="slider-custom mt-2 h-[8px] w-full cursor-pointer appearance-none rounded-full border border-black"
            style={{
              background: `linear-gradient(to right, #BEEF9E ${weights[key]}%, #f3f4f6 ${weights[key]}%)`,
            }}
          />
          <div className="mt-2 grid grid-cols-2 text-xs font-semibold text-gray-500">
            <span className="text-left">{DIRECTION_LABELS[key].left}</span>
            <span className="text-right">{DIRECTION_LABELS[key].right}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
