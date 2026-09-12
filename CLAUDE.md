# Solar Power Prediction Platform — Complete End-to-End Flow

Covers all 8 features: hourly weather gauges, 72h forecasting, demand-based recommendations,
manual re-prediction, RAG-based chart insights, 7-day history, auth + onboarding, demand/storage inputs.

---

## 1. User Journey (Top-Level Flow)

```
┌────────────┐     ┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│  Sign Up   │────▶│ Onboarding  │────▶│  Dashboard   │────▶│ Daily Demand    │
│            │     │ (panel info,│     │ (main app)   │     │ Check-in (24h)  │
│            │     │ location,   │     │              │     │                 │
│            │     │ demand,     │     │              │     │                 │
│            │     │ storage)    │     │              │     │                 │
└────────────┘     └─────────────┘     └──────────────┘     └────────────────┘
```

---

## 2. Sign Up / Onboarding Flow (Feature 7 + 8)

### Step-by-step

```
1. User signs up (email + password)
       │
       ▼
2. Onboarding wizard (multi-step form):

   Step A — Panel Info
     • Panel area (m²)
     • Panel capacity (kW)
   
   Step B — Location
     • User enters address / drops pin on map
     • Backend geocodes → (lat, lon)
     • Backend finds nearest Open-Meteo-supported grid point
       (Open-Meteo works for ANY lat/lon globally — no need to
       "find nearest station", it interpolates automatically.
       But we still snap to a friendly location name for display)
   
   Step C — Daily Demand
     • User enters average daily demand (kWh or kW)
     • Marked as "default demand" — editable anytime from settings
   
   Step D — Storage
     • Battery capacity (kWh)
     • Current charge level (kWh or %)
       │
       ▼
3. All data saved to MongoDB → user profile created
       │
       ▼
4. Redirect to Dashboard
```

### MongoDB Schema: `users`

```json
{
  "_id": "ObjectId",
  "email": "prey@autoflow.ai",
  "password_hash": "bcrypt_hash",
  "created_at": "2026-09-12T10:00:00Z",
  "panel": {
    "area_sqm": 25.0,
    "capacity_kw": 5.0
  },
  "location": {
    "lat": 23.89,
    "lon": 71.19,
    "display_name": "Charanka, Gujarat",
    "timezone": "Asia/Kolkata"
  },
  "demand": {
    "default_daily_kwh": 30.0,
    "last_updated": "2026-09-12T10:00:00Z"
  },
  "storage": {
    "capacity_kwh": 10.0,
    "current_charge_kwh": 6.5,
    "last_updated": "2026-09-12T10:00:00Z"
  },
  "notification_prefs": {
    "email": true,
    "push": true
  }
}
```

**Note on location matching:** Open-Meteo doesn't require finding a "nearest station" — it's a gridded global model that interpolates to any exact lat/lon you send it. So Person 4's job here is simple: geocode the user's address to lat/lon (using a free geocoding API like Nominatim/OpenStreetMap), store it, and use those exact coordinates in every Open-Meteo call for that user. No station-matching logic needed.

---

## 3. Auth Endpoints

```
POST /api/v1/auth/signup
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me                    — current user profile
```

```python
# backend/app/routers/auth.py

from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import SignupRequest, LoginRequest
from app.services.auth_service import create_user, verify_user, create_access_token
from app.services.geocoding_service import geocode_address

router = APIRouter()

@router.post("/api/v1/auth/signup")
async def signup(payload: SignupRequest):
    # payload includes: email, password, panel_area, panel_capacity,
    # address (or lat/lon directly), daily_demand_kwh,
    # storage_capacity_kwh, current_charge_kwh

    lat, lon, display_name = await geocode_address(payload.address)

    user = await create_user({
        "email": payload.email,
        "password": payload.password,
        "panel": {"area_sqm": payload.panel_area, "capacity_kw": payload.panel_capacity},
        "location": {"lat": lat, "lon": lon, "display_name": display_name},
        "demand": {"default_daily_kwh": payload.daily_demand_kwh},
        "storage": {
            "capacity_kwh": payload.storage_capacity_kwh,
            "current_charge_kwh": payload.current_charge_kwh
        }
    })

    token = create_access_token(user["_id"])
    return {"token": token, "user": user}
```

