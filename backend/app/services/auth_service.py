from datetime import datetime, timedelta, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError

from app.core.security import hash_password, verify_password
from app.models.schemas import SignupRequest, UserOut
from app.services.geocoding_service import geocode_address


def _user_doc_to_out(doc: dict) -> UserOut:
    return UserOut(
        id=str(doc["_id"]),
        email=doc["email"],
        created_at=doc["created_at"],
        panel=doc["panel"],
        location=doc["location"],
        demand=doc["demand"],
        storage=doc["storage"],
        notification_prefs=doc["notification_prefs"],
    )


async def create_user(db: AsyncIOMotorDatabase, payload: SignupRequest) -> UserOut:
    lat, lon, display_name, tz_name = await geocode_address(payload.address)
    now = datetime.now(timezone.utc).isoformat()

    user_doc = {
        "email": payload.email.lower(),
        "password_hash": hash_password(payload.password),
        "created_at": now,
        "panel": {
            "area_sqm": payload.panel_area_sqm,
            "capacity_kw": payload.panel_capacity_kw,
        },
        "location": {
            "lat": lat,
            "lon": lon,
            "display_name": display_name,
            "timezone": tz_name,
        },
        "demand": {
            "default_daily_kwh": payload.daily_demand_kwh,
            "last_updated": now,
        },
        "storage": {
            "capacity_kwh": payload.storage_capacity_kwh,
            "current_charge_kwh": payload.current_charge_kwh,
            "last_updated": now,
        },
        "notification_prefs": {"email": True, "push": True},
    }

    try:
        result = await db.users.insert_one(user_doc)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user_doc["_id"] = result.inserted_id
    return _user_doc_to_out(user_doc)


async def authenticate_user(db: AsyncIOMotorDatabase, email: str, password: str) -> UserOut:
    doc = await db.users.find_one({"email": email.lower()})
    if not doc or not verify_password(password, doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return _user_doc_to_out(doc)


async def _get_user_doc_by_id(db: AsyncIOMotorDatabase, user_id: str) -> dict:
    try:
        oid = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=401, detail="Invalid user id")

    doc = await db.users.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return doc


async def get_user_by_id(db: AsyncIOMotorDatabase, user_id: str) -> UserOut:
    doc = await _get_user_doc_by_id(db, user_id)
    return _user_doc_to_out(doc)


async def get_all_users(db: AsyncIOMotorDatabase) -> list[UserOut]:
    docs = await db.users.find().to_list(length=None)
    return [_user_doc_to_out(doc) for doc in docs]


async def update_user_profile(db: AsyncIOMotorDatabase, user_id: str, updates: dict) -> UserOut:
    if updates:
        await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": updates})
    return await get_user_by_id(db, user_id)


async def enforce_manual_repredict_cooldown(
    db: AsyncIOMotorDatabase, user_id: str, cooldown_minutes: int
) -> None:
    doc = await _get_user_doc_by_id(db, user_id)
    last = doc.get("last_manual_repredict_at")
    if last:
        elapsed = datetime.now(timezone.utc) - datetime.fromisoformat(last)
        remaining = timedelta(minutes=cooldown_minutes) - elapsed
        if remaining.total_seconds() > 0:
            raise HTTPException(
                status_code=429,
                detail=f"Please wait {int(remaining.total_seconds())}s before repredicting again",
            )


async def mark_manual_repredict(db: AsyncIOMotorDatabase, user_id: str) -> None:
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"last_manual_repredict_at": datetime.now(timezone.utc).isoformat()}},
    )
