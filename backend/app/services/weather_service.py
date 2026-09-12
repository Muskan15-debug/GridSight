from datetime import datetime, timezone

import httpx
import pandas as pd
import pvlib
from fastapi import HTTPException

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

HOURLY_VARIABLES = [
    "shortwave_radiation",       # GHI, W/m²
    "direct_normal_irradiance",  # DNI, W/m²
    "diffuse_radiation",         # DHI, W/m²
    "temperature_2m",            # °C
    "wind_speed_10m",            # m/s
    "relative_humidity_2m",      # %
]


async def fetch_weather(lat: float, lon: float, hours: int = 72) -> list[dict]:
    """
    Fetches hourly weather from Open-Meteo (free, no key) for the given
    coordinates and maps it into the 12-column feature shape the model
    was trained on: Year, Month, Day, Hour, Minute, Temperature, DHI, DNI,
    GHI, Relative Humidity, Solar Zenith Angle, Wind Speed — plus an extra
    `timestamp` field (not a model input) used elsewhere in the pipeline
    for display, sorting, and hour alignment.

    Open-Meteo doesn't provide solar zenith angle, so it's computed
    locally via pvlib's standard solar position algorithm.

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

    timestamps = hourly["time"][:hours]
    ghi = hourly["shortwave_radiation"]
    dni = hourly["direct_normal_irradiance"]
    dhi = hourly["diffuse_radiation"]
    temp = hourly["temperature_2m"]
    wind = hourly["wind_speed_10m"]
    humidity = hourly["relative_humidity_2m"]

    datetimes = [datetime.fromisoformat(ts).replace(tzinfo=timezone.utc) for ts in timestamps]
    solar_positions = pvlib.solarposition.get_solarposition(pd.DatetimeIndex(datetimes), lat, lon)
    zenith_angles = solar_positions["zenith"].tolist()

    rows = []
    for i, dt in enumerate(datetimes):
        rows.append({
            "timestamp": dt.isoformat(),
            "Year": dt.year,
            "Month": dt.month,
            "Day": dt.day,
            "Hour": dt.hour,
            "Minute": dt.minute,
            "Temperature": temp[i],
            "DHI": dhi[i],
            "DNI": dni[i],
            "GHI": ghi[i],
            "Relative Humidity": humidity[i],
            "Solar Zenith Angle": round(float(zenith_angles[i]), 3),
            "Wind Speed": wind[i],
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
