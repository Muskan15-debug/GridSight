# GridSight — Project Brief for Claude Code (Initial Prompt)

## Problem Statement

GridSight is a solar power prediction and decision-support platform. It predicts
how much AC power a user's solar panel will generate over the next 72 hours,
using live weather forecasts fed into a pre-trained ML model. It then compares
that predicted generation against the user's daily energy demand and battery
storage level, and gives a clear recommendation: charge storage, export excess,
draw from storage, or draw from the grid.

The ML model itself is being trained separately (NSRDB-based, physics-formula
target) and will be dropped into the backend later as a `.joblib` file. **This
build is backend + frontend only** — do not build or retrain the model. Treat
the model as a black box behind one prediction function/service that we will
wire a real file into later; stub it with a clearly-marked mock in the meantime.

## Repo Structure (already exists)

```
gridsight/
├── frontend/     ← build this
├── backend/      ← build this
```

Both folders exist but are currently empty (or near-empty) scaffolds. Do not
create a different top-level layout — work inside `frontend/` and `backend/`.

## Tech Stack (fixed — do not substitute)

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python, async) |
| Frontend | React + D3.js (for charts) |
| Database | MongoDB |
| Live weather | Open-Meteo API (free, no key, no signup) |
| ML model | Pre-trained, provided later as `.joblib` — stub for now |
| Scheduler | APScheduler (in-process, inside FastAPI) |
| Auth | Email + password, JWT-based sessions |

## Core Features (build all of these)

1. **Sign up / login** — captures panel area (m²), panel capacity (kW),
   location (address → geocoded to lat/lon), daily energy demand (kWh,
   editable later), battery storage (capacity kWh + current charge kWh).
2. **Weather gauges** — current-hour GHI, DNI, DHI, temperature, wind speed,
   fetched from Open-Meteo, refreshed hourly on the frontend.
3. **72-hour forecast** — hourly predicted AC power for the next 72 hours,
   rendered as ONE continuous 72-point hourly line chart (not day-tabs, not
   a bar chart per day). Forecast generation triggers:
   - A cron job every 12 hours (06:00 and 18:00) that refreshes every user's
     forecast automatically using their currently stored demand/storage.
   - Immediately, on-demand, whenever the user changes demand or storage
     (via daily check-in, settings, or the manual re-predict form).
   - Dashboard load itself does NOT trigger a new forecast — it reads
     whichever forecast was generated most recently by one of the above.
4. **Recommendation engine** — compares predicted daily generation (kWh)
   against demand (kWh), factoring in storage capacity and current charge,
   and returns one of: charge_storage, export_or_curtail, draw_from_storage,
   draw_from_grid — with a plain-language message and severity.
5. **Manual re-predict button** — opens a small form pre-filled with current
   demand/storage/current-charge; on submit, saves the new values to the
   user's profile AND immediately triggers a fresh forecast + recommendation.
6. **Daily demand check-in** — once every 24 hours, notify the user to enter
   today's demand. If they respond, save it and trigger an on-demand forecast.
   If they don't respond within ~2 hours, silently fall back to their default
   demand value from signup — never block prediction indefinitely.
7. **7-day historical graph** — last 7 days of daily total kWh generated vs
   demand, one data point per calendar day (last forecast of each day if
   multiple were generated that day).
8. **Alerts** — user-configurable threshold rules (e.g., "alert me if any
   hour's predicted power drops below 2 kW") plus system-detected anomalies
   (sudden GHI drop, wind spike, night-time non-zero prediction, multi-day
   declining trend). Alerts run every time a new forecast is generated
   (all three triggers from #3), not on a separate schedule.

**Explicitly out of scope for this build:** the chart-insight LLM
recommendation feature (RAG-style, using Grok or Google AI Studio) is
DEFERRED — do not build it, do not stub it, do not add a placeholder
endpoint for it. It will be designed and added in a later phase.

## Full Reference Document

The complete architecture — every endpoint, every MongoDB collection schema,
every service's inner logic, full flow diagrams for each feature — is in the
attached `solar-full-product-flow.md`. That document is the source of truth
for exact endpoint paths, request/response shapes, and MongoDB document
structures. Read it fully before writing any code. Where this brief and that
document differ, the document wins (this brief is a summary for orientation).

## MongoDB Collections (summary — see full doc for exact fields)

- `users` — profile: panel info, location, demand default, storage
- `demand_log` — daily demand check-in history
- `forecasts` — every generated forecast (all three trigger types), with
  the recommendation cached on the same document
- `alert_rules` — user-configured alert thresholds
- `alert_log` — history of triggered alerts

## API Surface (summary — see full doc for request/response bodies)

```
AUTH
POST /api/v1/auth/signup
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me

WEATHER
GET  /api/v1/weather/current

FORECASTING
GET  /api/v1/forecast/latest
POST /api/v1/forecast/repredict
GET  /api/v1/history?days=7

RECOMMENDATIONS
GET  /api/v1/recommendations

DEMAND & STORAGE
POST /api/v1/demand/checkin
PUT  /api/v1/demand/default
PUT  /api/v1/storage

ALERTS
POST /api/v1/alerts/rules
GET  /api/v1/alerts/rules
GET  /api/v1/alerts/history
WS   /ws/{user_id}
```

## Model Integration Point (stub this precisely)

Create ONE function, isolated in its own module, that the rest of the backend
calls for every prediction:

```python
# backend/app/ml/predictor.py

def predict_ac_power(features: dict) -> float:
    """
    features keys: GHI, DNI, DHI, Temperature, Wind_Speed, hour, month
    Returns predicted AC power in kW.

    STUB IMPLEMENTATION — replace when model_v1.joblib is provided.
    Do not delete this docstring note when replacing.
    """
    # Temporary mock: rough daylight-shaped curve so the frontend has
    # something believable to render during development.
    ...
```

Everything downstream (forecast service, recommendation engine) should call
this one function — never inline a mock prediction elsewhere. That's the only
place we'll touch when the real model file arrives.

## Build Order (please follow this sequence, not all at once)

1. Backend skeleton: FastAPI app, MongoDB connection, config/env setup, auth
   (signup/login/JWT), user profile CRUD.
2. Weather service: Open-Meteo client, feature mapping, the `/weather/current`
   endpoint.
3. Model stub + prediction service + the shared `run_forecast_for_user()`
   function described in the full doc.
4. Forecast endpoints (`/forecast/latest`, `/forecast/repredict`), the 12h
   cron via APScheduler, demand/storage PUT endpoints that trigger on-demand
   forecasts.
5. Recommendation engine.
6. Alerts: rules CRUD, anomaly detection, alert engine wired to run after
   every forecast generation, WebSocket dispatch.
7. Demand check-in flow + notification + fallback timer.
8. Frontend: auth pages → onboarding wizard → dashboard shell → weather
   gauges → 72h line chart (D3.js) → recommendation card → 7-day history
   chart → alerts UI → manual re-predict form.

Stop and show me the result after each numbered step — don't run ahead to
step 4 before step 1-3 are working and reviewed.

## What "done" looks like for this phase

- Backend runs locally, all endpoints in the summary above respond with
  correctly-shaped JSON (using the stubbed model).
- Frontend runs locally, connects to the backend, and a user can sign up,
  complete onboarding, see the dashboard populate with a 72h chart (from
  stubbed predictions), see a recommendation, and trigger a manual re-predict.
- MongoDB collections match the schemas in the full doc.
- No code related to the deferred chart-insight/RAG feature exists anywhere.
