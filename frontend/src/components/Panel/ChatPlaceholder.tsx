// ============================================
// ChatPlaceholder.tsx — チャットタブのプレースホルダー
// 【B専任】このファイルは B のみが編集する
// ============================================

export default function ChatPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-gray-50 p-8">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
        <span className="text-4xl">💬</span>
      </div>
      <h2 className="text-xl font-bold text-gray-700">AIチャット</h2>
      <p className="text-center text-sm text-gray-400">
        AIがあなたの好みに合ったお店を提案します。
        <br />
        近日公開予定です。
      </p>
    </div>
  );
}
