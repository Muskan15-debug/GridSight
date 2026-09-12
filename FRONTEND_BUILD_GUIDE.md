# GridSight Frontend — Build Guide for Claude Code

## Project Context

GridSight is a solar power prediction platform. The backend is **fully complete**
at `D:\gridSight\backend` (FastAPI + MongoDB Atlas), running on `http://localhost:8000`.
A real XGBoost model is integrated — it returns realistic predictions (3–5 kW range
for a 5 kW rooftop panel, 72-hour hourly forecast).

This file is the complete frontend build specification. Execute it in phases —
stop after each phase and wait for confirmation before proceeding.

---

## Tech Stack (fixed — do not substitute)

- **Framework:** React (Vite scaffold)
- **Charts:** D3.js (all charts — no Recharts, no Chart.js)
- **HTTP client:** Axios
- **Routing:** React Router v6
- **Styling:** Tailwind CSS
- **State:** React useState / useEffect / Context (no Redux needed)

---

## Folder Structure (create exactly this)

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Onboarding.jsx
│   │   ├── Dashboard.jsx
│   │   ├── History.jsx
│   │   └── Settings.jsx
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.jsx
│   │   ├── dashboard/
│   │   │   ├── WeatherGauges.jsx
│   │   │   ├── ForecastChart.jsx       ← D3.js 72-point line chart
│   │   │   ├── RecommendationCard.jsx
│   │   │   ├── RepredictModal.jsx
│   │   │   └── CurrentPowerCard.jsx
│   │   ├── history/
│   │   │   └── HistoryChart.jsx        ← D3.js 7-day bar chart
│   │   └── common/
│   │       ├── Navbar.jsx
│   │       ├── LoadingSpinner.jsx
│   │       └── ErrorBanner.jsx
│   ├── services/
│   │   └── api.js                      ← Axios base client
│   ├── context/
│   │   └── AuthContext.jsx             ← JWT + user profile global state
│   ├── utils/
│   │   └── formatters.js               ← kW formatting, date helpers
│   └── App.jsx                         ← Router + route definitions
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## API Base URL & Axios Setup

```javascript
// src/services/api.js

import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If 401/403 comes back → clear token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
```

---

## Route Protection Rules

```
No token in localStorage          → redirect to /login
Token exists but no location.lat  → redirect to /onboarding (signup incomplete)
Token + location.lat exists       → allow through to dashboard/history/settings
```

```javascript
// src/components/auth/ProtectedRoute.jsx
// Reads user from AuthContext, applies the two rules above
```

---

## Backend API Reference (what each page calls)

| Page / Component | Endpoint | Method |
|---|---|---|
| Login | `/api/v1/auth/login` | POST |
| Signup | `/api/v1/auth/signup` | POST |
| Onboarding | `/api/v1/users/me` (PUT after signup) | PUT |
| Dashboard — gauges | `/api/v1/weather/current?lat=&lon=` | GET |
| Dashboard — forecast chart | `/api/v1/forecast/latest` | GET |
| Dashboard — recommendation | included in forecast/latest response | — |
| Dashboard — re-predict modal | `/api/v1/forecast/repredict` | POST |
| History page | `/api/v1/history?days=7` | GET |
| Settings — update demand | `/api/v1/demand/default` | PUT |
| Settings — update storage | `/api/v1/storage` | PUT |
| Settings — update profile | `/api/v1/users/me` | PUT |
| Auth — get current user | `/api/v1/auth/me` | GET |

---

## Page-by-Page Specification

### Page 1: Login (`/login`)

Simple centered card:
- Email + password fields
- "Login" button → POST `/api/v1/auth/login` → save token to localStorage → redirect to `/dashboard`
- "Don't have an account? Sign up" link → `/signup`
- Show error message on 401

---

### Page 2: Signup (`/signup`)

Two-step form:

**Step 1 — Account**
- Email, password fields
- POST `/api/v1/auth/signup` with basic info:
  ```json
  { "email", "password", "panel_area_sqm", "panel_capacity_kw",
    "address", "daily_demand_kwh", "storage_capacity_kwh", "current_charge_kwh" }
  ```
- On success → save token → redirect to `/onboarding`

**Step 2 — is actually Onboarding (see below)**

Note: The backend signup endpoint takes ALL fields at once including panel/location/demand/storage — so the signup form should collect everything before submitting. Use a multi-step form UX but one API call at the end.

---

### Page 3: Onboarding (`/onboarding`)

