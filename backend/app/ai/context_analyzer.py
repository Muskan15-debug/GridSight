from typing import Any, Dict, List


def analyze_energy_context(
    user_context: Dict[str, Any],
    weather_data: List[Dict[str, Any]],
    forecast_context: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Analyze forecast + weather + user data and extract
    the most important energy conditions for the AI layer.
    """

    summary = forecast_context.get("summary", {})
    hourly_forecast = forecast_context.get("hourly_forecast", [])

    daily_generation = summary.get("today_kwh", 0)
    peak_generation = summary.get("peak_kw", 0)
    peak_hour = summary.get("peak_hour")

    daily_demand = user_context.get("daily_demand_kwh", 0) or 0

    storage_capacity = (
        user_context.get("storage_capacity_kwh", 0) or 0
    )

    current_storage = (
        user_context.get("current_storage_kwh", 0) or 0
    )

    # ---------------------------------------------------------
    # ENERGY BALANCE
    # ---------------------------------------------------------

    energy_balance = daily_generation - daily_demand

    if energy_balance > 0:
        energy_status = "surplus"
    elif energy_balance < 0:
        energy_status = "deficit"
    else:
        energy_status = "balanced"

    # ---------------------------------------------------------
    # STORAGE
    # ---------------------------------------------------------

    available_storage = max(
        0,
        storage_capacity - current_storage
    )

    storage_percentage = (
        (current_storage / storage_capacity) * 100
        if storage_capacity > 0
        else 0
    )

    # ---------------------------------------------------------
    # FORECAST ANALYSIS
    # ---------------------------------------------------------

    generation_values = []

    for item in hourly_forecast:

        value = item.get(
            "predicted_ac_power_kw",
            item.get("generation_kw", 0)
        )

        if value is not None:
            generation_values.append(float(value))

    if generation_values:

        lowest_generation = min(generation_values)
        highest_generation = max(generation_values)

        lowest_index = generation_values.index(
            lowest_generation
        )

        highest_index = generation_values.index(
            highest_generation
        )

        lowest_period = hourly_forecast[lowest_index]
        highest_period = hourly_forecast[highest_index]

    else:

        lowest_generation = 0
        highest_generation = 0
        lowest_period = {}
        highest_period = {}

    # ---------------------------------------------------------
    # WEATHER ANALYSIS
    # ---------------------------------------------------------

    temperatures = []
    ghi_values = []
    humidity_values = []
    wind_values = []

    for weather in weather_data:

        if weather.get("temperature") is not None:
            temperatures.append(
                float(weather["temperature"])
            )

        if weather.get("ghi") is not None:
            ghi_values.append(
                float(weather["ghi"])
            )

        if weather.get("relative_humidity") is not None:
            humidity_values.append(
                float(weather["relative_humidity"])
            )

        if weather.get("wind_speed") is not None:
            wind_values.append(
                float(weather["wind_speed"])
            )

    weather_summary = {
        "average_temperature": (
            sum(temperatures) / len(temperatures)
            if temperatures else None
        ),

        "minimum_temperature": (
            min(temperatures)
            if temperatures else None
        ),

        "maximum_temperature": (
            max(temperatures)
            if temperatures else None
        ),

        "average_ghi": (
            sum(ghi_values) / len(ghi_values)
            if ghi_values else None
        ),

        "maximum_ghi": (
            max(ghi_values)
            if ghi_values else None
        ),

        "average_humidity": (
            sum(humidity_values) / len(humidity_values)
            if humidity_values else None
        ),

        "average_wind_speed": (
            sum(wind_values) / len(wind_values)
            if wind_values else None
        ),
    }

    # ---------------------------------------------------------
    # GENERATION VOLATILITY
    # ---------------------------------------------------------

    if len(generation_values) > 1:

        changes = [
            abs(
                generation_values[i]
                - generation_values[i - 1]
            )
            for i in range(1, len(generation_values))
        ]

        average_change = sum(changes) / len(changes)

    else:

        average_change = 0

    # ---------------------------------------------------------
    # RISK LEVEL
    # ---------------------------------------------------------

    risk_factors = []

    if energy_balance < 0:
        risk_factors.append("generation_deficit")

    if (
        energy_balance < 0
        and current_storage < abs(energy_balance)
    ):
        risk_factors.append("insufficient_storage")

    if highest_generation > daily_demand:
        risk_factors.append("potential_surplus")

    if average_change > 10:
        risk_factors.append("high_generation_variability")

    if weather_summary["average_ghi"] is not None:

        if weather_summary["average_ghi"] < 200:
            risk_factors.append("low_solar_irradiance")

    if len(risk_factors) >= 3:
        risk_level = "high"

    elif len(risk_factors) == 2:
        risk_level = "medium"

    else:
        risk_level = "low"

    # ---------------------------------------------------------
    # FINAL ANALYSIS OBJECT
    # ---------------------------------------------------------

    analysis = {

        "energy_status": energy_status,

        "energy_balance_kwh": round(
            energy_balance,
            2
        ),

        "daily_generation_kwh": round(
            daily_generation,
            2
        ),

        "daily_demand_kwh": round(
            daily_demand,
            2
        ),

        "peak_generation_kw": round(
            peak_generation,
            2
        ),

        "peak_generation_hour": peak_hour,

        "lowest_forecast_generation_kw": round(
            lowest_generation,
            2
        ),

        "lowest_generation_period": lowest_period,

        "highest_forecast_generation_kw": round(
            highest_generation,
            2
        ),

        "highest_generation_period": highest_period,

        "storage": {

            "capacity_kwh": storage_capacity,

            "current_charge_kwh": current_storage,

            "available_capacity_kwh": round(
                available_storage,
                2
            ),

            "charge_percentage": round(
                storage_percentage,
                2
            ),
        },

        "weather": weather_summary,

        "forecast_variability": {
            "average_hourly_change_kw": round(
                average_change,
                2
            )
        },

        "risk": {
            "level": risk_level,
            "factors": risk_factors
        }
    }

    return analysis