import type { StoreWithScore } from "../../types";

type Props = {
    favoriteStores: StoreWithScore[];
    onOpenStore: (store: StoreWithScore) => void;
    onUnfavorite: (storeId: string) => void;
};

export default function ProfileView({ favoriteStores, onOpenStore, onUnfavorite }: Props) {
    return (
        <div className="flex h-full flex-col bg-[#FDFBF7]">
            <header className="border-b-2 border-black bg-[#FDFBF7] px-4 pt-4 pb-3">
                <h2 className="text-base leading-snug font-black text-black">プロフィール</h2>
                <p className="text-xs font-semibold text-gray-600">お気に入りリスト</p>
            </header>

            <div className="flex-1 overflow-y-auto px-3 py-3">
                <div className="mx-auto flex max-w-2xl flex-col gap-2">
                    {favoriteStores.length === 0 ? (
                        <div className="rounded-2xl border-2 border-dashed border-black bg-white p-4 text-center text-sm font-semibold text-gray-600">
                            お気に入りはまだありません。
                        </div>
                    ) : (
                        favoriteStores.map((store, index) => (
                            <div
                                key={store.id}
                                className="rounded-2xl border-2 border-black bg-white px-3 py-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                            >
                                <div className="mb-2 flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-black text-black">
                                            {index + 1}. {store.name}
                                        </p>
                                        <p className="text-xs font-semibold text-gray-600">{store.genre}</p>
                                    </div>
                                    <span className="shrink-0 rounded-md bg-black px-2 py-0.5 text-[10px] font-black text-white">
                                        {(store.normalizedScore * 100).toFixed(0)}pt
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onOpenStore(store)}
                                        className="flex-1 rounded-xl border-2 border-black bg-[#FF6B35] px-3 py-2 text-xs font-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                    >
                                        地図で見る
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onUnfavorite(store.id)}
                                        className="rounded-xl border-2 border-black bg-white px-3 py-2 text-xs font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                    >
                                        解除
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
