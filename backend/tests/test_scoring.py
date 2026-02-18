# ============================================
# test_scoring.py — スコア計算テスト
# 【C専任】このファイルは C のみが編集する
# ============================================

import os

os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "dummy-anon-key")

from fastapi.testclient import TestClient

from app.main import app
from app.routers import stores as stores_router
from app.services.scoring import calculate_normalized_score


class _FakeResponse:
    def __init__(self, data):
        self.data = data


class _FakeQuery:
    def __init__(self, data=None, error=None):
        self._data = data or []
        self._error = error

    def select(self, *_args, **_kwargs):
        return self

    def in_(self, *_args, **_kwargs):
        return self

    def execute(self):
        if self._error:
            raise self._error
        return _FakeResponse(self._data)


class _FakeSupabase:
    def __init__(self, data=None, error=None):
        self._data = data or []
        self._error = error

    def table(self, _name):
        return _FakeQuery(data=self._data, error=self._error)


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

    def test_exact_weighted_average_rounding(self):
        """加重平均の小数第4位丸めが正しい"""
        store = {
            "price_score": 0.91,
            "access_score": 0.42,
            "rating_score": 0.77,
            "vibe_score": 0.35,
            "speed_score": 0.68,
        }
        weights = {"price": 90, "access": 70, "rating": 30, "vibe": 10, "speed": 50}

        # 手計算値: 0.6876...
        assert calculate_normalized_score(store, weights) == 0.6876

    def test_score_is_clamped_between_zero_and_one(self):
        """異常値が入ってもスコアは 0.0〜1.0 にクランプされる"""
        high_store = {
            "price_score": 1.5,
            "access_score": 1.6,
            "rating_score": 1.4,
            "vibe_score": 1.2,
            "speed_score": 1.8,
        }
        low_store = {
            "price_score": -0.5,
            "access_score": -0.4,
            "rating_score": -0.2,
            "vibe_score": -0.3,
            "speed_score": -0.1,
        }
        weights = {"price": 50, "access": 50, "rating": 50, "vibe": 50, "speed": 50}

        assert calculate_normalized_score(high_store, weights) == 1.0
        assert calculate_normalized_score(low_store, weights) == 0.0


