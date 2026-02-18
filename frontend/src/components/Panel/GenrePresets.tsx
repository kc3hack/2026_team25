// ============================================
// GenrePresets.tsx — ジャンルフィルター + 好みチップ
// 【B専任】このファイルは B のみが編集する
// ============================================

import type { Weights } from "../../types";

interface GenrePresetsProps {
  selectedGenre: string | null;
  onGenreSelect: (genre: string | null) => void;
  onPreferenceSelect: (weights: Weights) => void;
}

const GENRES = [
  "すべて",
  "ラーメン",
  "カフェ",
  "和食",
  "中華",
  "イタリアン",
  "カレー",
  "寿司",
  "焼肉",
  "居酒屋",
] as const;

const PREFERENCES: { label: string; weights: Weights }[] = [
  {
    label: "提供が早い",
    weights: { price: 50, access: 50, rating: 30, vibe: 10, speed: 95 },
  },
  {
    label: "がっつり",
    weights: { price: 70, access: 50, rating: 50, vibe: 10, speed: 60 },
  },
];

export default function GenrePresets({
  selectedGenre,
  onGenreSelect,
  onPreferenceSelect,
}: GenrePresetsProps) {
  return (
    <div className="flex flex-col gap-3 px-4 py-2">
      <h2 className="text-sm font-bold text-gray-700">ジャンル・こだわり</h2>

      <div className="flex flex-wrap gap-2">
        {GENRES.map((genre) => {
          const isAll = genre === "すべて";
          const isActive = isAll
            ? selectedGenre === null
            : selectedGenre === genre;

          return (
            <button
              key={genre}
              type="button"
              onClick={() => onGenreSelect(isAll ? null : genre)}
              className={`min-h-[36px] cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
                isActive
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:bg-emerald-50"
              }`}
            >
              {genre}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {PREFERENCES.map((pref) => (
          <button
            key={pref.label}
            type="button"
            onClick={() => onPreferenceSelect(pref.weights)}
            className="min-h-[36px] cursor-pointer rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors duration-200 hover:border-amber-400 hover:bg-amber-100"
          >
            {pref.label}
          </button>
        ))}
      </div>
    </div>
  );
}
