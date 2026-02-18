# ============================================
# main.py — FastAPIアプリケーション
# 【C専任】このファイルは C のみが編集する
# ============================================

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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


def _error_response(status_code: int, code: str, message: str, hint: str | None = None) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "hint": hint,
            }
        },
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict):
        return _error_response(
            status_code=exc.status_code,
            code=exc.detail.get("code", "HTTP_ERROR"),
            message=exc.detail.get("message", "Request failed"),
            hint=exc.detail.get("hint"),
        )

    return _error_response(
        status_code=exc.status_code,
        code="HTTP_ERROR",
        message=str(exc.detail),
        hint="Check request parameters and payload",
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    first_error = exc.errors()[0] if exc.errors() else {}
    return _error_response(
        status_code=422,
        code="VALIDATION_ERROR",
        message="Request validation failed",
        hint=str(first_error.get("msg", "Invalid request")),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, _exc: Exception):
    return _error_response(
        status_code=500,
        code="INTERNAL_ERROR",
        message="Unexpected server error",
        hint="Check backend logs for details",
    )


@app.get("/health")
def health():
    """ヘルスチェック"""
    return {"status": "ok"}
