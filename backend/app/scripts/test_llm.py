from app.ai.llm_service import LLMService


def main():

    llm = LLMService()

    user_context = {
        "location": "Ahmedabad, India",
        "panel_capacity_kw": 1000,
        "daily_demand_kwh": 400,
        "storage_capacity_kwh": 200,
        "current_storage_kwh": 50,
    }

    energy_analysis = {
        "energy_status": "deficit",
        "energy_balance_kwh": -80,
        "daily_generation_kwh": 320,
        "daily_demand_kwh": 400,
        "peak_generation_kw": 52,

        "storage": {
            "capacity_kwh": 200,
            "current_charge_kwh": 50,
            "available_capacity_kwh": 150,
            "charge_percentage": 25,
        },

        "weather": {
            "average_temperature": 31.4,
            "average_ghi": 184.2,
            "average_humidity": 71.3,
        },

        "risk": {
            "level": "high",
            "factors": [
                "generation_deficit",
                "insufficient_storage",
                "low_solar_irradiance",
            ],
        },
    }

    rule_recommendation = {
        "action": "draw_from_grid",
        "reason": (
            "Generation deficit exceeds available "
            "storage."
        ),
    }

    retrieved_knowledge = [
        {
            "source": "battery_management.md",
            "content": (
                "When renewable generation is below demand, "
                "stored energy can reduce grid dependence. "
                "If stored energy cannot cover the deficit, "
                "remaining demand may need to be supplied "
                "by the grid."
            ),
        },
        {
            "source": "grid_management.md",
            "content": (
                "When renewable generation is lower than "
                "demand, additional energy may need to "
                "come from storage or the electrical grid."
            ),
        },
    ]

    result = llm.generate_recommendation(
        user_context=user_context,
        energy_analysis=energy_analysis,
        retrieved_knowledge=retrieved_knowledge,
        rule_recommendation=rule_recommendation,
    )

    print("\n" + "=" * 70)
    print("GRIDSiGHT AI RECOMMENDATION")
    print("=" * 70)

    print("\nRisk:")
    print(result["risk_level"])

    print("\nSummary:")
    print(result["summary"])

    print("\nCurrent Situation:")
    print(result["current_situation"])

    print("\nForecast:")
    print(result["forecast_analysis"])

    print("\nWeather:")
    print(result["weather_analysis"])

    print("\nStorage:")
    print(result["storage_analysis"])

    print("\nRecommended Actions:")

    for action in result["recommended_actions"]:
        print(f"  • {action}")

    print("\nReasoning:")

    for reason in result["reasoning"]:
        print(f"  • {reason}")

    print("\nSources:")

    for source in result["knowledge_sources"]:
        print(f"  • {source}")


if __name__ == "__main__":
    main()