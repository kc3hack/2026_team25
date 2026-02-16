// ============================================
// PresetButtons.tsx — プリセット切替ボタン
// 【B専任】このファイルは B のみが編集する
// ============================================

import type { Weights } from "../../types";
import { PRESETS } from "../../types";

interface PresetButtonsProps {
  onSelect: (weights: Weights) => void;
  onReset?: () => void;
}

const PRESET_STYLES: Record<string, string> = {
  "金欠モード": "bg-blue-500 hover:bg-blue-600",
  "デートモード": "bg-pink-500 hover:bg-pink-600",
  "急ぎモード": "bg-amber-500 hover:bg-amber-600",
};

export default function PresetButtons({ onSelect, onReset }: PresetButtonsProps) {
  return (
    <div className="flex flex-col gap-2 p-4">
      <h2 className="text-lg font-bold">プリセット</h2>
      <div className="flex gap-2">
        {Object.entries(PRESETS).map(([name, weights]) => (
          <button
            key={name}
            onClick={() => onSelect(weights)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold text-white transition-colors ${PRESET_STYLES[name] ?? "bg-gray-500"}`}
          >
            {name}
          </button>
        ))}
      </div>
      {onReset && (
        <button
          onClick={onReset}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-100"
        >
          リセット
        </button>
      )}
    </div>
  );
}
