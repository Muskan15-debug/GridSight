import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.services.auth_service import get_all_users
from app.services.forecast_service import run_forecast_for_user

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def _scheduled_forecast_refresh(db: AsyncIOMotorDatabase) -> None:
    users = await get_all_users(db)
    for user in users:
        try:
            await run_forecast_for_user(db, user, trigger="scheduled_12h")
        except Exception:
            logger.exception("Scheduled forecast refresh failed for user %s", user.id)


def start_scheduler(db: AsyncIOMotorDatabase) -> None:
    scheduler.add_job(
        _scheduled_forecast_refresh,
        "cron",
        hour="6,18",
        minute=0,
        args=[db],
        id="scheduled_forecast_refresh",
        replace_existing=True,
    )
    scheduler.start()


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
