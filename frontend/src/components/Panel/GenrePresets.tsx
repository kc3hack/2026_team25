// ============================================
// GenrePresets.tsx — ジャンルカードグリッド
// 【B専任】このファイルは B のみが編集する
// ============================================

interface GenrePresetsProps {
  selectedGenre: string | null;
  onGenreSelect: (genre: string | null) => void;
  variant?: "card" | "list";
}

const GENRE_CARDS: { genre: string; gradient: string; dot: string }[] = [
  { genre: "ラーメン", gradient: "from-red-500 to-red-600", dot: "bg-red-500" },
  { genre: "カフェ", gradient: "from-teal-400 to-teal-600", dot: "bg-teal-500" },
  { genre: "和食", gradient: "from-emerald-500 to-emerald-700", dot: "bg-emerald-600" },
  { genre: "中華", gradient: "from-orange-500 to-orange-600", dot: "bg-orange-500" },
  { genre: "イタリアン", gradient: "from-green-500 to-green-600", dot: "bg-green-500" },
  { genre: "カレー", gradient: "from-yellow-500 to-amber-600", dot: "bg-amber-500" },
  { genre: "寿司", gradient: "from-sky-400 to-sky-600", dot: "bg-sky-500" },
  { genre: "焼肉", gradient: "from-rose-500 to-rose-700", dot: "bg-rose-600" },
  { genre: "居酒屋", gradient: "from-purple-500 to-purple-700", dot: "bg-purple-600" },
  { genre: "飲食店", gradient: "from-slate-500 to-slate-600", dot: "bg-slate-500" },
];

export default function GenrePresets({
  selectedGenre,
  onGenreSelect,
  variant = "card",
}: GenrePresetsProps) {
  if (variant === "list") {
    return (
      <div className="flex flex-col">
        {GENRE_CARDS.map(({ genre, dot }) => {
          const isActive = selectedGenre === genre;
          return (
            <button
              key={genre}
              type="button"
              onClick={() => onGenreSelect(isActive ? null : genre)}
              className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150 ${
                isActive
                  ? "bg-lime-muted font-semibold text-lime-accent"
                  : "text-text-secondary hover:bg-dark-elevated hover:text-text-primary"
              }`}
              aria-pressed={isActive}
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
              <span className="flex-1 font-medium">{genre}</span>
              {isActive && (
                <span className="text-[10px] text-lime-accent/70">選択中</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {GENRE_CARDS.map(({ genre, gradient }) => {
        const isActive = selectedGenre === genre;

        return (
          <button
            key={genre}
            type="button"
            onClick={() => onGenreSelect(isActive ? null : genre)}
            className={`relative flex h-24 cursor-pointer flex-col justify-end rounded-2xl bg-linear-to-br ${gradient} p-4 text-left shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98] border border-white/10 ${
              isActive
                ? "ring-4 ring-lime-accent/60 ring-offset-2 ring-offset-dark-base shadow-[0_0_24px_rgba(194,245,66,0.5)]"
                : ""
            }`}
            aria-pressed={isActive}
            title={isActive ? "選択中（再タップで解除）" : "タップで選択"}
          >
            {isActive && (
              <span className="absolute right-2 top-2 rounded-full bg-dark-base/90 px-2 py-0.5 text-[10px] font-bold text-lime-accent">
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
