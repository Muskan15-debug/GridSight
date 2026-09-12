from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.deps import get_current_user
from app.db import get_db
from app.models.schemas import UpdateDemandRequest, UserOut
from app.services.auth_service import update_user_profile
from app.services.forecast_service import recompute_recommendation_for_latest_forecast

router = APIRouter(prefix="/api/v1/demand", tags=["demand"])


@router.put("/default")
async def update_default_demand(
    payload: UpdateDemandRequest,
    current_user: UserOut = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Saves the new default demand and re-scores the recommendation against
    the existing latest forecast's predicted generation — no new weather
    fetch or model inference.
    """
    now = datetime.now(timezone.utc).isoformat()
    updated_user = await update_user_profile(db, current_user.id, {
        "demand.default_daily_kwh": payload.demand_kwh,
        "demand.last_updated": now,
    })

    result = await recompute_recommendation_for_latest_forecast(db, updated_user)
    if result is None:
        raise HTTPException(status_code=404, detail="No forecast has been generated yet")

    forecast, recommendation = result
    return {"forecast": forecast, "recommendation": recommendation}
