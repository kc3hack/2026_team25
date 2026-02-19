// ============================================
// BottomNav.tsx — モバイル用ボトムナビゲーション
// 【B専任】このファイルは B のみが編集する
// ============================================

import { Home, Map, MessageCircle } from "lucide-react";
import type { ComponentType } from "react";

export type Tab = "home" | "map" | "chat";

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TABS: ReadonlyArray<{
  id: Tab;
  label: string;
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>;
}> = [
  { id: "home", label: "ホーム", Icon: Home },
  { id: "map", label: "地図", Icon: Map },
  { id: "chat", label: "チャット", Icon: MessageCircle },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="flex h-14 shrink-0 border-t border-border-subtle bg-dark-surface md:hidden">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            aria-label={tab.label}
            aria-current={isActive ? "page" : undefined}
            onClick={() => onTabChange(tab.id)}
            className={`flex min-h-[44px] flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 text-xs transition-colors duration-200 ${
              isActive
                ? "font-semibold text-lime-accent"
                : "text-text-muted"
            }`}
          >
            <tab.Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
