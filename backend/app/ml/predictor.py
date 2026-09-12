import math
from datetime import date
from pathlib import Path

import joblib
import pandas as pd

_MODEL_PATH = Path(__file__).parent / "best_model.pkl"
_model = joblib.load(_MODEL_PATH)

# NOCT (Nominal Operating Cell Temperature), from GridSight-ML config/config.yaml
# physics.noct — must match the value used when the model was trained.
_NOCT = 45

_FEATURE_ORDER = [
    "GHI", "DNI", "DHI", "Temperature", "Wind Speed", "Relative Humidity",
    "Solar Zenith Angle", "hour", "day_of_year", "month", "day_of_week",
    "hour_sin", "hour_cos", "day_sin", "day_cos", "T_cell",
]

# The model was trained on a 1 MW reference plant; predictions are scaled
# down to the user's actual panel capacity via capacity_factor.
REFERENCE_PLANT_CAPACITY_KW = 1000.0


def predict_ac_power(features: dict, panel_capacity_kw: float) -> float:
    """
    features keys: Year, Month, Day, Hour, Minute, Temperature, DHI, DNI,
    GHI, Relative Humidity, Solar Zenith Angle, Wind Speed
    Returns predicted AC power in kW, scaled to panel_capacity_kw.
    """
    ghi = features.get("GHI") or 0.0
    temperature = features.get("Temperature", 25.0)
    hour = features["Hour"]

    row_date = date(features["Year"], features["Month"], features["Day"])
    day_of_year = row_date.timetuple().tm_yday
    day_of_week = row_date.weekday()

    # T_cell = T_ambient + ((NOCT - 20) / 800) * GHI, per GridSight-ML
    # data_transformation.py — the feature the model was actually trained on,
    # not raw ambient temperature.
    t_cell = temperature + ((_NOCT - 20) / 800) * ghi

    row = {
        "GHI": ghi,
        "DNI": features.get("DNI", 0.0),
        "DHI": features.get("DHI", 0.0),
        "Temperature": temperature,
        "Wind Speed": features.get("Wind Speed", 0.0),
        "Relative Humidity": features.get("Relative Humidity", 0.0),
        "Solar Zenith Angle": features.get("Solar Zenith Angle", 90.0),
        "hour": hour,
        "day_of_year": day_of_year,
        "month": features["Month"],
        "day_of_week": day_of_week,
        "hour_sin": math.sin(2 * math.pi * hour / 24),
        "hour_cos": math.cos(2 * math.pi * hour / 24),
        "day_sin": math.sin(2 * math.pi * day_of_year / 365),
        "day_cos": math.cos(2 * math.pi * day_of_year / 365),
        "T_cell": t_cell,
    }

    df = pd.DataFrame([row], columns=_FEATURE_ORDER)
    raw_kw = float(_model.predict(df)[0])

    capacity_factor = raw_kw / REFERENCE_PLANT_CAPACITY_KW
    scaled_kw = capacity_factor * panel_capacity_kw

    return round(max(scaled_kw, 0.0), 3)
