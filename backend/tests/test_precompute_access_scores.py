import os

os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "dummy-anon-key")
os.environ.setdefault("GOOGLE_MAPS_API_KEY", "dummy-maps-key")

from scripts import precompute_access_scores as precompute


class _FakeResponse:
    def __init__(self, data):
        self.data = data


class _FakeQuery:
    def __init__(self, fake_supabase):
        self._fake_supabase = fake_supabase
        self._payload = None
        self._target_id = None

    def select(self, *_args, **_kwargs):
        return self

    def update(self, payload):
        self._payload = payload
        return self

    def eq(self, _field, value):
        self._target_id = value
        return self

    def execute(self):
        if self._payload is None:
            return _FakeResponse(self._fake_supabase.stores)
        self._fake_supabase.updates.append((self._target_id, self._payload))
        return _FakeResponse([self._payload])


class _FakeSupabase:
    def __init__(self, stores):
        self.stores = stores
        self.updates = []

    def table(self, _name):
        return _FakeQuery(self)


def test_run_precompute_updates_all_stores(monkeypatch):
    fake_supabase = _FakeSupabase(
        stores=[
            {"id": "store_001", "name": "A", "lat": 34.99, "lng": 135.74},
            {"id": "store_002", "name": "B", "lat": 35.00, "lng": 135.75},
        ]
    )
    monkeypatch.setattr(precompute, "supabase", fake_supabase)
    monkeypatch.setattr(
        precompute,
        "compute_walking_route",
        lambda destination_lat, destination_lng: {
            "duration_sec": 600 if destination_lat < 35 else 900,
            "distance_m": 900 if destination_lng < 135.75 else 1500,
        },
    )

    code = precompute.run_precompute(store_ids=[], dry_run=False)

    assert code == 0
    assert len(fake_supabase.updates) == 2
    updated_ids = [item[0] for item in fake_supabase.updates]
    assert updated_ids == ["store_001", "store_002"]
    for _, payload in fake_supabase.updates:
        assert 0.0 <= payload["access_score"] <= 1.0
        assert payload["access_source"] == precompute.ACCESS_SOURCE
        assert payload["walk_duration_sec"] > 0
        assert payload["walk_distance_m"] > 0


def test_run_precompute_dry_run_does_not_update_db(monkeypatch):
    fake_supabase = _FakeSupabase(
        stores=[
            {"id": "store_001", "name": "A", "lat": 34.99, "lng": 135.74},
        ]
    )
    monkeypatch.setattr(precompute, "supabase", fake_supabase)
    monkeypatch.setattr(
        precompute,
        "compute_walking_route",
        lambda destination_lat, destination_lng: {"duration_sec": 420, "distance_m": 650},
    )

    code = precompute.run_precompute(store_ids=[], dry_run=True)

    assert code == 0
    assert fake_supabase.updates == []


def test_run_precompute_returns_nonzero_when_route_fails(monkeypatch):
    fake_supabase = _FakeSupabase(
        stores=[
            {"id": "store_001", "name": "A", "lat": 34.99, "lng": 135.74},
        ]
    )
    monkeypatch.setattr(precompute, "supabase", fake_supabase)

    def _raise_route_error(destination_lat, destination_lng):
        raise precompute.GoogleRoutesError("boom")

    monkeypatch.setattr(precompute, "compute_walking_route", _raise_route_error)

    code = precompute.run_precompute(store_ids=[], dry_run=False)

    assert code == 1
    assert fake_supabase.updates == []
