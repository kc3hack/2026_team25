// ============================================
// PresetButtons.tsx — プリセット切替ボタン
// 【B専任】このファイルは B のみが編集する
// ============================================

import type { Weights } from "../../types";
import { PRESETS } from "../../types";

interface PresetButtonsProps {
  onSelect: (weights: Weights) => void;
}

const PRESET_STYLES: Record<string, string> = {
  "金欠モード": "bg-blue-500 hover:bg-blue-600 active:bg-blue-700",
  "デートモード": "bg-pink-500 hover:bg-pink-600 active:bg-pink-700",
  "急ぎモード": "bg-amber-500 hover:bg-amber-600 active:bg-amber-700",
};

export default function PresetButtons({ onSelect }: PresetButtonsProps) {
  return (
    <div className="flex flex-col gap-2 p-4">
      <h2 className="text-lg font-bold">プリセット</h2>
      <div className="flex gap-2">
        {Object.entries(PRESETS).map(([name, weights]) => (
          <button
            key={name}
            type="button"
            onClick={() => onSelect(weights)}
            className={`min-h-[44px] flex-1 cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md ${PRESET_STYLES[name] ?? "bg-gray-500 hover:bg-gray-600"}`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
