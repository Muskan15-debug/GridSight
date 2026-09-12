from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.schemas import UserOut
from app.services.prediction_service import predict_power
from app.services.recommendation_engine import generate_recommendation
from app.services.weather_service import fetch_weather

# AI / RAG services
from app.ai.context_builder import build_ai_context
from app.ai.context_analyzer import analyze_energy_context
from app.ai.rag_service import RAGService
from app.ai.llm_service import LLMService


# ---------------------------------------------------------
# AI SERVICES
# ---------------------------------------------------------

rag_service = RAGService()
llm_service = LLMService()


# ---------------------------------------------------------
# FORECAST GENERATION
# ---------------------------------------------------------

async def run_forecast_for_user(
    db: AsyncIOMotorDatabase,
    user: UserOut,
    trigger: str,
    hours: int = 72,
) -> dict:
    """
    Shared logic for every forecast trigger.

    Pipeline:

        Weather
            ↓
        XGBoost prediction
            ↓
        Rule-based recommendation
            ↓
        AI context construction
            ↓
        Energy context analysis
            ↓
        RAG retrieval
            ↓
        LLM recommendation
            ↓
        MongoDB

    The deterministic recommendation remains the operational baseline.
    The RAG + LLM layer provides detailed contextual analysis.
    """

    # ---------------------------------------------------------
    # 1. GET USER LOCATION
    # ---------------------------------------------------------

    lat = user.location.lat
    lon = user.location.lon

    # ---------------------------------------------------------
    # 2. FETCH WEATHER
    # ---------------------------------------------------------

    weather_rows = await fetch_weather(
        lat,
        lon,
        hours=hours
    )

    # ---------------------------------------------------------
    # 3. XGBOOST POWER PREDICTION
    # ---------------------------------------------------------

    predictions = predict_power(
        weather_rows,
        user.panel.capacity_kw
    )

    # ---------------------------------------------------------
    # 4. FORECAST SUMMARY
    # ---------------------------------------------------------

    powers = [
        p["predicted_ac_power_kw"]
        for p in predictions
    ]

    today_kwh = sum(powers[:24])

    peak_kw = max(powers)

    peak_hour = predictions[
        powers.index(peak_kw)
    ]["timestamp"]

    total_72h_kwh = sum(powers)

    # ---------------------------------------------------------
    # 5. EXISTING RULE-BASED RECOMMENDATION
    # ---------------------------------------------------------

    recommendation = generate_recommendation(
        predicted_generation_kwh=today_kwh,
        demand_kwh=user.demand.default_daily_kwh,
        storage_capacity_kwh=user.storage.capacity_kwh,
        current_charge_kwh=user.storage.current_charge_kwh,
    )

    # ---------------------------------------------------------
    # 6. CREATE FORECAST DATA FOR AI
    # ---------------------------------------------------------

    forecast_data = {
        "hourly": predictions,

        "summary": {
            "total_kwh_72h": round(
                total_72h_kwh,
                1
            ),

            "today_kwh": round(
                today_kwh,
                1
            ),

            "peak_kw": round(
                peak_kw,
                3
            ),

            "peak_hour": peak_hour,
        }
    }

    # ---------------------------------------------------------
    # 7. CREATE USER CONTEXT
    # ---------------------------------------------------------

    user_context = {
        "location": {
            "latitude": lat,
            "longitude": lon,
        },

        "panel_capacity_kw": user.panel.capacity_kw,

        "daily_demand_kwh": (
            user.demand.default_daily_kwh
        ),

        "storage_capacity_kwh": (
            user.storage.capacity_kwh
        ),

        "current_storage_kwh": (
            user.storage.current_charge_kwh
        ),
    }

    # ---------------------------------------------------------
    # 8. BUILD AI CONTEXT
    # ---------------------------------------------------------

    ai_context = build_ai_context(
        user_data=user_context,

        weather_data=weather_rows,

        forecast_data=forecast_data,

        rule_recommendation=recommendation,
    )

    # ---------------------------------------------------------
    # 9. ANALYZE ENERGY CONDITIONS
    # ---------------------------------------------------------

    energy_analysis = analyze_energy_context(
        user_context=ai_context["user"],

        weather_data=ai_context[
            "weather"
        ]["hourly_data"],

        forecast_context=ai_context[
            "generation_forecast"
        ],
    )

    # ---------------------------------------------------------
    # 10. CREATE CONTEXT-AWARE RAG QUERY
    # ---------------------------------------------------------

    rag_query = f"""
    Renewable energy operational recommendation.

    Location:
    {lat}, {lon}

    Panel capacity:
    {user.panel.capacity_kw} kW

    Daily energy demand:
    {user.demand.default_daily_kwh} kWh

    Battery capacity:
    {user.storage.capacity_kwh} kWh

    Current battery charge:
    {user.storage.current_charge_kwh} kWh

    Today's predicted generation:
    {today_kwh} kWh

    72-hour predicted generation:
    {total_72h_kwh} kWh

    Energy status:
    {energy_analysis["energy_status"]}

    Energy balance:
    {energy_analysis["energy_balance_kwh"]} kWh

    Peak generation:
    {energy_analysis["peak_generation_kw"]} kW

    Lowest forecast generation:
    {energy_analysis["lowest_forecast_generation_kw"]} kW

    Storage charge:
    {energy_analysis["storage"]["charge_percentage"]}%

    Weather summary:
    {energy_analysis["weather"]}

    Risk level:
    {energy_analysis["risk"]["level"]}

    Risk factors:
    {energy_analysis["risk"]["factors"]}

    Existing operational recommendation:
    {recommendation}
    """

    # ---------------------------------------------------------
    # 11. RETRIEVE RELEVANT ENERGY KNOWLEDGE
    # ---------------------------------------------------------

    retrieved_knowledge = rag_service.retrieve(
        query=rag_query,
        top_k=3,
    )

    # ---------------------------------------------------------
    # 12. GENERATE AI RECOMMENDATION
    # ---------------------------------------------------------

    ai_recommendation = llm_service.generate_recommendation(
        user_context=ai_context["user"],

        energy_analysis=energy_analysis,

        retrieved_knowledge=retrieved_knowledge,

        rule_recommendation=recommendation,
    )

    # ---------------------------------------------------------
    # 13. CREATE FINAL FORECAST RECORD
    # ---------------------------------------------------------

    forecast_record = {

        "user_id": user.id,

        "location": {
            "lat": lat,
            "lon": lon,
        },

        "generated_at": (
            datetime.now(
                timezone.utc
            ).isoformat()
        ),

        "trigger": trigger,

        # XGBoost forecast
        "hourly": predictions,

        # Forecast summary
        "summary": {

            "total_kwh_72h": round(
                total_72h_kwh,
                1
            ),

            "today_kwh": round(
                today_kwh,
                1
            ),

            "peak_kw": round(
                peak_kw,
                3
            ),

            "peak_hour": peak_hour,
        },

        # User demand snapshot
        "demand_snapshot_kwh": (
            user.demand.default_daily_kwh
        ),

        # Storage snapshot
        "storage_snapshot": {

            "capacity_kwh": (
                user.storage.capacity_kwh
            ),

            "current_charge_kwh": (
                user.storage.current_charge_kwh
            ),
        },

        # Existing deterministic recommendation
        "recommendation": recommendation,

        # AI-generated recommendation
        "ai_recommendation": ai_recommendation,

        # Store AI analysis for transparency/debugging
        "ai_analysis": energy_analysis,

        # Store which knowledge sources were used
        "ai_knowledge_sources": [
            item["source"]
            for item in retrieved_knowledge
        ],
    }

    # ---------------------------------------------------------
    # 14. SAVE TO MONGODB
    # ---------------------------------------------------------

    result = await db.forecasts.insert_one(
        forecast_record
    )

    forecast_record["_id"] = str(
        result.inserted_id
    )

    return forecast_record