class TestScoreApi:
    """/api/stores/score のAPI挙動テスト"""

    def test_post_score_returns_400_when_store_ids_empty(self):
        client = TestClient(app)

        response = client.post(
            "/api/stores/score",
            json={
                "store_ids": [],
                "weights": {
                    "price": 50,
                    "access": 50,
                    "rating": 50,
                    "vibe": 50,
                    "speed": 50,
                },
            },
        )

        assert response.status_code == 400
        payload = response.json()
        assert payload["error"]["code"] == "EMPTY_STORE_IDS"
        assert payload["error"]["message"] == stores_router.ERROR_EMPTY_STORE_IDS

    def test_post_score_preserves_request_order(self, monkeypatch):
        client = TestClient(app)

        fake_data = [
            {
                "id": "store_002",
                "price_score": 0.3,
                "access_score": 0.6,
                "rating_score": 0.9,
                "vibe_score": 0.95,
                "speed_score": 0.4,
            },
            {
                "id": "store_001",
                "price_score": 0.9,
                "access_score": 0.8,
                "rating_score": 0.7,
                "vibe_score": 0.3,
                "speed_score": 0.9,
            },
        ]
        monkeypatch.setattr(stores_router, "supabase", _FakeSupabase(data=fake_data))

        request_order = ["store_001", "store_002"]
        response = client.post(
            "/api/stores/score",
            json={
                "store_ids": request_order,
                "weights": {
                    "price": 90,
                    "access": 70,
                    "rating": 30,
                    "vibe": 10,
                    "speed": 50,
                },
            },
        )

        assert response.status_code == 200
        ids = [item["store_id"] for item in response.json()["scores"]]
        assert ids == request_order

    def test_post_score_with_min_score_filters_results(self, monkeypatch):
        client = TestClient(app)

        fake_data = [
            {
                "id": "store_001",
                "price_score": 0.9,
                "access_score": 0.8,
                "rating_score": 0.7,
                "vibe_score": 0.3,
                "speed_score": 0.9,
            },
            {
                "id": "store_002",
                "price_score": 0.1,
                "access_score": 0.1,
                "rating_score": 0.2,
                "vibe_score": 0.2,
                "speed_score": 0.1,
            },
        ]
        monkeypatch.setattr(stores_router, "supabase", _FakeSupabase(data=fake_data))

        response = client.post(
            "/api/stores/score?min_score=0.8",
            json={
                "store_ids": ["store_001", "store_002"],
                "weights": {
                    "price": 90,
                    "access": 70,
                    "rating": 30,
                    "vibe": 10,
                    "speed": 50,
                },
            },
        )

        assert response.status_code == 200
        scores = response.json()["scores"]
        assert len(scores) == 1
        assert scores[0]["store_id"] == "store_001"

    def test_post_score_with_limit_returns_top_n(self, monkeypatch):
        client = TestClient(app)

        fake_data = [
            {
                "id": "store_001",
                "price_score": 0.9,
                "access_score": 0.8,
                "rating_score": 0.7,
                "vibe_score": 0.3,
                "speed_score": 0.9,
            },
            {
                "id": "store_002",
                "price_score": 0.2,
                "access_score": 0.1,
                "rating_score": 0.2,
                "vibe_score": 0.2,
                "speed_score": 0.1,
            },
            {
                "id": "store_003",
                "price_score": 0.95,
                "access_score": 0.85,
                "rating_score": 0.5,
                "vibe_score": 0.15,
                "speed_score": 0.95,
            },
        ]
        monkeypatch.setattr(stores_router, "supabase", _FakeSupabase(data=fake_data))

        response = client.post(
            "/api/stores/score?limit=2",
            json={
                "store_ids": ["store_001", "store_002", "store_003"],
                "weights": {
                    "price": 90,
                    "access": 70,
                    "rating": 30,
                    "vibe": 10,
                    "speed": 50,
                },
            },
        )

        assert response.status_code == 200
        scores = response.json()["scores"]
        assert len(scores) == 2
        assert scores[0]["normalized_score"] >= scores[1]["normalized_score"]

    def test_post_score_falls_back_to_seed_when_db_fails(self, monkeypatch):
        client = TestClient(app)

        monkeypatch.setattr(
            stores_router,
            "supabase",
            _FakeSupabase(error=RuntimeError("db down")),
        )
        monkeypatch.setattr(
            stores_router,
            "_load_seed_stores",
            lambda: [
                {
                    "id": "store_001",
                    "price_score": 0.9,
                    "access_score": 0.8,
                    "rating_score": 0.7,
                    "vibe_score": 0.3,
                    "speed_score": 0.9,
                }
            ],
        )

        response = client.post(
            "/api/stores/score",
            json={
                "store_ids": ["store_001", "store_999"],
                "weights": {
                    "price": 90,
                    "access": 70,
                    "rating": 30,
                    "vibe": 10,
                    "speed": 50,
                },
            },
        )

        assert response.status_code == 200
        scores = response.json()["scores"]
        assert len(scores) == 1
        assert scores[0]["store_id"] == "store_001"

    def test_get_stores_falls_back_to_seed_when_db_fails(self, monkeypatch):
        client = TestClient(app)

        monkeypatch.setattr(
            stores_router,
            "supabase",
            _FakeSupabase(error=RuntimeError("db down")),
        )
        monkeypatch.setattr(
            stores_router,
            "_load_seed_stores",
            lambda: [
                {
                    "id": "store_001",
                    "name": "Seed Store",
                    "lat": 34.99,
                    "lng": 135.74,
                    "genre": "seed",
                    "price_score": 0.9,
                    "access_score": 0.8,
                    "rating_score": 0.7,
                    "vibe_score": 0.3,
                    "speed_score": 0.9,
                }
            ],
        )

        response = client.get("/api/stores")

        assert response.status_code == 200
        payload = response.json()
        assert len(payload["stores"]) == 1
        assert payload["stores"][0]["id"] == "store_001"

    def test_get_stores_returns_503_when_db_and_seed_unavailable(self, monkeypatch):
        client = TestClient(app)

        monkeypatch.setattr(
            stores_router,
            "supabase",
            _FakeSupabase(error=RuntimeError("db down")),
        )
        monkeypatch.setattr(stores_router, "_load_seed_stores", lambda: [])

        response = client.get("/api/stores")

        assert response.status_code == 503
        payload = response.json()
        assert payload["error"]["code"] == "DB_UNAVAILABLE"
        assert payload["error"]["message"] == stores_router.ERROR_DB_AND_FALLBACK_UNAVAILABLE
