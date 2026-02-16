# ============================================
# routers/stores.py — 店舗APIエンドポイント
# 【C専任】このファイルは C のみが編集する
# ============================================

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException
from app.models.schemas import StoreResponse, ScoreRequest, ScoreResponse, ScoreItem
from app.services.scoring import calculate_normalized_score
from db.connection import supabase

router = APIRouter()


def _load_seed_stores() -> list[dict]:
    """seedデータを読み込む（DB未接続時のフォールバック用）"""
    seed_path = Path(__file__).resolve().parents[2] / "seeds" / "stores.json"
    if not seed_path.exists():
        return []

    with seed_path.open("r", encoding="utf-8") as file:
        data = json.load(file)
        return data if isinstance(data, list) else []


@router.get("/stores", response_model=StoreResponse)
async def get_stores():
    """全店舗データを返却する"""
    try:
        response = supabase.table("stores").select("*").execute()
        stores = response.data or []
        return StoreResponse(stores=stores)
    except Exception:
        fallback_stores = _load_seed_stores()
        if fallback_stores:
            return StoreResponse(stores=fallback_stores)
        raise HTTPException(
            status_code=503,
            detail="Database unavailable and fallback seed data not found",
        )


@router.post("/stores/score", response_model=ScoreResponse)
async def calculate_scores(request: ScoreRequest):
    """サーバー側でスコアを計算して返す（検証用・将来拡張用）"""
    if not request.store_ids:
        raise HTTPException(status_code=400, detail="store_ids must not be empty")

    try:
        response = (
            supabase.table("stores")
            .select("*")
            .in_("id", request.store_ids)
            .execute()
        )
        stores = response.data or []
    except Exception:
        fallback_stores = _load_seed_stores()
        store_id_set = set(request.store_ids)
        stores = [store for store in fallback_stores if store.get("id") in store_id_set]

    weights = request.weights.model_dump()
    stores_by_id = {store.get("id"): store for store in stores}

    scores = []
    for store_id in request.store_ids:
        store = stores_by_id.get(store_id)
        if not store:
            continue
        score = calculate_normalized_score(store, weights)
        scores.append(ScoreItem(store_id=store_id, normalized_score=score))

    return ScoreResponse(scores=scores)
