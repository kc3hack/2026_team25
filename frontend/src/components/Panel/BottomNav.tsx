// ============================================
// BottomNav.tsx — モバイル用ボトムナビゲーション
// 【B専任】このファイルは B のみが編集する
// ============================================

import { Home, MessageCircle, UserRound } from "lucide-react";
import type { ComponentType } from "react";

export type Tab = "home" | "chat" | "profile";

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
    { id: "chat", label: "チャット", Icon: MessageCircle },
    { id: "profile", label: "プロフィール", Icon: UserRound },
  ];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="flex h-14 shrink-0 border-t-2 border-black bg-[#FDFBF7] pb-[env(safe-area-inset-bottom)] md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            aria-label={tab.label}
            aria-current={isActive ? "page" : undefined}
            onClick={() => onTabChange(tab.id)}
            className={`flex min-h-[44px] flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 text-xs transition-colors duration-200 ${isActive
                ? "font-black text-black"
                : "font-semibold text-gray-500"
              }`}
          >
            <tab.Icon size={20} strokeWidth={isActive ? 2.8 : 1.8} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
