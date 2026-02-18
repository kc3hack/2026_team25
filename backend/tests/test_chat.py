import os

os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "dummy-anon-key")

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_post_chat_returns_assistant_message():
    response = client.post(
        "/api/chat",
        json={
            "message": "安くて駅近の店がいい",
            "history": [{"role": "user", "content": "安くて駅近の店がいい"}],
            "context": {
                "selected_genre": "和食",
                "top_store_names": ["店A", "店B", "店C"],
                "weights": {
                    "price": 90,
                    "access": 70,
                    "rating": 30,
                    "vibe": 10,
                    "speed": 50,
                },
            },
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert "assistant_message" in payload
    assert isinstance(payload["assistant_message"], str)
    assert len(payload["assistant_message"]) > 0
    assert payload["detected_mode"] == "金欠"
    assert len(payload["suggested_queries"]) > 0


def test_post_chat_validation_error_on_empty_message():
    response = client.post(
        "/api/chat",
        json={
            "message": "",
            "history": [],
            "context": None,
        },
    )

    assert response.status_code == 422
    payload = response.json()
    assert payload["error"]["code"] == "VALIDATION_ERROR"
