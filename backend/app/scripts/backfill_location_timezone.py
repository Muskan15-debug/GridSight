"""
One-off backfill for users created before location.timezone was populated.
Computes timezone locally from each user's already-stored lat/lon (no
re-geocoding, no network call) — safe to re-run, only touches null values.

Usage (from backend/, with the venv active and .env configured):
    python -m app.scripts.backfill_location_timezone
"""
import asyncio

from motor.motor_asyncio import AsyncIOMotorClient
from timezonefinder import TimezoneFinder

from app.config import settings


async def main() -> None:
    client = AsyncIOMotorClient(settings.mongo_uri)
    db = client[settings.mongo_db_name]
    tf = TimezoneFinder()

    updated = 0
    skipped = 0
    async for user in db.users.find({"location.timezone": None}):
        location = user["location"]
        tz_name = tf.timezone_at(lat=location["lat"], lng=location["lon"])
        if tz_name is None:
            skipped += 1
            continue
        await db.users.update_one({"_id": user["_id"]}, {"$set": {"location.timezone": tz_name}})
        updated += 1

    print(f"Backfilled timezone for {updated} user(s); {skipped} could not be resolved.")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
