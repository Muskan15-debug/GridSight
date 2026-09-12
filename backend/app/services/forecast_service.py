from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.schemas import UserOut
from app.services.prediction_service import predict_power
from app.services.weather_service import fetch_weather


async def run_forecast_for_user(
    db: AsyncIOMotorDatabase,
    user: UserOut,
    trigger: str,
    hours: int = 72,
) -> dict:
    """
    Shared logic for every forecast trigger: the 12h cron, a demand/storage
    change, and the manual re-predict button (step 4 wires those callers in).
    Always reads the user's CURRENT stored demand/storage from their profile.

    trigger: "scheduled_12h" | "data_change" | "manual"
    """
    lat, lon = user.location.lat, user.location.lon

    weather_rows = await fetch_weather(lat, lon, hours=hours)
    predictions = predict_power(weather_rows)

    powers = [p["predicted_ac_power_kw"] for p in predictions]
    today_kwh = sum(powers[:24])
    peak_kw = max(powers)
    peak_hour = predictions[powers.index(peak_kw)]["timestamp"]

    forecast_record = {
        "user_id": user.id,
        "location": {"lat": lat, "lon": lon},
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "trigger": trigger,
        "hourly": predictions,
        "summary": {
            "total_kwh_72h": round(sum(powers), 1),
            "today_kwh": round(today_kwh, 1),
            "peak_kw": round(peak_kw, 3),
            "peak_hour": peak_hour,
        },
        "demand_snapshot_kwh": user.demand.default_daily_kwh,
        "storage_snapshot": {
            "capacity_kwh": user.storage.capacity_kwh,
            "current_charge_kwh": user.storage.current_charge_kwh,
        },
        "recommendation": None,  # TODO(step 5): plug in generate_recommendation()
    }

    result = await db.forecasts.insert_one(forecast_record)
    forecast_record["_id"] = str(result.inserted_id)
    return forecast_record


async def get_latest_forecast(db: AsyncIOMotorDatabase, user_id: str) -> dict | None:
    doc = await db.forecasts.find_one({"user_id": user_id}, sort=[("generated_at", -1)])
    if doc is None:
        return None
    doc["_id"] = str(doc["_id"])
    return doc
