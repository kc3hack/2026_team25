from app.services.access_scoring import calculate_access_score


def test_access_score_best_case():
    breakdown = calculate_access_score(walk_duration_sec=120, walk_distance_m=100)
    assert breakdown.access_score == 1.0
    assert breakdown.duration_score == 1.0
    assert breakdown.distance_score == 1.0


def test_access_score_worst_case():
    breakdown = calculate_access_score(walk_duration_sec=1800, walk_distance_m=4000)
    assert breakdown.access_score == 0.0
    assert breakdown.duration_score == 0.0
    assert breakdown.distance_score == 0.0


def test_access_score_duration_is_prioritized():
    # 徒歩時間の差を強めに効かせる（80%）
    fast = calculate_access_score(walk_duration_sec=360, walk_distance_m=1500)
    slow = calculate_access_score(walk_duration_sec=960, walk_distance_m=1500)
    assert fast.access_score > slow.access_score


def test_access_score_expected_weighted_value():
    # duration_score ~= 0.5882, distance_score ~= 0.6522
    # access_score = 0.8*0.5882 + 0.2*0.6522 ~= 0.6010
    breakdown = calculate_access_score(walk_duration_sec=600, walk_distance_m=1000)
    assert breakdown.access_score == 0.601


def test_access_score_negative_values_raise():
    try:
        calculate_access_score(walk_duration_sec=-1, walk_distance_m=100)
        assert False, "Expected ValueError for negative duration"
    except ValueError:
        pass

    try:
        calculate_access_score(walk_duration_sec=100, walk_distance_m=-1)
        assert False, "Expected ValueError for negative distance"
    except ValueError:
        pass
