from pydantic import BaseModel


class StoreSchema(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    genre: str
    price_score: float
    access_score: float
    rating_score: float
    vibe_score: float
    speed_score: float


class StoreResponse(BaseModel):
    stores: list[StoreSchema]


class WeightsSchema(BaseModel):
    price: int
    access: int
    rating: int
    vibe: int
    speed: int


class ScoreRequest(BaseModel):
    store_ids: list[str]
    weights: WeightsSchema


class ScoreItem(BaseModel):
    store_id: str
    normalized_score: float


class ScoreResponse(BaseModel):
    scores: list[ScoreItem]
# ============================================
# models/schemas.py — Pydanticスキーマ定義
# 【D専任】このファイルは D のみが編集する
# C は import して参照のみ
# ============================================

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
