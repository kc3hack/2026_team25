#!/usr/bin/env python3
# ============================================
# scripts/precompute_access_scores.py
# KRP起点の徒歩アクセス評価を事前計算して stores に保存
# ============================================

from __future__ import annotations

import argparse
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.services.access_scoring import calculate_access_score
from app.services.google_routes import GoogleRoutesError, compute_walking_route
from db.connection import supabase

logger = logging.getLogger(__name__)
ACCESS_SOURCE = "google_routes_krp_walk"


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Precompute KRP-origin walking access score for stores."
    )
    parser.add_argument(
        "--store-id",
        action="append",
        default=[],
        help="Target specific store id (repeatable)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Process only first N stores after filtering",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Do not write to DB, only print computed values",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
    )
    return parser.parse_args()


def _load_target_stores(store_ids: Iterable[str], limit: int | None) -> list[dict]:
    response = supabase.table("stores").select("id,name,lat,lng").execute()
    stores = response.data or []
    store_id_set = {store_id for store_id in store_ids if store_id}
    if store_id_set:
        stores = [store for store in stores if store.get("id") in store_id_set]
    if limit is not None and limit > 0:
        stores = stores[:limit]
    return stores


def _build_update_payload(store: dict, duration_sec: int, distance_m: int, access_score: float) -> dict:
    return {
        "access_score": access_score,
        "walk_duration_sec": duration_sec,
        "walk_distance_m": distance_m,
        "access_source": ACCESS_SOURCE,
        "access_updated_at": datetime.now(timezone.utc).isoformat(),
    }


def run_precompute(*, store_ids: Iterable[str], limit: int | None = None, dry_run: bool = False) -> int:
    stores = _load_target_stores(store_ids=store_ids, limit=limit)
    if not stores:
        logger.warning("No stores found for processing")
        return 0

    success = 0
    failed = 0

    for store in stores:
        store_id = store.get("id")
        try:
            metrics = compute_walking_route(
                destination_lat=float(store["lat"]),
                destination_lng=float(store["lng"]),
            )
            breakdown = calculate_access_score(
                walk_duration_sec=metrics["duration_sec"],
                walk_distance_m=metrics["distance_m"],
            )
            payload = _build_update_payload(
                store=store,
                duration_sec=metrics["duration_sec"],
                distance_m=metrics["distance_m"],
                access_score=breakdown.access_score,
            )

            if dry_run:
                logger.info(
                    "[DRY-RUN] %s %s duration=%ss distance=%sm access=%.4f",
                    store_id,
                    store.get("name", ""),
                    payload["walk_duration_sec"],
                    payload["walk_distance_m"],
                    payload["access_score"],
                )
            else:
                supabase.table("stores").update(payload).eq("id", store_id).execute()
                logger.info(
                    "Updated %s %s duration=%ss distance=%sm access=%.4f",
                    store_id,
                    store.get("name", ""),
                    payload["walk_duration_sec"],
                    payload["walk_distance_m"],
                    payload["access_score"],
                )
            success += 1
        except GoogleRoutesError as exc:
            failed += 1
            logger.error("Route computation failed for %s: %s", store_id, exc)
        except Exception as exc:
            failed += 1
            logger.exception("Unexpected error for %s: %s", store_id, exc)

    logger.info("Precompute finished: success=%d failed=%d total=%d", success, failed, len(stores))
    return 0 if failed == 0 else 1


def main() -> int:
    load_dotenv()
    args = _parse_args()
    logging.basicConfig(
        level=getattr(logging, args.log_level),
        format="%(asctime)s [%(levelname)s] %(message)s",
    )
    return run_precompute(
        store_ids=args.store_id,
        limit=args.limit,
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    raise SystemExit(main())
