import httpx
from fastapi import HTTPException
from timezonefinder import TimezoneFinder

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

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
