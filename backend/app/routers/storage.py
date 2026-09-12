from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.deps import get_current_user
from app.db import get_db
from app.models.schemas import UpdateStorageRequest, UserOut
from app.services.auth_service import update_user_profile
from app.services.forecast_service import recompute_recommendation_for_latest_forecast

router = APIRouter(prefix="/api/v1/storage", tags=["storage"])


@router.put("")
async def update_storage(
    payload: UpdateStorageRequest,
    current_user: UserOut = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Saves the new storage capacity/charge and re-scores the recommendation
    against the existing latest forecast's predicted generation — no new
    weather fetch or model inference.
    """
    now = datetime.now(timezone.utc).isoformat()
    updated_user = await update_user_profile(db, current_user.id, {
        "storage.capacity_kwh": payload.storage_capacity_kwh,
        "storage.current_charge_kwh": payload.current_charge_kwh,
        "storage.last_updated": now,
    })

    result = await recompute_recommendation_for_latest_forecast(db, updated_user)
    if result is None:
        raise HTTPException(status_code=404, detail="No forecast has been generated yet")

    forecast, recommendation = result
    return {"forecast": forecast, "recommendation": recommendation}