---

## 4. Weather Gauges — Hourly Data (Feature 1)

**Goal:** Show live gauges (GHI, DNI, DHI, Temp, Wind) for the current hour, refreshing hourly.

### Flow

```
Dashboard loads
       │
       ▼
GET /api/v1/weather/current?lat=23.89&lon=71.19
       │
       ▼
Backend calls Open-Meteo (current + next few hours)
       │
       ▼
Extract the row matching "now"
       │
       ▼
Return as gauge-ready JSON
```

```python
# backend/app/routers/weather.py

@router.get("/api/v1/weather/current")
async def get_current_weather(lat: float, lon: float):
    weather_rows = await fetch_weather(lat, lon, hours=1)  # just current hour
    current = weather_rows[0]

    return {
        "timestamp": current["timestamp"],
        "gauges": {
            "ghi": {"value": current["GHI"], "unit": "W/m²", "max": 1200},
            "dni": {"value": current["DNI"], "unit": "W/m²", "max": 1000},
            "dhi": {"value": current["DHI"], "unit": "W/m²", "max": 400},
            "temperature": {"value": current["Temperature"], "unit": "°C", "max": 50},
            "wind_speed": {"value": current["Wind_Speed"], "unit": "m/s", "max": 20}
        }
    }
```

**Frontend refresh strategy:** Poll this endpoint every hour (via `setInterval`), not every few seconds — Open-Meteo forecast data itself only updates hourly at the source, so faster polling wastes requests without new data.

---

## 5. 72-Hour Forecasting (Feature 2) — Cron every 12h + on-demand on data change

**Goal:** Full 72-hour hourly forecast. Two triggers now generate it:

1. **Scheduled** — a cron job runs every 12 hours (e.g., 06:00 and 18:00) and refreshes the forecast for every user automatically.
2. **On-demand** — whenever the user changes their demand or storage values (via the demand check-in, the "update parameters" form, or settings), that change immediately triggers a fresh forecast + recommendation — no waiting for the next 12-hour cycle.

Dashboard load itself does **not** trigger a new forecast — it just displays the latest stored forecast (from whichever trigger fired most recently). This keeps Open-Meteo calls bounded (2×/day/user + occasional on-demand) instead of one per page view.

### Flow — Scheduled (every 12h)

```
Cron fires (06:00 and 18:00, per user's timezone)
       │
       ▼
For each user:
   Read their CURRENT stored demand_kwh, storage_capacity_kwh, current_charge_kwh
   (from their profile — these persist between updates)
       │
       ▼
Fetch 72h weather from Open-Meteo (forecast_days=3)
       │
       ▼
Run all 72 rows through model → 72 predicted AC_POWER values
       │
       ▼
Compute recommendation using the user's current stored demand/storage
       │
       ▼
Save forecast + recommendation to MongoDB (trigger: "scheduled_12h")
       │
       ▼
Dashboard, when next opened, simply reads this latest stored record
```

```python
# backend/app/services/scheduler.py

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.services.forecast_service import run_forecast_for_user

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job("cron", hour="6,18", minute=0)
async def scheduled_forecast_refresh():
    users = await get_all_active_users()
    for user in users:
        await run_forecast_for_user(user, trigger="scheduled_12h")
```