Multi-step wizard — shown only if user has no `location.lat` after signup.
Four steps with a progress indicator:

**Step A — Panel Info**
- Panel area (m²) input
- Panel capacity (kW) input

**Step B — Location**
- Address text input (free text — backend geocodes it)
- Show a preview of the resolved location name after input

**Step C — Daily Demand**
- Daily energy demand (kWh) slider or number input
- Helper text: "Average electricity your home/facility uses per day"

**Step D — Storage**
- Battery capacity (kWh)
- Current charge level (kWh or %)
- On submit → PUT `/api/v1/users/me` → redirect to `/dashboard`

---

### Page 4: Dashboard (`/dashboard`) — MAIN PAGE

This is the most important page. Layout:

```
┌─────────────────────────────────────────────────┐
│  📍 Charanka, Gujarat    [Re-predict button]     │
├──────────────┬──────────────────────────────────┤
│ Current Power│  Weather Gauges                  │
│ Card         │  (GHI / Temp / Wind / Humidity)  │
├──────────────┴──────────────────────────────────┤
│  72-Hour Forecast Line Chart (D3.js)            │
│  [Day 1 | Day 2 | Day 3] boundary markers       │
├─────────────────────────────────────────────────┤
│  Recommendation Card                            │
└─────────────────────────────────────────────────┘
```

#### Component: CurrentPowerCard

- Shows the current hour's `predicted_ac_power_kw` from the forecast
- Find current hour by matching `timestamp` in `forecast.hourly` to now
- Display: large number + "kW" + colored status dot (green=good, yellow=moderate, red=low)
- Thresholds: green if > 70% of panel capacity, yellow if 30–70%, red if < 30%

#### Component: WeatherGauges

- Calls `GET /api/v1/weather/current?lat=&lon=` on load, refreshes every 60 minutes
- Show 5 gauges: GHI, Temperature, Wind Speed, Relative Humidity, Solar Zenith Angle
- Render as simple arc/semicircle gauges using SVG (D3.js or raw SVG)
- Each gauge: current value, unit, label

#### Component: ForecastChart (D3.js — critical)

- Calls `GET /api/v1/forecast/latest` on dashboard load
- Renders ONE continuous 72-point hourly line chart
- X-axis: timestamps for all 72 hours
- Y-axis: predicted AC power (kW)
- Light vertical dashed lines + labels at 24h and 48h boundaries ("Day 2", "Day 3")
- Highlight current hour with a vertical marker line
- Tooltip on hover: timestamp + kW value
- If no forecast exists yet (404) → show "No forecast yet — click Re-predict to generate one"

#### Component: RecommendationCard

- Reads `recommendation` object from the `/forecast/latest` response
- Four states with different colors:
  - `charge_storage` → green → "Store your surplus energy"
  - `export_or_curtail` → blue → "Storage full — export excess"
  - `draw_from_storage` → yellow → "Draw from battery today"
  - `draw_from_grid` → red → "Generation shortfall — grid power needed"
- Show: title, message, surplus/deficit kWh figure

#### Component: RepredictModal

- Triggered by "Re-predict" button in header
- Opens a modal with pre-filled form:
  - Demand (kWh) — pre-filled from user profile
  - Storage capacity (kWh) — pre-filled
  - Current charge (kWh) — pre-filled
- Submit → POST `/api/v1/forecast/repredict`
- On success → refresh forecast chart + recommendation card
- On 429 (rate limited) → show "Please wait 10 minutes before re-predicting"
- Close button always visible

---

### Page 5: History (`/history`)

- Calls `GET /api/v1/history?days=7` on load
- D3.js grouped bar chart:
  - X-axis: last 7 days (dates)
  - Two bars per day: predicted generation (kWh) vs demand (kWh)
  - Color: generation = amber/yellow, demand = blue
- Summary cards above the chart:
  - "Total generated this week: X kWh"
  - "Total demand this week: X kWh"
  - "Net surplus/deficit: X kWh"

---

### Page 6: Settings (`/settings`)

Three sections, each with a save button:

**Section A — Panel Info**
- Panel area (m²), panel capacity (kW)
- PUT `/api/v1/users/me`

**Section B — Energy Settings**
- Daily demand (kWh) → PUT `/api/v1/demand/default`
- Storage capacity (kWh) + current charge (kWh) → PUT `/api/v1/storage`
- Note for user: "Updating demand or storage will automatically recalculate your recommendation"

**Section C — Account**
- Display email (read-only)
- Location display name (read-only, with "Change location" link that opens address input)

---

