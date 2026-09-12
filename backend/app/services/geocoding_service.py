import httpx
from fastapi import HTTPException
from timezonefinder import TimezoneFinder

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"

_timezone_finder = TimezoneFinder()


async def geocode_address(address: str) -> tuple[float, float, str, str | None]:
    """
    Free geocoding via OpenStreetMap Nominatim (no API key).
    Returns (lat, lon, display_name, timezone). Open-Meteo works for any
    lat/lon globally, so no "nearest station" matching is needed here.

    Timezone is resolved locally from lat/lon via timezonefinder (pure
    Python, no API key, no network call) — Nominatim doesn't provide it.
    """
    params = {"q": address, "format": "json", "limit": 1}
    headers = {"User-Agent": "GridSight/1.0 (solar-forecast-app)"}

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(NOMINATIM_URL, params=params, headers=headers)

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Geocoding service unavailable")

    results = response.json()
    if not results:
        raise HTTPException(status_code=422, detail=f"Could not geocode address: {address}")

    result = results[0]
    lat, lon = float(result["lat"]), float(result["lon"])
    display_name = result.get("display_name", address)
    tz_name = _timezone_finder.timezone_at(lat=lat, lng=lon)

    return lat, lon, display_name, tz_name


def resolve_timezone(lat: float, lon: float) -> str | None:
    return _timezone_finder.timezone_at(lat=lat, lng=lon)


async def reverse_geocode(lat: float, lon: float) -> str:
    """
    Free reverse geocoding via OpenStreetMap Nominatim (no API key).
    Turns a map-picked (lat, lon) into a human-readable display name.
    """
    params = {"lat": lat, "lon": lon, "format": "json"}
    headers = {"User-Agent": "GridSight/1.0 (solar-forecast-app)"}

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(NOMINATIM_REVERSE_URL, params=params, headers=headers)

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Geocoding service unavailable")

    result = response.json()
    if not result or "display_name" not in result:
        raise HTTPException(status_code=422, detail="Could not resolve a location for these coordinates")

    return result["display_name"]