```python
# backend/app/services/forecast_service.py

from app.services.weather_service import fetch_weather
from app.services.prediction_service import predict_power
from app.services.recommendation_engine import generate_recommendation
from app.services.db_service import save_forecast
from datetime import datetime

async def run_forecast_for_user(user: dict, trigger: str, hours: int = 72) -> dict:
    """
    Shared logic used by BOTH the 12h cron and any on-demand trigger
    (demand/storage change, or the manual re-predict button).
    Always reads the user's most current demand/storage from their profile
    UNLESS overridden by an explicit parameter (see repredict endpoint).
    """
    lat, lon = user["location"]["lat"], user["location"]["lon"]

    weather_rows = await fetch_weather(lat, lon, hours=hours)
    predictions = predict_power(weather_rows)

    powers = [p["predicted_ac_power_kw"] for p in predictions]
    today_kwh = sum(p["predicted_ac_power_kw"] for p in predictions[:24])

    demand_kwh = user["demand"]["default_daily_kwh"]
    storage_capacity_kwh = user["storage"]["capacity_kwh"]
    current_charge_kwh = user["storage"]["current_charge_kwh"]

    recommendation = generate_recommendation(
        predicted_generation_kwh=today_kwh,
        demand_kwh=demand_kwh,
        storage_capacity_kwh=storage_capacity_kwh,
        current_charge_kwh=current_charge_kwh
    )

    forecast_record = {
        "user_id": user["_id"],
        "location": {"lat": lat, "lon": lon},
        "generated_at": datetime.utcnow().isoformat(),
        "trigger": trigger,   # "scheduled_12h" | "data_change" | "manual"
        "hourly": predictions,
        "summary": {
            "total_kwh_72h": round(sum(powers), 1),
            "today_kwh": round(today_kwh, 1),
            "peak_kw": max(powers),
            "peak_hour": predictions[powers.index(max(powers))]["timestamp"]
        },
        "demand_snapshot_kwh": demand_kwh,
        "storage_snapshot": {
            "capacity_kwh": storage_capacity_kwh,
            "current_charge_kwh": current_charge_kwh
        },
        "recommendation": recommendation
    }
    await save_forecast(forecast_record)
    return forecast_record
```

### Flow — On-demand (demand or storage changes)

```
User updates demand (via daily check-in) OR storage (via settings/update form)
       │
       ▼
PUT /api/v1/demand/default   or   PUT /api/v1/storage
       │
       ▼
Backend:
   1. Save the new value to the user's profile
   2. IMMEDIATELY call run_forecast_for_user(user, trigger="data_change")
      (reuses the exact same shared function as the cron)
       │
       ▼
Return updated forecast + recommendation
       │
       ▼
Frontend re-renders chart + recommendation right away
```

```python
@router.put("/api/v1/demand/default")
async def update_default_demand(payload: UpdateDemandRequest):
    user = await update_user_field(payload.user_id, "demand.default_daily_kwh", payload.demand_kwh)
    forecast = await run_forecast_for_user(user, trigger="data_change")
    return {"forecast": forecast, "recommendation": forecast["recommendation"]}


@router.put("/api/v1/storage")
async def update_storage(payload: UpdateStorageRequest):
    user = await update_user_fields(payload.user_id, {
        "storage.capacity_kwh": payload.storage_capacity_kwh,
        "storage.current_charge_kwh": payload.current_charge_kwh
    })
    forecast = await run_forecast_for_user(user, trigger="data_change")
    return {"forecast": forecast, "recommendation": forecast["recommendation"]}
```

**Dashboard load itself:**

```python
@router.get("/api/v1/forecast/latest")
async def get_latest_forecast_for_dashboard(user_id: str):
    """
    Dashboard calls this on load — just reads the most recent
    stored forecast, doesn't trigger a new Open-Meteo call.
    """
    forecast = await get_latest_forecast(user_id)
    return {"forecast": forecast, "recommendation": forecast["recommendation"]}
```

**Frontend display:** A single continuous **72-point hourly line chart** (not day-tabs) — x-axis is every hour across the 3 days, y-axis is predicted kW. Optionally mark day boundaries with light vertical gridlines/labels (e.g., "Day 1 | Day 2 | Day 3") purely as a visual aid, but the data itself renders as one unbroken hourly line.

---

## 6. Recommendation Engine — Demand vs Generation (Feature 3)

**Goal:** Compare predicted generation against user's demand, storage level, and flag over/under-generation with actionable advice.

### The Core Logic

