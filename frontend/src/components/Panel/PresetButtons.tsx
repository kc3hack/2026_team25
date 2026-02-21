// ============================================
// PresetButtons.tsx — モードプリセットカード
// 【B専任】このファイルは B のみが編集する
// ============================================

import type { Weights } from "../../types";
import { PRESETS } from "../../types";
import { Heart, Wallet, Zap } from "lucide-react";

interface PresetButtonsProps {
  onSelect: (weights: Weights) => void;
  activePresetName?: string | null;
}

const PRESET_CARDS: {
  name: string;
  label: string;
  emoji: string;
  Icon: typeof Wallet;
}[] = [
  { name: "金欠モード", label: "金欠", emoji: "😱", Icon: Wallet },
  { name: "デートモード", label: "デート", emoji: "💖", Icon: Heart },
  { name: "急ぎモード", label: "急ぎ", emoji: "💨", Icon: Zap },
];

export default function PresetButtons({ onSelect, activePresetName }: PresetButtonsProps) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {PRESET_CARDS.map(({ name, label, emoji, Icon }) => {
          const weights = PRESETS[name];
          if (!weights) return null;
          const isActive = activePresetName === name;

          return (
            <button
              key={name}
              type="button"
              onClick={() => onSelect(weights)}
              className={`flex h-24 cursor-pointer flex-col items-center justify-center rounded-3xl border-[3px] border-black bg-white px-2 text-center transition-all duration-150 ${
                isActive
                  ? "translate-y-0.5 shadow-[0_0_0_3px_rgba(15,23,42,0.2),0_3px_0_0_rgba(0,0,0,1)]"
                  : "shadow-[0_6px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[0_8px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0_3px_0_0_rgba(0,0,0,1)]"
              }`}
            >
              <Icon size={22} strokeWidth={3} className="text-black" />
              <span className="mt-2 text-sm font-black leading-tight text-black">
                {label}
                <span className="ml-0.5 text-xs">{emoji}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
