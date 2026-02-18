"""
fetch_stores.py — OpenStreetMap Overpass API で KRP周辺の飲食店を取得
APIキー不要・完全無料

出力:
  - backend/seeds/stores.json
  - frontend/src/lib/dummyStores.ts

使い方:
  python3 scripts/fetch_stores.py
"""

import json
import math
import random
import textwrap
import urllib.request
from pathlib import Path

# ============================================
# 設定
# ============================================

# KRP（京都リサーチパーク）の座標
KRP_LAT = 34.9937
KRP_LNG = 135.7467

# 検索範囲 (bounding box): KRP を中心に約1.5km四方
BBOX = (34.985, 135.735, 35.002, 135.758)

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# ジャンルマッピング: cuisine タグ → 日本語ジャンル
GENRE_MAP: dict[str, str] = {
    "ramen": "ラーメン",
    "noodles": "ラーメン",
    "sushi": "寿司",
    "japanese": "和食",
    "italian": "イタリアン",
    "pizza": "イタリアン",
    "chinese": "中華",
    "curry": "カレー",
    "indian": "カレー",
    "cafe": "カフェ",
    "coffee": "カフェ",
    "fast_food": "ファストフード",
    "burger": "ファストフード",
    "izakaya": "居酒屋",
    "korean": "韓国料理",
    "french": "フレンチ",
    "thai": "タイ料理",
    "vietnamese": "ベトナム料理",
    "spanish": "スペイン料理",
    "steak": "ステーキ",
    "seafood": "海鮮",
    "tempura": "天ぷら",
    "udon": "うどん",
    "soba": "そば",
    "yakitori": "焼き鳥",
    "yakiniku": "焼肉",
    "okonomiyaki": "お好み焼き",
    "takoyaki": "たこ焼き",
    "tonkatsu": "とんかつ",
    "gyudon": "牛丼",
    "bakery": "ベーカリー",
    "dessert": "スイーツ",
    "tea": "カフェ",
}

# ジャンル別スコアのデフォルト値 {genre: (price, vibe, speed)}
GENRE_SCORES: dict[str, tuple[float, float, float]] = {
    "ラーメン":       (0.85, 0.30, 0.90),
    "寿司":          (0.35, 0.75, 0.50),
    "和食":          (0.40, 0.80, 0.45),
    "イタリアン":     (0.35, 0.85, 0.40),
    "中華":          (0.70, 0.40, 0.75),
    "カレー":        (0.75, 0.55, 0.80),
    "カフェ":        (0.60, 0.85, 0.55),
    "ファストフード":  (0.90, 0.15, 0.95),
    "居酒屋":        (0.65, 0.50, 0.60),
    "韓国料理":      (0.60, 0.55, 0.65),
    "フレンチ":      (0.15, 0.95, 0.30),
    "タイ料理":      (0.70, 0.60, 0.70),
    "ベトナム料理":   (0.70, 0.60, 0.70),
    "焼肉":         (0.40, 0.55, 0.50),
    "焼き鳥":       (0.70, 0.50, 0.65),
    "牛丼":         (0.90, 0.15, 0.95),
    "ベーカリー":    (0.70, 0.70, 0.80),
    "スイーツ":      (0.55, 0.80, 0.60),
    "飲食店":       (0.60, 0.50, 0.60),
}

# デフォルトジャンル
DEFAULT_GENRE = "飲食店"


# ============================================
# ヘルパー関数
# ============================================

def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """2点間の距離 (km) を Haversine 公式で計算"""
    r = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lng / 2) ** 2
    )
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def classify_genre(tags: dict[str, str]) -> str:
    """OSM tags から日本語ジャンルを推定"""
    cuisine = tags.get("cuisine", "").lower()
    amenity = tags.get("amenity", "").lower()

    # cuisine タグの各値をチェック (セミコロン区切り対応)
    for part in cuisine.replace(";", ",").split(","):
        part = part.strip()
        if part in GENRE_MAP:
            return GENRE_MAP[part]

    # amenity フォールバック
    if amenity == "cafe":
        return "カフェ"
    if amenity == "fast_food":
        return "ファストフード"

    return DEFAULT_GENRE


def compute_scores(
    genre: str, dist_km: float
) -> dict[str, float]:
    """ジャンルと距離からスコアを生成"""
    price_base, vibe_base, speed_base = GENRE_SCORES.get(
        genre, GENRE_SCORES[DEFAULT_GENRE]
    )

    # ±0.1 のランダム揺らぎ
    def jitter(base: float) -> float:
        return max(0.05, min(0.95, base + random.uniform(-0.1, 0.1)))

    # access_score: 距離ベース (0km=1.0, 1km=0.5, 2km≈0.1)
    access = max(0.05, 1.0 - dist_km * 0.5)

    return {
        "price_score": round(jitter(price_base), 2),
        "access_score": round(min(0.95, access + random.uniform(-0.05, 0.05)), 2),
        "rating_score": round(random.uniform(0.50, 0.90), 2),
        "vibe_score": round(jitter(vibe_base), 2),
        "speed_score": round(jitter(speed_base), 2),
    }


