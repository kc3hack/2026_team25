// ============================================
// GenrePresets.tsx — ジャンルカードグリッド
// 【B専任】このファイルは B のみが編集する
// ============================================

interface GenrePresetsProps {
  selectedGenre: string | null;
  onGenreSelect: (genre: string | null) => void;
}

const GENRE_CARDS: { genre: string; gradient: string }[] = [
  { genre: "ラーメン", gradient: "from-red-500 to-red-600" },
  { genre: "カフェ", gradient: "from-teal-400 to-teal-600" },
  { genre: "和食", gradient: "from-emerald-500 to-emerald-700" },
  { genre: "中華", gradient: "from-orange-500 to-orange-600" },
  { genre: "イタリアン", gradient: "from-green-500 to-green-600" },
  { genre: "カレー", gradient: "from-yellow-500 to-amber-600" },
  { genre: "寿司", gradient: "from-sky-400 to-sky-600" },
  { genre: "焼肉", gradient: "from-rose-500 to-rose-700" },
  { genre: "居酒屋", gradient: "from-purple-500 to-purple-700" },
  { genre: "飲食店", gradient: "from-slate-500 to-slate-600" },
];

export default function GenrePresets({
  selectedGenre,
  onGenreSelect,
}: GenrePresetsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {GENRE_CARDS.map(({ genre, gradient }) => {
        const isActive = selectedGenre === genre;

        return (
          <button
            key={genre}
            type="button"
            onClick={() => onGenreSelect(isActive ? null : genre)}
            className={`relative flex h-24 cursor-pointer flex-col justify-end rounded-2xl bg-linear-to-br ${gradient} p-4 text-left shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98] ${
              isActive
                ? "ring-4 ring-emerald-300 ring-offset-2 shadow-[0_0_24px_rgba(52,211,153,0.65)]"
                : ""
            }`}
            aria-pressed={isActive}
            title={isActive ? "選択中（再タップで解除）" : "タップで選択"}
          >
            {isActive && (
              <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                選択中
              </span>
            )}
            <span className="text-base font-bold text-white">{genre}</span>
            {isActive && (
              <span className="mt-1 text-[11px] text-white/90">もう一度タップで解除</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
