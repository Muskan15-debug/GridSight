from fastapi import APIRouter, Query

from app.services.weather_service import fetch_current_weather

router = APIRouter(prefix="/api/v1/weather", tags=["weather"])


@router.get("/current")
async def get_current_weather(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
):
    current = await fetch_current_weather(lat, lon)

    return {
        "timestamp": current["timestamp"],
        "gauges": {
            "ghi": {"value": current["GHI"], "unit": "W/m²", "max": 1200},
            "temperature": {"value": current["Temperature"], "unit": "°C", "max": 50},
            "wind_speed": {"value": current["Wind Speed"], "unit": "m/s", "max": 20},
            "relative_humidity": {"value": current["Relative Humidity"], "unit": "%", "max": 100},
            "solar_zenith_angle": {"value": current["Solar Zenith Angle"], "unit": "°", "max": 180},
        },
    }