# ============================================
# Overpass API 呼出し
# ============================================

def fetch_from_overpass() -> list[dict]:
    """Overpass API で飲食店ノードを取得"""
    south, west, north, east = BBOX
    query = f"""
    [out:json][timeout:25];
    (
      node["amenity"="restaurant"]({south},{west},{north},{east});
      node["amenity"="cafe"]({south},{west},{north},{east});
      node["amenity"="fast_food"]({south},{west},{north},{east});
      node["amenity"="bar"]({south},{west},{north},{east});
      node["amenity"="pub"]({south},{west},{north},{east});
      way["amenity"="restaurant"]({south},{west},{north},{east});
      way["amenity"="cafe"]({south},{west},{north},{east});
      way["amenity"="fast_food"]({south},{west},{north},{east});
    );
    out center body;
    """

    data = urllib.request.urlopen(
        urllib.request.Request(
            OVERPASS_URL,
            data=f"data={query}".encode("utf-8"),
            method="POST",
        ),
        timeout=30,
    ).read()

    return json.loads(data)["elements"]


def elements_to_stores(elements: list[dict]) -> list[dict]:
    """Overpass 要素を Store 形式に変換"""
    stores: list[dict] = []
    seen_names: set[str] = set()

    for el in elements:
        tags = el.get("tags", {})
        name = tags.get("name", "").strip()

        # name なし or 英字のみ（チェーン店の英語表記など）はスキップ
        if not name:
            continue

        # 重複排除
        if name in seen_names:
            continue
        seen_names.add(name)

        # 座標 (way の場合は center を使用)
        lat = el.get("lat") or el.get("center", {}).get("lat")
        lon = el.get("lon") or el.get("center", {}).get("lon")
        if lat is None or lon is None:
            continue

        genre = classify_genre(tags)
        dist = haversine_km(KRP_LAT, KRP_LNG, lat, lon)
        scores = compute_scores(genre, dist)

        stores.append(
            {
                "id": f"osm_{el['id']}",
                "name": name,
                "lat": round(lat, 6),
                "lng": round(lon, 6),
                "genre": genre,
                **scores,
            }
        )

    # KRP に近い順にソート
    stores.sort(
        key=lambda s: haversine_km(KRP_LAT, KRP_LNG, s["lat"], s["lng"])
    )

    return stores


# ============================================
# 出力
# ============================================

def write_seeds_json(stores: list[dict], path: Path) -> None:
    """backend/seeds/stores.json に出力"""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(stores, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"  -> {path} ({len(stores)} stores)")


def write_dummy_ts(stores: list[dict], path: Path) -> None:
    """frontend/src/lib/dummyStores.ts に出力"""
    lines = [
        '// ============================================',
        '// dummyStores.ts — Overpass API から取得した実在店舗データ',
        '// 【B専任】このファイルは B のみが編集する',
        '// ============================================',
        '',
        'import type { Store } from "../types";',
        '',
        'export const DUMMY_STORES: Store[] = [',
    ]

    for s in stores:
        lines.append("  {")
        lines.append(f'    id: "{s["id"]}",')
        lines.append(f'    name: "{s["name"]}",')
        lines.append(f"    lat: {s['lat']},")
        lines.append(f"    lng: {s['lng']},")
        lines.append(f'    genre: "{s["genre"]}",')
        lines.append(f"    price_score: {s['price_score']},")
        lines.append(f"    access_score: {s['access_score']},")
        lines.append(f"    rating_score: {s['rating_score']},")
        lines.append(f"    vibe_score: {s['vibe_score']},")
        lines.append(f"    speed_score: {s['speed_score']},")
        lines.append("  },")

    lines.append("];")
    lines.append("")

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines), encoding="utf-8")
    print(f"  -> {path} ({len(stores)} stores)")


# ============================================
# メイン
# ============================================

def main() -> None:
    root = Path(__file__).resolve().parent.parent

    print("Fetching stores from Overpass API...")
    print(f"  bbox: {BBOX}")
    elements = fetch_from_overpass()
    print(f"  raw elements: {len(elements)}")

    stores = elements_to_stores(elements)
    print(f"  valid stores: {len(stores)}")

    if not stores:
        print("ERROR: No stores found. Try expanding the bbox.")
        return

    # ジャンル分布を表示
    genre_counts: dict[str, int] = {}
    for s in stores:
        genre_counts[s["genre"]] = genre_counts.get(s["genre"], 0) + 1
    print("\n  Genre distribution:")
    for genre, count in sorted(genre_counts.items(), key=lambda x: -x[1]):
        print(f"    {genre}: {count}")

    print("\nWriting output files...")
    write_seeds_json(stores, root / "backend" / "seeds" / "stores.json")
    write_dummy_ts(stores, root / "frontend" / "src" / "lib" / "dummyStores.ts")

    print(f"\nDone! {len(stores)} real stores around KRP.")


if __name__ == "__main__":
    random.seed(42)  # 再現性のため固定シード
    main()
