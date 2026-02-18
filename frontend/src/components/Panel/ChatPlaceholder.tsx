// ============================================
// ChatPlaceholder.tsx — チャットタブのプレースホルダー
// 【B専任】このファイルは B のみが編集する
// ============================================

import { MessageCircle } from "lucide-react";

export default function ChatPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-gray-50 p-8">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
        <MessageCircle size={36} className="text-emerald-600" />
      </div>
      <h2 className="text-xl font-bold text-gray-700">AIチャット</h2>
      <p className="text-center text-sm text-gray-500">
        AIがあなたの好みに合ったお店を提案します。
        <br />
        近日公開予定です。
      </p>
    </div>
  );
}