# ---------------------------------------------------------
# GET LATEST FORECAST
# ---------------------------------------------------------

async def get_latest_forecast(
    db: AsyncIOMotorDatabase,
    user_id: str
) -> dict | None:

    doc = await db.forecasts.find_one(
        {"user_id": user_id},
        sort=[("generated_at", -1)]
    )

    if doc is None:
        return None

    doc["_id"] = str(doc["_id"])

    return doc


# ---------------------------------------------------------
# RECOMPUTE RECOMMENDATION
# ---------------------------------------------------------

async def recompute_recommendation_for_latest_forecast(
    db: AsyncIOMotorDatabase,
    user: UserOut
) -> tuple[dict, dict] | None:
    """
    Re-scores the recommendation against the user's
    NEW demand/storage values using the existing latest
    forecast's already-predicted generation.

    No weather fetch.
    No XGBoost inference.
    No new AI generation.

    The stored forecast itself is left untouched.
    """

    forecast = await get_latest_forecast(
        db,
        user.id
    )

    if forecast is None:
        return None

    recommendation = generate_recommendation(
        predicted_generation_kwh=forecast[
            "summary"
        ]["today_kwh"],

        demand_kwh=user.demand.default_daily_kwh,

        storage_capacity_kwh=user.storage.capacity_kwh,

        current_charge_kwh=user.storage.current_charge_kwh,
    )

    return forecast, recommendation