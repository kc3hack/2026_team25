// ============================================
// SliderDrawer.tsx — 地図上のスライダードロワー
// 【B専任】このファイルは B のみが編集する
// ============================================

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import SliderGroup from "./SliderGroup";
import type { Weights } from "../../types";

interface SliderDrawerProps {
  weights: Weights;
  onChange: (key: keyof Weights, value: number) => void;
}

export default function SliderDrawer({ weights, onChange }: SliderDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute inset-x-0 bottom-0 z-20">
      <div
        className={`transform rounded-t-2xl bg-dark-surface shadow-[0_-4px_20px_rgba(0,0,0,0.4)] border-t border-border-subtle transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-y-0" : "translate-y-[calc(100%-48px)]"
        }`}
      >
        {/* ハンドルバー */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex w-full cursor-pointer items-center justify-center gap-2 px-4 py-3"
          aria-label={isOpen ? "スライダーを閉じる" : "スライダーを開く"}
          aria-expanded={isOpen}
        >
          <div className="h-1 w-10 rounded-full bg-lime-accent/40" />
          <span className="text-sm font-semibold text-text-primary">
            こだわりスライダー
          </span>
          {isOpen ? (
            <ChevronDown size={18} className="text-text-muted" />
          ) : (
            <ChevronUp size={18} className="text-text-muted" />
          )}
        </button>

        {/* スライダー本体 */}
        <div className="max-h-[50vh] overflow-y-auto pb-4">
          <SliderGroup weights={weights} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
