# ============================================
# services/scoring.py — Python版スコア計算
# 【C専任】このファイルは C のみが編集する
# フロント (scoreEngine.ts) と完全に同一のロジック
# ============================================


def calculate_normalized_score(store: dict, weights: dict) -> float:
    """
    店舗データと重みから正規化スコアを計算する。
    フロント(TypeScript)の calculateScores() と完全一致すること。

    Args:
        store: {"price_score": 0.9, "access_score": 0.8, ...}
        weights: {"price": 90, "access": 70, ...}

    Returns:
        0.0 〜 1.0 の正規化スコア
    """
    total_weight = (
        weights.get("price", 0)
        + weights.get("access", 0)
        + weights.get("rating", 0)
        + weights.get("vibe", 0)
        + weights.get("speed", 0)
    )

    if total_weight == 0:
        return 0.0

    score = (
        store.get("price_score", 0) * weights.get("price", 0)
        + store.get("access_score", 0) * weights.get("access", 0)
        + store.get("rating_score", 0) * weights.get("rating", 0)
        + store.get("vibe_score", 0) * weights.get("vibe", 0)
        + store.get("speed_score", 0) * weights.get("speed", 0)
    ) / total_weight

    return round(score, 4)
