from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.deps import get_current_user
from app.db import get_db
from app.models.schemas import UpdateProfileRequest, UserOut
from app.services.auth_service import update_user_profile
from app.services.geocoding_service import geocode_address, resolve_timezone

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("/me", response_model=UserOut)
async def read_profile(current_user: UserOut = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
async def update_profile(
    payload: UpdateProfileRequest,
    current_user: UserOut = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    updates: dict = {}
    if payload.panel_area_sqm is not None:
        updates["panel.area_sqm"] = payload.panel_area_sqm
    if payload.panel_capacity_kw is not None:
        updates["panel.capacity_kw"] = payload.panel_capacity_kw
    if payload.lat is not None and payload.lon is not None:
        # Coordinates already known (e.g. map-picked) — skip forward
        # geocoding, but still resolve timezone locally from lat/lon.
        updates["location.lat"] = payload.lat
        updates["location.lon"] = payload.lon
        updates["location.display_name"] = payload.display_name or f"{payload.lat}, {payload.lon}"
        updates["location.timezone"] = resolve_timezone(payload.lat, payload.lon)
    elif payload.address is not None:
        lat, lon, display_name, tz_name = await geocode_address(payload.address)
        updates["location.lat"] = lat
        updates["location.lon"] = lon
        updates["location.display_name"] = display_name
        updates["location.timezone"] = tz_name
    if payload.notification_email is not None:
        updates["notification_prefs.email"] = payload.notification_email
    if payload.notification_push is not None:
        updates["notification_prefs.push"] = payload.notification_push

    return await update_user_profile(db, current_user.id, updates)
