# ============================================
# services/access_scoring.py — アクセス評価点計算
# KRP起点の徒歩時間を主軸として 0.0〜1.0 に正規化
# ============================================

from dataclasses import dataclass

DURATION_WEIGHT = 0.8
DISTANCE_WEIGHT = 0.2

# KRPデモ用途のスケール:
# 3分以内は満点、20分以上は最低点として線形補間
BEST_WALK_DURATION_SEC = 180
WORST_WALK_DURATION_SEC = 1200

# 200m以内は満点、2.5km以上は最低点として線形補間
BEST_WALK_DISTANCE_M = 200
WORST_WALK_DISTANCE_M = 2500


@dataclass(frozen=True)
class AccessScoreBreakdown:
    access_score: float
    duration_score: float
    distance_score: float


def _normalize_inverse(value: float, *, best: float, worst: float) -> float:
    if worst <= best:
        raise ValueError("worst must be greater than best")
    if value <= best:
        return 1.0
    if value >= worst:
        return 0.0
    ratio = (value - best) / (worst - best)
    return 1.0 - ratio


def calculate_access_score(
    walk_duration_sec: int,
    walk_distance_m: int,
    *,
    duration_weight: float = DURATION_WEIGHT,
    distance_weight: float = DISTANCE_WEIGHT,
) -> AccessScoreBreakdown:
    if walk_duration_sec < 0:
        raise ValueError("walk_duration_sec must be >= 0")
    if walk_distance_m < 0:
        raise ValueError("walk_distance_m must be >= 0")

    weight_total = duration_weight + distance_weight
    if weight_total <= 0:
        raise ValueError("duration_weight + distance_weight must be > 0")

    normalized_duration_weight = duration_weight / weight_total
    normalized_distance_weight = distance_weight / weight_total

    duration_score = _normalize_inverse(
        float(walk_duration_sec),
        best=BEST_WALK_DURATION_SEC,
        worst=WORST_WALK_DURATION_SEC,
    )
    distance_score = _normalize_inverse(
        float(walk_distance_m),
        best=BEST_WALK_DISTANCE_M,
        worst=WORST_WALK_DISTANCE_M,
    )

    access_score = (
        duration_score * normalized_duration_weight
        + distance_score * normalized_distance_weight
    )
    access_score = max(0.0, min(1.0, access_score))

    return AccessScoreBreakdown(
        access_score=round(access_score, 4),
        duration_score=round(duration_score, 4),
        distance_score=round(distance_score, 4),
    )
