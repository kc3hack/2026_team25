# ============================================
# models/schemas.py — Pydanticスキーマ定義
# 【D専任】このファイルは D のみが編集する
# C は import して参照のみ
# ============================================

from typing import Literal

from pydantic import BaseModel, Field


class StoreSchema(BaseModel):
    """店舗データスキーマ"""

    id: str
    name: str
    lat: float
    lng: float
    genre: str
    price_score: float = Field(ge=0.0, le=1.0)
    access_score: float = Field(ge=0.0, le=1.0)
    rating_score: float = Field(ge=0.0, le=1.0)
    vibe_score: float = Field(ge=0.0, le=1.0)
    speed_score: float = Field(ge=0.0, le=1.0)
    walk_duration_sec: int | None = Field(default=None, ge=0)
    walk_distance_m: int | None = Field(default=None, ge=0)
    access_source: str | None = None
    access_updated_at: str | None = None


class StoreResponse(BaseModel):
    """GET /api/stores のレスポンス"""

    stores: list[StoreSchema]


class WeightsSchema(BaseModel):
    """重みスキーマ（スライダー値）"""

    price: int = Field(ge=0, le=100)
    access: int = Field(ge=0, le=100)
    rating: int = Field(ge=0, le=100)
    vibe: int = Field(ge=0, le=100)
    speed: int = Field(ge=0, le=100)


class ScoreRequest(BaseModel):
    """POST /api/stores/score のリクエスト"""

    store_ids: list[str]
    weights: WeightsSchema


class ScoreItem(BaseModel):
    """個別スコア結果"""

    store_id: str
    normalized_score: float


class ScoreResponse(BaseModel):
    """POST /api/stores/score のレスポンス"""

    scores: list[ScoreItem]


class ChatMessageSchema(BaseModel):
    """チャットメッセージ"""

    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=1000)


class ChatContextSchema(BaseModel):
    """チャット補助コンテキスト"""

    selected_genre: str | None = None
    top_store_names: list[str] = Field(default_factory=list)
    weights: WeightsSchema | None = None


class ChatRequest(BaseModel):
    """POST /api/chat のリクエスト"""

    message: str = Field(min_length=1, max_length=500)
    history: list[ChatMessageSchema] = Field(default_factory=list)
    context: ChatContextSchema | None = None


class ChatResponse(BaseModel):
    """POST /api/chat のレスポンス"""

    assistant_message: str
    suggested_queries: list[str] = Field(default_factory=list)
    detected_mode: str | None = None
