# ============================================
# db/connection.py — Supabase接続設定
# 【D専任】このファイルは D のみが編集する
# ============================================

import os
from typing import Optional

try:
    from supabase import create_client, Client
except Exception:  # pragma: no cover - import error handled at runtime
    create_client = None  # type: ignore
    Client = object  # type: ignore


# 環境変数: サーバー側は SERVICE_ROLE を使うのが推奨
SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "")
# 優先順位: SERVICE_ROLE_KEY -> SUPABASE_KEY (既存) -> SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY: Optional[str] = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_KEY: Optional[str] = os.environ.get("SUPABASE_KEY")
SUPABASE_ANON_KEY: Optional[str] = os.environ.get("SUPABASE_ANON_KEY")

_key_to_use = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY or SUPABASE_ANON_KEY or ""

if not SUPABASE_URL or not _key_to_use:
    # 開発時に環境変数が未設定だときは警告を出すだけ（テスト環境では上書きしてもらう）
    print("⚠ WARNING: SUPABASE_URL or SUPABASE_KEY (or SERVICE_ROLE) is not set. DB operations will fail until set.")

if create_client is not None and SUPABASE_URL and _key_to_use:
    supabase: Client = create_client(SUPABASE_URL, _key_to_use)
else:
    # 型の都合で存在を保証するが、呼び出し側は None チェックを推奨
    supabase = None  # type: ignore
