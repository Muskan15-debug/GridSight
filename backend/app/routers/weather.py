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
            "dni": {"value": current["DNI"], "unit": "W/m²", "max": 1000},
            "dhi": {"value": current["DHI"], "unit": "W/m²", "max": 400},
            "temperature": {"value": current["Temperature"], "unit": "°C", "max": 50},
            "wind_speed": {"value": current["Wind_Speed"], "unit": "m/s", "max": 20},
        },
    }
