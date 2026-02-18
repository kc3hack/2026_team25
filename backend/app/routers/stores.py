# ============================================
# routers/stores.py — 店舗APIエンドポイント
# 【C専任】このファイルは C のみが編集する
# ============================================

import json
import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import StoreResponse, ScoreRequest, ScoreResponse, ScoreItem
from app.services.scoring import calculate_normalized_score
from db.connection import supabase

router = APIRouter()
logger = logging.getLogger(__name__)

ERROR_EMPTY_STORE_IDS = "store_ids must not be empty"
ERROR_DB_AND_FALLBACK_UNAVAILABLE = "Database unavailable and fallback seed data not found"


def _api_error(code: str, message: str, hint: str | None = None) -> dict:
    return {
        "code": code,
        "message": message,
        "hint": hint,
    }


def _load_seed_stores() -> list[dict]:
    """seedデータを読み込む（DB未接続時のフォールバック用）"""
    seed_path = Path(__file__).resolve().parents[2] / "seeds" / "stores.json"
    if not seed_path.exists():
        logger.warning("Seed file not found: %s", seed_path)
        return []

    try:
        with seed_path.open("r", encoding="utf-8") as file:
            data = json.load(file)
            if isinstance(data, list):
                return data
            logger.warning("Seed file format invalid: expected list")
            return []
    except json.JSONDecodeError:
        logger.exception("Seed file JSON decode failed")
        return []


@router.get("/stores", response_model=StoreResponse)
async def get_stores():
    """全店舗データを返却する"""
    try:
        response = supabase.table("stores").select("*").execute()
        stores = response.data or []
        logger.info("GET /stores: returned %d stores from database", len(stores))
        return StoreResponse(stores=stores)
    except Exception:
        logger.exception("GET /stores: database access failed, trying fallback")
        fallback_stores = _load_seed_stores()
        if fallback_stores:
            logger.info("GET /stores: returned %d stores from seed fallback", len(fallback_stores))
            return StoreResponse(stores=fallback_stores)
        raise HTTPException(
            status_code=503,
            detail=_api_error(
                code="DB_UNAVAILABLE",
                message=ERROR_DB_AND_FALLBACK_UNAVAILABLE,
                hint="Check SUPABASE_URL/SUPABASE_KEY and seed file backend/seeds/stores.json",
            ),
        )


@router.post("/stores/score", response_model=ScoreResponse)
async def calculate_scores(
    request: ScoreRequest,
    min_score: float | None = Query(default=None, ge=0.0, le=1.0),
    limit: int | None = Query(default=None, ge=1, le=100),
):
    """サーバー側でスコアを計算して返す（検証用・将来拡張用）"""
    if not request.store_ids:
        raise HTTPException(
            status_code=400,
            detail=_api_error(
                code="EMPTY_STORE_IDS",
                message=ERROR_EMPTY_STORE_IDS,
                hint="Provide at least one store id in request.store_ids",
            ),
        )

    try:
        response = (
            supabase.table("stores")
            .select("*")
            .in_("id", request.store_ids)
            .execute()
        )
        stores = response.data or []
    except Exception:
        logger.exception("POST /stores/score: database access failed, trying fallback")
        fallback_stores = _load_seed_stores()
        store_id_set = set(request.store_ids)
        stores = [store for store in fallback_stores if store.get("id") in store_id_set]
        logger.info("POST /stores/score: fallback matched %d stores", len(stores))

    weights = request.weights.model_dump()
    stores_by_id = {store.get("id"): store for store in stores}

    scores = []
    for store_id in request.store_ids:
        store = stores_by_id.get(store_id)
        if not store:
            logger.debug("POST /stores/score: store_id not found: %s", store_id)
            continue
        score = calculate_normalized_score(store, weights)
        scores.append(ScoreItem(store_id=store_id, normalized_score=score))

    if min_score is not None:
        scores = [score for score in scores if score.normalized_score >= min_score]

    if limit is not None:
        scores = sorted(scores, key=lambda x: x.normalized_score, reverse=True)[:limit]

    logger.info("POST /stores/score: calculated %d scores", len(scores))
    return ScoreResponse(scores=scores)
