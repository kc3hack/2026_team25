# ============================================
# services/google_routes.py — Google Routes API client
# KRP起点から目的地までの徒歩ルートを取得
# ============================================

import os
import time
from typing import Any

import httpx

DEFAULT_ORIGIN_LAT = float(os.environ.get("KRP_ORIGIN_LAT", "34.9937"))
DEFAULT_ORIGIN_LNG = float(os.environ.get("KRP_ORIGIN_LNG", "135.7467"))
DEFAULT_TIMEOUT_SEC = 8.0
DEFAULT_RETRIES = 2
ROUTES_API_URL = "https://routes.googleapis.com/directions/v2:computeRoutes"


class GoogleRoutesError(RuntimeError):
    """Google Routes API related error."""


class GoogleRoutesConfigError(GoogleRoutesError):
    """Configuration error (e.g. missing API key)."""


class GoogleRoutesRequestError(GoogleRoutesError):
    """Transport or HTTP error."""


class GoogleRoutesResponseError(GoogleRoutesError):
    """Invalid API response shape."""


def _parse_duration_seconds(duration_value: Any) -> int:
    if not isinstance(duration_value, str) or not duration_value.endswith("s"):
        raise GoogleRoutesResponseError(f"Invalid duration value: {duration_value}")

    raw = duration_value[:-1]
    try:
        seconds = float(raw)
    except ValueError as exc:
        raise GoogleRoutesResponseError(f"Invalid duration number: {duration_value}") from exc

    return max(0, int(round(seconds)))


def _build_request_body(
    destination_lat: float,
    destination_lng: float,
    origin_lat: float,
    origin_lng: float,
) -> dict[str, Any]:
    return {
        "origin": {
            "location": {
                "latLng": {"latitude": origin_lat, "longitude": origin_lng},
            }
        },
        "destination": {
            "location": {
                "latLng": {"latitude": destination_lat, "longitude": destination_lng},
            }
        },
        "travelMode": "WALK",
        "routingPreference": "TRAFFIC_UNAWARE",
        "languageCode": "ja-JP",
        "units": "METRIC",
    }


def compute_walking_route(
    destination_lat: float,
    destination_lng: float,
    *,
    origin_lat: float | None = None,
    origin_lng: float | None = None,
    api_key: str | None = None,
    timeout_sec: float = DEFAULT_TIMEOUT_SEC,
    retries: int = DEFAULT_RETRIES,
    client: httpx.Client | None = None,
) -> dict[str, int]:
    """
    Return walking route metrics from origin to destination.

    Returns:
        {"duration_sec": int, "distance_m": int}
    """
    resolved_key = api_key or os.environ.get("GOOGLE_MAPS_API_KEY")
    if not resolved_key:
        raise GoogleRoutesConfigError("GOOGLE_MAPS_API_KEY is not set")

    resolved_origin_lat = DEFAULT_ORIGIN_LAT if origin_lat is None else origin_lat
    resolved_origin_lng = DEFAULT_ORIGIN_LNG if origin_lng is None else origin_lng
    body = _build_request_body(
        destination_lat=destination_lat,
        destination_lng=destination_lng,
        origin_lat=resolved_origin_lat,
        origin_lng=resolved_origin_lng,
    )
    headers = {
        "X-Goog-Api-Key": resolved_key,
        "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
        "Content-Type": "application/json",
    }
    attempts = max(1, retries + 1)
    last_error: Exception | None = None

    def _request(active_client: httpx.Client) -> httpx.Response:
        return active_client.post(
            ROUTES_API_URL,
            json=body,
            headers=headers,
        )

    managed_client = client is None
    active_client = client or httpx.Client(timeout=timeout_sec)

    try:
        for attempt in range(1, attempts + 1):
            try:
                response = _request(active_client)
            except httpx.HTTPError as exc:
                last_error = exc
                if attempt < attempts:
                    time.sleep(0.25 * attempt)
                    continue
                raise GoogleRoutesRequestError(f"Routes request failed: {exc}") from exc

            if response.status_code >= 500 and attempt < attempts:
                time.sleep(0.25 * attempt)
                continue

            if response.status_code >= 400:
                raise GoogleRoutesRequestError(
                    f"Routes request failed: status={response.status_code}, body={response.text[:200]}"
                )

            try:
                payload = response.json()
            except ValueError as exc:
                raise GoogleRoutesResponseError("Routes response is not JSON") from exc

            routes = payload.get("routes")
            if not isinstance(routes, list) or not routes:
                raise GoogleRoutesResponseError("No routes returned")

            route = routes[0]
            distance_raw = route.get("distanceMeters")
            if not isinstance(distance_raw, int):
                raise GoogleRoutesResponseError(f"Invalid distanceMeters: {distance_raw}")

            duration_sec = _parse_duration_seconds(route.get("duration"))
            return {
                "duration_sec": max(0, duration_sec),
                "distance_m": max(0, distance_raw),
            }

        if last_error is not None:
            raise GoogleRoutesRequestError(str(last_error))
        raise GoogleRoutesRequestError("Routes request failed unexpectedly")
    finally:
        if managed_client:
            active_client.close()
