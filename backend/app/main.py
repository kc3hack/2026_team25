# ============================================
# main.py — FastAPIアプリケーション
# 【C専任】このファイルは C のみが編集する
# ============================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import stores

app = FastAPI(
    title="Wagamama Gourmet API",
    description="わがままグルメ バックエンドAPI",
    version="0.1.0",
)

# CORS設定（開発時は全許可、本番では制限する）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stores.router, prefix="/api")


@app.get("/health")
def health():
    """ヘルスチェック"""
    return {"status": "ok"}
