# ============================================
# db/connection.py — Supabase接続設定
# 【D専任】このファイルは D のみが編集する
# ============================================

import os
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠ WARNING: SUPABASE_URL or SUPABASE_KEY is not set. Running in MOCK mode (seed data fallback).")
    supabase: Client | None = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
