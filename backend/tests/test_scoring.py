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
