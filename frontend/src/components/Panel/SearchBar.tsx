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
    <div className={className}>
      <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5">
        <Search size={compact ? 16 : 18} className="shrink-0 text-gray-400" />
        <input
          type="text"
          placeholder="お店やジャンルを検索..."
          disabled
          className={`w-full bg-transparent text-gray-500 placeholder:text-gray-400 focus:outline-none ${
            compact ? "text-xs" : "text-sm"
          }`}
        />
      </div>
    </div>
  );
}
