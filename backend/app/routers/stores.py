# ============================================
# routers/stores.py — 店舗APIエンドポイント
# 【C専任】このファイルは C のみが編集する
# ============================================

from fastapi import APIRouter, HTTPException
from app.models.schemas import StoreResponse, ScoreRequest, ScoreResponse, ScoreItem
from app.services.scoring import calculate_normalized_score
from db.connection import supabase

router = APIRouter()


@router.get("/stores", response_model=StoreResponse)
async def get_stores():
    """全店舗データを返却する"""
    try:
        response = supabase.table("stores").select("*").execute()
        return StoreResponse(stores=response.data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stores/score", response_model=ScoreResponse)
async def calculate_scores(request: ScoreRequest):
    """サーバー側でスコアを計算して返す（検証用・将来拡張用）"""
    try:
        response = (
            supabase.table("stores")
            .select("*")
            .in_("id", request.store_ids)
            .execute()
        )

        weights = request.weights.model_dump()
        scores = []
        for store in response.data:
            score = calculate_normalized_score(store, weights)
            scores.append(ScoreItem(store_id=store["id"], normalized_score=score))

        return ScoreResponse(scores=scores)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