## D3.js Chart Specifications

### ForecastChart (72-point line chart)

```javascript
// Key D3 setup:
// - svg width: responsive (use ResizeObserver or container ref width)
// - margins: { top: 20, right: 30, bottom: 50, left: 50 }
// - xScale: d3.scaleTime() — domain: [first timestamp, last timestamp]
// - yScale: d3.scaleLinear() — domain: [0, max(predicted_ac_power_kw) * 1.1]
// - line: d3.line() with curve: d3.curveMonotoneX
// - x-axis: show every 6 hours
// - y-axis: show kW values
// - Day boundary lines: vertical dashed lines at hour 24 and hour 48
// - Current time marker: vertical solid amber line at current hour
// - Tooltip: div absolutely positioned, shown on mousemove
```

### HistoryChart (7-day grouped bar chart)

```javascript
// Key D3 setup:
// - Two bars per day group: generation (amber) vs demand (blue)
// - xScale: d3.scaleBand() for days, inner scaleBand for the two bars
// - yScale: d3.scaleLinear() domain [0, max(generation, demand) * 1.1]
// - Tooltip on hover: date + generation kWh + demand kWh
```

---

## AuthContext (global state)

```javascript
// src/context/AuthContext.jsx
// Stores: { token, user, login(token, user), logout(), updateUser(partial) }
// On app load: if token in localStorage → call GET /api/v1/auth/me to hydrate user
// login() → save to localStorage + state
// logout() → clear localStorage + redirect to /login
// updateUser() → used by Settings page after successful PUT /users/me
```

---

## Build Phases (execute in this order, stop after each)

### Phase 1 — Project scaffold
- Vite + React setup, Tailwind, React Router, Axios
- All 6 page files as stubs (just a heading)
- `api.js` with interceptors
- `AuthContext.jsx`
- `ProtectedRoute.jsx`
- App.jsx with all routes wired
- Confirm runs on `localhost:5173` with no errors
- **STOP**

### Phase 2 — Auth pages
- Build Login page fully (form + API call + redirect)
- Build Signup page fully (multi-step form + API call)
- Build Onboarding page fully (4-step wizard + PUT /users/me)
- Test: sign up a new user end-to-end, land on dashboard stub
- **STOP**

### Phase 3 — Dashboard shell + data loading
- Dashboard page fetches `/forecast/latest` and `/weather/current` on load
- Shows raw JSON in `<pre>` tags (not styled yet) so we confirm data is flowing
- Shows "No forecast yet" message if 404
- **STOP**

### Phase 4 — Dashboard components
- Build WeatherGauges (SVG arc gauges)
- Build CurrentPowerCard
- Build RecommendationCard (all 4 states)
- Build RepredictModal (form + API call + refresh)
- Dashboard now fully functional with real data
- **STOP**

### Phase 5 — ForecastChart (D3.js)
- Build the 72-point hourly line chart
- Day boundary markers, current time marker, tooltip
- Wire into Dashboard
- **STOP**

### Phase 6 — History page
- Build HistoryChart (D3.js grouped bar chart)
- Summary cards
- Wire into History page
- **STOP**

### Phase 7 — Settings page + polish
- Build all 3 settings sections with save buttons
- Add Navbar with links to Dashboard / History / Settings + logout
- Add LoadingSpinner and ErrorBanner to all pages
- Final pass: responsive layout, consistent colors
- **STOP**

---

## Design Tokens (use these consistently)

```
Primary color:    #F59E0B  (amber — solar theme)
Success/good:     #10B981  (green)
Warning:          #F59E0B  (amber)
Danger/alert:     #EF4444  (red)
Info:             #3B82F6  (blue)
Background:       #0F172A  (dark navy — dashboard feel)
Card background:  #1E293B
Text primary:     #F8FAFC
Text secondary:   #94A3B8
Border:           #334155
```

---

## Important Rules for Claude Code

1. Build phases in order — never jump ahead
2. All charts must use D3.js — no other charting library
3. Never hardcode lat/lon — always read from `user.location.lat` / `user.location.lon`
4. Never store user data other than `token` and `user` object in localStorage
5. The `/forecast/latest` response shape has `forecast.hourly` (72 items) and `forecast.recommendation` — read the backend response carefully before building components
6. On Settings page, updating demand or storage calls their specific endpoints (`/demand/default`, `/storage`) — NOT `/users/me` — because those endpoints trigger recommendation recomputation on the backend
7. RepredictModal on 429 → show cooldown message, do NOT retry automatically
