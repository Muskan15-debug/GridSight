from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.deps import get_current_user
from app.db import get_db
from app.models.schemas import UserOut

router = APIRouter(prefix="/api/v1/history", tags=["history"])


@router.get("")
async def get_history(
    days: int = 7,
    current_user: UserOut = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Last N days of daily generation vs demand, one point per calendar day —
    the last forecast generated on each day (all three trigger types count).
    Each day's total_kwh/peak_kw come from that forecast's first 24 hourly
    entries, since forecast records don't store a separate daily_breakdown.
    """
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    cursor = db.forecasts.find(
        {"user_id": current_user.id, "generated_at": {"$gte": cutoff}}
    ).sort("generated_at", 1)
    records = await cursor.to_list(length=None)

    latest_by_day: dict[str, dict] = {}
    for r in records:
        day = r["generated_at"][:10]
        latest_by_day[day] = r  # ascending order, so the last write per day wins

    daily_summary = []
    for day in sorted(latest_by_day.keys()):
        r = latest_by_day[day]
        today_hours = r["hourly"][:24]
        peak_kw = max((h["predicted_ac_power_kw"] for h in today_hours), default=0.0)
        daily_summary.append({
            "date": day,
            "total_kwh": r["summary"]["today_kwh"],
            "peak_kw": round(peak_kw, 3),
            "demand_kwh": r.get("demand_snapshot_kwh"),
        })

    return {"user_id": current_user.id, "period_days": days, "daily_summary": daily_summary}