```python
# backend/app/services/recommendation_engine.py

def generate_recommendation(
    predicted_generation_kwh: float,
    demand_kwh: float,
    storage_capacity_kwh: float,
    current_charge_kwh: float
) -> dict:
    """
    Compares generation vs demand, factors in storage,
    and returns an actionable recommendation.
    """
    surplus = predicted_generation_kwh - demand_kwh
    available_storage_room = storage_capacity_kwh - current_charge_kwh

    if surplus > 0:
        # Over-generation scenario
        if available_storage_room >= surplus:
            return {
                "status": "over_generation",
                "severity": "info",
                "title": "Excess Generation Expected",
                "message": (
                    f"Generating {predicted_generation_kwh:.0f} kWh vs "
                    f"{demand_kwh:.0f} kWh demand — {surplus:.0f} kWh surplus. "
                    f"Storage can absorb it all."
                ),
                "action": "charge_storage",
                "surplus_kwh": round(surplus, 1)
            }
        else:
            excess_after_storage = surplus - available_storage_room
            return {
                "status": "over_generation",
                "severity": "warning",
                "title": "Over-Generation: Storage Will Fill Up",
                "message": (
                    f"{surplus:.0f} kWh surplus expected, but storage only has "
                    f"{available_storage_room:.0f} kWh room. "
                    f"{excess_after_storage:.0f} kWh will be excess — "
                    f"consider exporting to grid or reducing generation."
                ),
                "action": "export_or_curtail",
                "excess_kwh": round(excess_after_storage, 1)
            }
    else:
        deficit = abs(surplus)
        if current_charge_kwh >= deficit:
            return {
                "status": "under_generation",
                "severity": "info",
                "title": "Deficit Covered by Storage",
                "message": (
                    f"Generating {predicted_generation_kwh:.0f} kWh vs "
                    f"{demand_kwh:.0f} kWh demand — {deficit:.0f} kWh shortfall, "
                    f"but storage covers it."
                ),
                "action": "draw_from_storage",
                "deficit_kwh": round(deficit, 1)
            }
        else:
            grid_needed = deficit - current_charge_kwh
            return {
                "status": "under_generation",
                "severity": "alert",
                "title": "Generation Shortfall — Grid Power Needed",
                "message": (
                    f"{deficit:.0f} kWh shortfall expected. Storage covers "
                    f"{current_charge_kwh:.0f} kWh, remaining "
                    f"{grid_needed:.0f} kWh must come from the grid."
                ),
                "action": "draw_from_grid",
                "grid_kwh_needed": round(grid_needed, 1)
            }
```

### Endpoint

```
GET /api/v1/recommendations?user_id=...
```

```python
@router.get("/api/v1/recommendations")
async def get_recommendations(user_id: str):
    user = await get_user(user_id)
    latest_forecast = await get_latest_forecast(user_id)  # today's 24h slice

    today_generation = latest_forecast["summary"]["daily_breakdown"][0]["total_kwh"]

    recommendation = generate_recommendation(
        predicted_generation_kwh=today_generation,
        demand_kwh=user["demand"]["default_daily_kwh"],
        storage_capacity_kwh=user["storage"]["capacity_kwh"],
        current_charge_kwh=user["storage"]["current_charge_kwh"]
    )

    return recommendation
```

**Your example, worked through:** demand = 1000 kW, generation = 1200 kW → surplus = 200 kW. If storage has room, "charge storage" recommendation. If storage is full, "over-generation — export or curtail" warning. This exact logic is what's coded above (using kWh totals rather than instantaneous kW, since demand/generation should be compared over the same time window — see note below).

**Important unit note:** Your example mixes kW (instantaneous power) with what should really be kWh (energy over a day) for a fair comparison. Recommend: capture demand as **daily kWh** (already decided at signup) and compare against **predicted daily kWh generation** — not instantaneous kW — since generation varies hour to hour but demand is usually planned per day. The code above does this correctly.

---

## 7. Manual Re-Prediction Button — WITH Updated Parameters (Feature 4)

