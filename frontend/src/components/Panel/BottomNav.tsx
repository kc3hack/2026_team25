// ============================================
// BottomNav.tsx — モバイル用ボトムナビゲーション
// 【B専任】このファイルは B のみが編集する
// ============================================

export type Tab = "home" | "map" | "chat";

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TABS: ReadonlyArray<{ id: Tab; label: string; icon: string }> = [
  { id: "home", label: "ホーム", icon: "🏠" },
  { id: "map", label: "地図", icon: "🗺️" },
  { id: "chat", label: "チャット", icon: "💬" },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="flex h-14 shrink-0 border-t border-gray-200 bg-white md:hidden">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
            activeTab === tab.id
              ? "font-semibold text-emerald-600"
              : "text-gray-400"
          }`}
        >
          <span className="text-lg">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
