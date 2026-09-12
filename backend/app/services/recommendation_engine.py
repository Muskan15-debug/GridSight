def generate_recommendation(
    predicted_generation_kwh: float,
    demand_kwh: float,
    storage_capacity_kwh: float,
    current_charge_kwh: float,
) -> dict:
    """
    Compares today's predicted generation vs demand, factors in storage,
    and returns one of: charge_storage, export_or_curtail, draw_from_storage,
    draw_from_grid — with a plain-language message and severity.

    Uses daily kWh for both sides of the comparison (not instantaneous kW)
    since generation varies hour to hour but demand is planned per day.
    """
    surplus = predicted_generation_kwh - demand_kwh
    available_storage_room = storage_capacity_kwh - current_charge_kwh

    if surplus > 0:
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
                "surplus_kwh": round(surplus, 1),
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
                "excess_kwh": round(excess_after_storage, 1),
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
                "deficit_kwh": round(deficit, 1),
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
                "grid_kwh_needed": round(grid_needed, 1),
            }
