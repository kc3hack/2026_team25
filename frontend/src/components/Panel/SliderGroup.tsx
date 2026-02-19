// ============================================
// SliderGroup.tsx — 5本のスライダーUI
// 【B専任】このファイルは B のみが編集する
// ============================================

import type { Weights } from "../../types";
import { WEIGHT_LABELS } from "../../types";

const DISPLAY_LABELS: Record<keyof Weights, string> = {
  price: "お財布事情",
  access: "歩ける距離",
  rating: "評判",
  vibe: "店内の雰囲気",
  speed: "提供スピード",
};

const DIRECTION_LABELS: Record<keyof Weights, { left: string; right: string }> = {
  price: { left: "リッチに", right: "安く済ませたい" },
  access: { left: "遠くても", right: "近くがいい" },
  rating: { left: "気にしない", right: "高評価のみ" },
  vibe: { left: "静かめ", right: "映え重視" },
  speed: { left: "まったり", right: "サクッと" },
};

const LABEL_EMOJI: Record<keyof Weights, string> = {
  price: "💸",
  access: "🚶",
  rating: "⭐",
  vibe: "✨",
  speed: "🚀",
};

const KNOB_EMOJI: Record<keyof Weights, string> = {
  price: "💰",
  access: "🏃",
  rating: "🧐",
  vibe: "🏠",
  speed: "🛵",
};

interface SliderGroupProps {
  weights: Weights;
  onChange: (key: keyof Weights, value: number) => void;
}

export default function SliderGroup({ weights, onChange }: SliderGroupProps) {
  return (
    <div className="flex flex-col gap-6">
      {(Object.keys(WEIGHT_LABELS) as (keyof Weights)[]).map((key) => (
        <div key={key}>
          <label className="mb-2 flex items-center justify-between text-sm font-black text-black">
            <span>
              {DISPLAY_LABELS[key]} {LABEL_EMOJI[key]}
            </span>
            <span className="rounded-xl bg-black px-2 py-1 text-xs font-black text-white">
              {weights[key]}%
            </span>
          </label>

          <div className="relative">
            <input
              type="range"
              min={0}
              max={100}
              value={weights[key]}
              onChange={(e) => onChange(key, Number(e.target.value))}
              className="slider-custom h-[10px] w-full cursor-pointer appearance-none rounded-full border-2 border-black"
              style={{
                background: `linear-gradient(to right, #000 0%, #000 ${weights[key]}%, #fff ${weights[key]}%, #fff 100%)`,
              }}
            />
            <span
              className="pointer-events-none absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-[12px]"
              style={{ left: `calc(${(weights[key] / 100).toFixed(4)} * (100% - 34px) + 17px)` }}
            >
              {KNOB_EMOJI[key]}
            </span>
          </div>

          <div className="mt-2 grid grid-cols-2 text-xs font-semibold text-slate-500">
            <span className="text-left">{DIRECTION_LABELS[key].left}</span>
            <span className="text-right">{DIRECTION_LABELS[key].right}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
