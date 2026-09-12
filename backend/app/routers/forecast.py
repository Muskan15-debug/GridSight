from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.deps import get_current_user
from app.db import get_db
from app.models.schemas import RepredictRequest, UserOut
from app.services.auth_service import update_user_profile
from app.services.forecast_service import get_latest_forecast, run_forecast_for_user

router = APIRouter(prefix="/api/v1/forecast", tags=["forecast"])


@router.get("/latest")
async def get_latest(
    current_user: UserOut = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Dashboard load reads whichever forecast was generated most recently by
    the 12h cron, a demand/storage change, or a manual re-predict — it
    never triggers a new Open-Meteo call itself.
    """
    forecast = await get_latest_forecast(db, current_user.id)
    if forecast is None:
        raise HTTPException(status_code=404, detail="No forecast has been generated yet")
    return {"forecast": forecast, "recommendation": forecast["recommendation"]}


@router.post("/repredict")
async def repredict(
    payload: RepredictRequest,
    current_user: UserOut = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Re-runs the forecast immediately with user-edited demand/storage values
    from the "Update parameters" form, using live (not cached) weather.
    Rate-limited since this always hits Open-Meteo.
    """
    now = datetime.now(timezone.utc).isoformat()
    updated_user = await update_user_profile(db, current_user.id, {
        "demand.default_daily_kwh": payload.demand_kwh,
        "demand.last_updated": now,
        "storage.capacity_kwh": payload.storage_capacity_kwh,
        "storage.current_charge_kwh": payload.current_charge_kwh,
        "storage.last_updated": now,
    })

    forecast = await run_forecast_for_user(db, updated_user, trigger="manual")
    return {"forecast": forecast, "recommendation": forecast["recommendation"]}
