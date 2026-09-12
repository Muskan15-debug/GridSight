from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.deps import get_current_user
from app.db import get_db
from app.models.schemas import UpdateDemandRequest, UserOut
from app.services.auth_service import update_user_profile
from app.services.forecast_service import run_forecast_for_user

router = APIRouter(prefix="/api/v1/demand", tags=["demand"])


@router.put("/default")
async def update_default_demand(
    payload: UpdateDemandRequest,
    current_user: UserOut = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Updating the default demand immediately triggers a fresh forecast."""
    now = datetime.now(timezone.utc).isoformat()
    updated_user = await update_user_profile(db, current_user.id, {
        "demand.default_daily_kwh": payload.demand_kwh,
        "demand.last_updated": now,
    })

    forecast = await run_forecast_for_user(db, updated_user, trigger="data_change")
    return {"forecast": forecast, "recommendation": forecast["recommendation"]}
