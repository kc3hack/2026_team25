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
        className={`transform rounded-t-[28px] border-2 border-b-0 border-black bg-[#FDFBF7] shadow-[0_-6px_0px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-in-out ${
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
          <div className="h-1.5 w-12 rounded-full bg-black" />
          <span className="text-sm font-black text-black">
            こだわりスライダー
          </span>
          {isOpen ? (
            <ChevronDown size={18} className="text-black" />
          ) : (
            <ChevronUp size={18} className="text-black" />
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