**Goal:** Let the user open a small form ("Update parameters"), enter new values for storage/demand/current charge (e.g., ahead of a big decision), and get a fresh 72h prediction + recommendation based on those new numbers — without waiting for the next dashboard reload.

### Flow

```
User clicks "Re-predict with updated parameters" button
       │
       ▼
A form/modal opens, pre-filled with current values:
   • Demand (kWh)
   • Storage capacity (kWh)
   • Current charge (kWh)
   (user edits any of these)
       │
       ▼
User submits → POST /api/v1/forecast/repredict
   body: {
     user_id, lat, lon, hours: 72,
     demand_kwh,            ← from the form (possibly changed)
     storage_capacity_kwh,  ← from the form (possibly changed)
     current_charge_kwh     ← from the form (possibly changed)
   }
       │
       ▼
Backend:
   1. Fetch FRESH weather from Open-Meteo (live, not cached)
   2. Run through model → 72 predictions
   3. Compute recommendation using the NEW parameters from the form
   4. Save as new forecast record (trigger: "manual")
   5. Also persist these new values back to the user's profile
      (so next dashboard load starts from the updated numbers)
       │
       ▼
Return updated forecast + recommendation
       │
       ▼
Frontend re-renders chart + recommendation card
       (show toast: "Updated just now with your new parameters")
```

This calls the **same shared `run_forecast_for_user()` function** used by the 12h cron and the on-demand data-change trigger (Section 5) — just with `trigger="manual"` and, in this case, the parameters were edited moments before via the form:

```python
@router.post("/api/v1/forecast/repredict")
async def repredict(payload: UpdateParamsRequest):
    # 1. Persist the user's updated parameters
    user = await update_user_fields(payload.user_id, {
        "demand.default_daily_kwh": payload.demand_kwh,
        "storage.capacity_kwh": payload.storage_capacity_kwh,
        "storage.current_charge_kwh": payload.current_charge_kwh
    })

    # 2. Re-run the shared forecast logic immediately, marked "manual"
    forecast = await run_forecast_for_user(user, trigger="manual")

    return {"forecast": forecast, "recommendation": forecast["recommendation"]}
```

**Rate limiting note:** Since this hits Open-Meteo live, add a simple cooldown (e.g., max 1 manual re-predict per 10 minutes per user) to avoid API abuse — a simple check against `last_manual_repredict_at` timestamp in the user doc.

---

## 8. Chart-Based LLM Recommendations (Feature 5) — DEFERRED, not built now

**Status: on hold.** Per your call, this feature is demand-driven and not needed for the current build — parking the design here so it's ready to slot in later without rethinking the architecture.

**When you do build it:** use **Grok API** or **Google AI Studio (Gemini) free tier** instead of Claude — both work the same way for this purpose: you retrieve the real forecast numbers from MongoDB (the "grounding" data), build a compact factual prompt from them, and send that prompt to whichever API you pick. The endpoint shape (`GET /api/v1/insights/chart`), the retrieval step (pull latest forecast + user demand/storage), and the caching strategy (only regenerate when a new forecast is created, not on every page view) all stay the same regardless of which LLM you plug in later — only the `insight_service.py` HTTP call target and payload format change (Gemini and Grok both have simple REST chat-completion style endpoints, similar in spirit to the Claude example this doc previously had).

**To pick back up later:** decide between Grok vs Google AI Studio based on whichever free tier's rate limits suit your expected usage, then implement `generate_chart_insight()` following the same retrieve → prompt → call → cache pattern.

---

## 9. 7-Day Historical Graph (Feature 6)

**Goal:** Show past 7 days of actual predicted-vs-generated performance.

### Flow

```
GET /api/v1/history?user_id=...&days=7
       │
       ▼
Query MongoDB: all forecast records for this user, last 7 days,
               where trigger was the "daily scheduled" one
       │
       ▼
Extract daily_breakdown summaries from each
       │
       ▼
Return as a simple array for the bar/line chart
```

