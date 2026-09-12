def predict_ac_power(features: dict) -> float:
    """
    features keys: Year, Month, Day, Hour, Minute, Temperature, DHI, DNI,
    GHI, Relative Humidity, Solar Zenith Angle, Wind Speed
    Returns predicted AC power in kW.

    STUB IMPLEMENTATION — replace when model_v1.joblib is provided.
    Do not delete this docstring note when replacing.
    """
    ghi = features.get("GHI") or 0.0
    temperature = features.get("Temperature", 25.0)

    if ghi <= 0:
        return 0.0

    # Rough daylight-shaped curve so the frontend has something believable
    # to render during development: assume a ~5kW STC-equivalent array,
    # scale linearly with GHI, and derate for heat above 25°C (~0.4%/°C,
    # a typical crystalline-silicon temperature coefficient).
    base_kw = (ghi / 1000.0) * 5.0
    temp_derate = 1.0 - max(0.0, temperature - 25.0) * 0.004
    predicted_kw = base_kw * max(temp_derate, 0.7)

    return round(max(predicted_kw, 0.0), 3)
