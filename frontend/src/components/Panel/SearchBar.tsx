// ============================================
// SearchBar.tsx — 検索バー (UIのみ)
// 【B専任】このファイルは B のみが編集する
// ============================================

import { Search } from "lucide-react";

interface SearchBarProps {
  className?: string;
  compact?: boolean;
}

export default function SearchBar({ className = "", compact = false }: SearchBarProps) {
  return (
    <div className={`w-full max-w-full overflow-hidden ${className}`}>
      <div className="flex w-full max-w-full items-center gap-2 rounded-2xl border-2 border-black bg-white px-4 py-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
        <Search size={compact ? 16 : 18} className="shrink-0 text-black" strokeWidth={2.5} />
        <input
          type="text"
          placeholder="お店やジャンルを検索..."
          disabled
          className={`min-w-0 flex-1 bg-transparent font-semibold text-gray-700 placeholder:text-gray-400 focus:outline-none ${
            compact ? "text-xs" : "text-sm"
          }`}
        />
      </div>
    </div>
  );
}
