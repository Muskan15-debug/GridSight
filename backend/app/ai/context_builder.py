from typing import Any, Dict, List  


def build_ai_context(
    user_data: Dict[str, Any],
    weather_data: List[Dict[str, Any]],
    forecast_data: Dict[str, Any],
    rule_recommendation: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Build a structured context object for the RAG + LLM recommendation layer.
    """

    user_context = {
        "location": user_data.get("location"),
        "panel_capacity_kw": user_data.get("panel_capacity_kw"),
        "daily_demand_kwh": user_data.get("daily_demand_kwh"),
        "storage_capacity_kwh": user_data.get("storage_capacity_kwh"),
        "current_storage_kwh": user_data.get("current_storage_kwh"),
    }

    forecast_context = {
        "hourly_forecast": forecast_data.get("hourly", []),
        "summary": forecast_data.get("summary", {}),
    }

    # Keep the weather information structured.
    weather_context = {
        "forecast_hours": len(weather_data),
        "hourly_data": weather_data,
    }

    context = {
        "user": user_context,
        "weather": weather_context,
        "generation_forecast": forecast_context,
        "rule_based_recommendation": rule_recommendation,
    }

    return context