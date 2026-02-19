// ============================================
// PresetButtons.tsx — モードプリセットカード
// 【B専任】このファイルは B のみが編集する
// ============================================

import type { Weights } from "../../types";
import { PRESETS } from "../../types";

interface PresetButtonsProps {
  onSelect: (weights: Weights) => void;
  variant?: "card" | "list";
}

const PRESET_CARDS: { name: string; gradient: string; dot: string }[] = [
  { name: "金欠モード", gradient: "from-blue-500 to-blue-600", dot: "bg-blue-500" },
  { name: "デートモード", gradient: "from-pink-400 to-rose-500", dot: "bg-pink-500" },
  { name: "急ぎモード", gradient: "from-amber-400 to-orange-500", dot: "bg-amber-500" },
];

export default function PresetButtons({ onSelect, variant = "card" }: PresetButtonsProps) {
  if (variant === "list") {
    return (
      <div className="flex flex-col">
        {PRESET_CARDS.map(({ name, dot }) => {
          const weights = PRESETS[name];
          if (!weights) return null;

          return (
            <button
              key={name}
              type="button"
              onClick={() => onSelect(weights)}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-text-secondary transition-colors duration-150 hover:bg-dark-elevated hover:text-text-primary"
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
              <span className="font-medium">{name}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {PRESET_CARDS.map(({ name, gradient }) => {
        const weights = PRESETS[name];
        if (!weights) return null;

        return (
          <button
            key={name}
            type="button"
            onClick={() => onSelect(weights)}
            className={`flex h-24 cursor-pointer flex-col justify-end rounded-2xl bg-linear-to-br ${gradient} p-4 text-left shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98] border border-white/10`}
          >
            <span className="text-base font-bold text-white">{name}</span>
          </button>
        );
      })}
    </div>
  );
}