```python
@router.get("/api/v1/history")
async def get_history(user_id: str, days: int = 7):
    cutoff = datetime.utcnow() - timedelta(days=days)

    records = await db.forecasts.find({
        "user_id": user_id,
        "generated_at": {"$gte": cutoff.isoformat()},
        "trigger": "scheduled"
    }).sort("generated_at", 1).to_list(days)

    daily_summary = [
        {
            "date": r["summary"]["daily_breakdown"][0]["date"],
            "total_kwh": r["summary"]["daily_breakdown"][0]["total_kwh"],
            "peak_kw": r["summary"]["daily_breakdown"][0]["peak_kw"],
            "demand_kwh": r.get("demand_snapshot_kwh")  # stored at generation time
        }
        for r in records
    ]

    return {"user_id": user_id, "period_days": days, "daily_summary": daily_summary}
```

**Important:** Store a `demand_snapshot_kwh` field on each forecast record (the user's demand value AT THE TIME the forecast was generated) — since demand is editable, you need the historical value for accurate past comparisons, not today's current demand value.

---

## 10. Daily Demand Check-in Notification (Feature 8, per your answer)

**Goal:** Every 24 hours, ask the user for today's demand BEFORE generating that day's prediction.

### Flow

```
Cron job runs daily (e.g., 6 AM local time per user, or one fixed time for all)
       │
       ▼
For each user:
   Send notification: "What's your demand for today?"
   (channels: push notification / in-app banner / email)
       │
       ▼
User responds via:
   POST /api/v1/demand/checkin
   body: { user_id, todays_demand_kwh }
       │
       ▼
Backend:
   1. Save todays_demand_kwh (as an override for today only,
      doesn't change the "default" demand from signup)
   2. NOW trigger the daily 72h forecast + recommendation generation
       │
       ▼
If user DOESN'T respond within some window (e.g., 2 hours):
   Fall back to their default_daily_kwh from signup
   → proceed with prediction anyway (don't block indefinitely)
```

```python
# backend/app/services/scheduler.py (extended)

@scheduler.scheduled_job("cron", hour=6, minute=0, timezone="Asia/Kolkata")
async def daily_demand_checkin():
    users = await get_all_active_users()
    for user in users:
        await send_notification(
            user_id=user["_id"],
            title="What's today's demand?",
            message="Let us know your expected usage so we can tailor today's forecast.",
            action="demand_checkin"
        )
        # Schedule fallback 2 hours later
        await schedule_fallback_prediction(user["_id"], delay_hours=2)
```

```python
@router.post("/api/v1/demand/checkin")
async def demand_checkin(payload: DemandCheckinRequest):
    user = await save_todays_demand(payload.user_id, payload.todays_demand_kwh)
    await cancel_fallback_prediction(payload.user_id)  # user responded in time

    # This IS a demand change → triggers the shared on-demand forecast flow
    forecast = await run_forecast_for_user(user, trigger="data_change")

    return {"forecast": forecast, "recommendation": forecast["recommendation"]}
```

### MongoDB Schema Addition: `demand_log`

```json
{
  "_id": "ObjectId",
  "user_id": "user_123",
  "date": "2026-09-12",
  "demand_kwh": 32.0,
  "source": "checkin",
  "submitted_at": "2026-09-12T06:45:00Z"
}
```

`source` is either `"checkin"` (user responded) or `"default_fallback"` (used signup default because user didn't respond in time).

---

## 11. Complete Endpoint List (Final)

```
AUTH
POST   /api/v1/auth/signup
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me

WEATHER
GET    /api/v1/weather/current              — for gauges (Feature 1)

FORECASTING
GET    /api/v1/forecast/latest              — dashboard reads latest stored forecast (no new API call)
POST   /api/v1/forecast/repredict            — manual re-predict with updated params (Feature 4)
GET    /api/v1/history?days=7                — 7-day history (Feature 6)
(internal) run_forecast_for_user()           — shared logic used by cron, data-change, and manual triggers

RECOMMENDATIONS
GET    /api/v1/recommendations              — demand vs generation (Feature 3)
—      /api/v1/insights/chart               — DEFERRED (Feature 5, on hold — see Section 8)

DEMAND & STORAGE (each of these also triggers an on-demand forecast)
POST   /api/v1/demand/checkin               — daily demand check-in (Feature 8)
PUT    /api/v1/demand/default               — update default demand
PUT    /api/v1/storage                      — update storage capacity/charge

ALERTS (from earlier design)
POST   /api/v1/alerts/rules
GET    /api/v1/alerts/rules
GET    /api/v1/alerts/history
WS     /ws/{user_id}
```

---

## 12. Full Trigger Timeline — Scheduled + On-Demand

Three things can generate a fresh forecast now: the 12-hour cron, any demand/storage change, and the manual re-predict button. Dashboard load only ever reads the latest one already stored.

```
06:00 & 18:00 (cron, every 12h)  →  run_forecast_for_user() for every active user
                                     (trigger: "scheduled_12h")

06:00  →  (separate cron) Send demand check-in notification to all users
06:00–08:00  →  User responds via /api/v1/demand/checkin
                 → saves new demand → immediately triggers
                   run_forecast_for_user() (trigger: "data_change")
                 → if no response by 08:00, fallback keeps the existing
                   default_daily_kwh (no forced forecast — the 06:00 cron
                   run already covered this cycle)

Anytime the user edits demand (settings) or storage (settings)
   → PUT /api/v1/demand/default or PUT /api/v1/storage
   → saves the change → immediately triggers run_forecast_for_user()
     (trigger: "data_change")

Anytime the user clicks "Update parameters & re-predict"
   → POST /api/v1/forecast/repredict
   → saves edited values → immediately triggers run_forecast_for_user()
     (trigger: "manual")

Whenever the dashboard loads
   → GET /api/v1/forecast/latest
   → just reads whichever forecast record was generated most recently
     by any of the three triggers above — no new Open-Meteo call

Every hour while dashboard is open  →  Refresh weather gauges (current hour snapshot)
```

**Why this design keeps API usage sane:** Open-Meteo gets called at most 2×/day/user from the cron, plus occasionally when the user actually changes something — never once per dashboard page view. That's a small, predictable request volume even with many users.

**Why this matters for MongoDB usage:** every trigger writes a new `forecasts` record with `trigger` set to `"scheduled_12h"`, `"data_change"`, or `"manual"`. The 7-day history endpoint (Section 9) should query across all three trigger types — not filter to one:

```python
records = await db.forecasts.find({
    "user_id": user_id,
    "generated_at": {"$gte": cutoff.isoformat()}
    # no trigger filter — all three trigger types count
}).sort("generated_at", 1).to_list(...)
```

For a clean 7-day chart, take the **last forecast of each calendar day** (in case multiple triggers fired that day) rather than every record.

---

## 13. Updated MongoDB Collections (Full List)

| Collection | Purpose |
|---|---|
| `users` | Profile: panel info, location, demand default, storage |
| `demand_log` | Daily demand check-in history |
| `forecasts` | Every 72h forecast (dashboard_load + manual triggers), with recommendation cached |
| `alert_rules` | User-configured alert thresholds |
| `alert_log` | History of triggered alerts |
| `model_metadata` | Active model version + metrics |

**Note:** no `insight_cache` collection needed yet since Feature 5 (chart insights) is deferred — add one later when that feature is built.

---

## 14. Open Questions / Decisions Still Needed

1. **Geocoding provider** — recommend free OpenStreetMap Nominatim for address → lat/lon (no API key, rate-limited to 1 req/sec, fine for signup-only usage).
2. **Push notifications** — web push (browser) vs email-only for the demand check-in reminder? Web push needs a service worker + VAPID keys; email is simpler to start.
3. **LLM API key storage (for later, Feature 5)** — whichever of Grok / Google AI Studio you land on, the key lives in backend env vars (`.env`), never exposed to frontend.
4. **Which of Grok vs Google AI Studio** for the deferred chart-insight feature — pick when you're ready to build it; no need to decide now.
