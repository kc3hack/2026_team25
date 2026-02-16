import pytest

from app.services.scoring import calculate_normalized_score


def test_all_weights_zero_returns_zero():
    store = {
        "price_score": 0.5,
        "access_score": 0.5,
        "rating_score": 0.5,
        "vibe_score": 0.5,
        "speed_score": 0.5,
    }
    weights = {"price": 0, "access": 0, "rating": 0, "vibe": 0, "speed": 0}

    assert calculate_normalized_score(store, weights) == 0.0


def test_kinketsu_preset_prefers_cheap_store():
    # 金欠モード重み（price重視）
    weights = {"price": 90, "access": 70, "rating": 30, "vibe": 10, "speed": 50}

    cheap_store = {
        "price_score": 1.0,
        "access_score": 0.6,
        "rating_score": 0.4,
        "vibe_score": 0.2,
        "speed_score": 0.7,
    }

    expensive_store = {
        "price_score": 0.1,
        "access_score": 0.8,
        "rating_score": 0.8,
        "vibe_score": 0.7,
        "speed_score": 0.5,
    }

    s_cheap = calculate_normalized_score(cheap_store, weights)
    s_exp = calculate_normalized_score(expensive_store, weights)

    assert s_cheap > s_exp


def test_date_preset_prefers_vibe():
    # デートモード重み（vibe重視）
    weights = {"price": 20, "access": 40, "rating": 60, "vibe": 95, "speed": 30}

    vibe_store = {
        "price_score": 0.3,
        "access_score": 0.5,
        "rating_score": 0.6,
        "vibe_score": 1.0,
        "speed_score": 0.4,
    }

    non_vibe_store = {
        "price_score": 0.6,
        "access_score": 0.7,
        "rating_score": 0.8,
        "vibe_score": 0.2,
        "speed_score": 0.6,
    }

    s_vibe = calculate_normalized_score(vibe_store, weights)
    s_non = calculate_normalized_score(non_vibe_store, weights)

    assert s_vibe > s_non
# ============================================
# test_scoring.py — スコア計算テスト
# 【C専任】このファイルは C のみが編集する
# ============================================

import pytest
from app.services.scoring import calculate_normalized_score


class TestCalculateNormalizedScore:
    """scoring.py の計算結果がフロント(TS)と一致するかを検証"""

    def test_all_weights_zero(self):
        """全重みゼロ → スコア0"""
        store = {
            "price_score": 0.9,
            "access_score": 0.8,
            "rating_score": 0.7,
            "vibe_score": 0.3,
            "speed_score": 0.9,
        }
        weights = {"price": 0, "access": 0, "rating": 0, "vibe": 0, "speed": 0}
        assert calculate_normalized_score(store, weights) == 0.0

    def test_broke_preset_cheap_store(self):
        """金欠プリセット + 安い店 → 高スコア"""
        store = {
            "price_score": 0.9,
            "access_score": 0.8,
            "rating_score": 0.7,
            "vibe_score": 0.3,
            "speed_score": 0.9,
        }
        weights = {"price": 90, "access": 70, "rating": 30, "vibe": 10, "speed": 50}
        score = calculate_normalized_score(store, weights)
        assert score > 0.7, f"Expected > 0.7, got {score}"

    def test_date_preset_cheap_store(self):
        """デートプリセット + 安い店(雰囲気低い) → 低スコア"""
        store = {
            "price_score": 0.9,
            "access_score": 0.8,
            "rating_score": 0.7,
            "vibe_score": 0.3,
            "speed_score": 0.9,
        }
        weights = {"price": 20, "access": 40, "rating": 60, "vibe": 95, "speed": 30}
        score = calculate_normalized_score(store, weights)
        assert score < 0.7, f"Expected < 0.7, got {score}"

    def test_date_preset_fancy_store(self):
        """デートプリセット + 雰囲気良い店 → 高スコア"""
        store = {
            "price_score": 0.3,
            "access_score": 0.6,
            "rating_score": 0.9,
            "vibe_score": 0.95,
            "speed_score": 0.4,
        }
        weights = {"price": 20, "access": 40, "rating": 60, "vibe": 95, "speed": 30}
        score = calculate_normalized_score(store, weights)
        assert score > 0.7, f"Expected > 0.7, got {score}"

    def test_perfect_score(self):
        """全属性1.0 → スコア1.0"""
        store = {
            "price_score": 1.0,
            "access_score": 1.0,
            "rating_score": 1.0,
            "vibe_score": 1.0,
            "speed_score": 1.0,
        }
        weights = {"price": 50, "access": 50, "rating": 50, "vibe": 50, "speed": 50}
        assert calculate_normalized_score(store, weights) == 1.0

    def test_single_weight(self):
        """単一の重みのみ → その属性のスコアと一致"""
        store = {
            "price_score": 0.7,
            "access_score": 0.0,
            "rating_score": 0.0,
            "vibe_score": 0.0,
            "speed_score": 0.0,
        }
        weights = {"price": 100, "access": 0, "rating": 0, "vibe": 0, "speed": 0}
        assert calculate_normalized_score(store, weights) == 0.7
