// ============================================
// PresetButtons.tsx — モードプリセットカード
// 【B専任】このファイルは B のみが編集する
// ============================================

import type { Weights } from "../../types";
import { PRESETS } from "../../types";
import { Heart, Wallet, Zap } from "lucide-react";

interface PresetButtonsProps {
  onSelect: (weights: Weights) => void;
  onReset?: () => void;
}

const PRESET_CARDS: {
  name: string;
  label: string;
  Icon: typeof Wallet;
}[] = [
  { name: "金欠モード", label: "金欠", Icon: Wallet },
  { name: "デートモード", label: "デート", Icon: Heart },
  { name: "急ぎモード", label: "急ぎ", Icon: Zap },
];

export default function PresetButtons({ onSelect, onReset }: PresetButtonsProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-bold tracking-wide text-slate-500">モード選択</p>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-11 items-center rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
          >
            リセット
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {PRESET_CARDS.map(({ name, label, Icon }) => {
          const weights = PRESETS[name];
          if (!weights) return null;

          return (
            <button
              key={name}
              type="button"
              onClick={() => onSelect(weights)}
              className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-3xl border-[3px] border-black bg-white px-2 text-center shadow-[0_6px_0_0_rgba(0,0,0,1)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0_3px_0_0_rgba(0,0,0,1)]"
            >
              <Icon size={22} strokeWidth={3} className="text-black" />
              <span className="mt-2 text-sm font-black leading-tight text-black">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
