from datetime import datetime, timezone

import httpx
from fastapi import HTTPException

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

HOURLY_VARIABLES = [
    "shortwave_radiation",       # GHI, W/m²
    "direct_normal_irradiance",  # DNI, W/m²
    "diffuse_radiation",         # DHI, W/m²
    "temperature_2m",            # °C
    "wind_speed_10m",            # m/s
]


async def fetch_weather(lat: float, lon: float, hours: int = 72) -> list[dict]:
    """
    Fetches hourly weather from Open-Meteo (free, no key) for the given
    coordinates and maps it into the feature shape the model expects:
    GHI, DNI, DHI, Temperature, Wind_Speed, hour, month, timestamp.

    Open-Meteo interpolates to any lat/lon globally — no station matching.
    """
    forecast_days = max(1, min(3, (hours + 23) // 24))

    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": ",".join(HOURLY_VARIABLES),
        "wind_speed_unit": "ms",
        "forecast_days": forecast_days,
        "timezone": "UTC",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(OPEN_METEO_URL, params=params)

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Weather service unavailable")

    data = response.json()
    hourly = data.get("hourly")
    if not hourly:
        raise HTTPException(status_code=502, detail="Weather service returned no data")

    timestamps = hourly["time"]
    ghi = hourly["shortwave_radiation"]
    dni = hourly["direct_normal_irradiance"]
    dhi = hourly["diffuse_radiation"]
    temp = hourly["temperature_2m"]
    wind = hourly["wind_speed_10m"]

    rows = []
    for i, ts in enumerate(timestamps[:hours]):
        dt = datetime.fromisoformat(ts).replace(tzinfo=timezone.utc)
        rows.append({
            "timestamp": dt.isoformat(),
            "GHI": ghi[i],
            "DNI": dni[i],
            "DHI": dhi[i],
            "Temperature": temp[i],
            "Wind_Speed": wind[i],
            "hour": dt.hour,
            "month": dt.month,
        })

    return rows


def _find_current_row(rows: list[dict]) -> dict:
    now = datetime.now(timezone.utc)
    for row in rows:
        row_dt = datetime.fromisoformat(row["timestamp"])
        if row_dt.hour == now.hour and row_dt.date() == now.date():
            return row
    return rows[0]


async def fetch_current_weather(lat: float, lon: float) -> dict:
    rows = await fetch_weather(lat, lon, hours=24)
    return _find_current_row(rows)
