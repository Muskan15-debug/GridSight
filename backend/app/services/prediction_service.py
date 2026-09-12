from app.ml.predictor import predict_ac_power


def predict_power(weather_rows: list[dict]) -> list[dict]:
    """
    Runs each hourly weather row through the model. This is the ONLY place
    that calls predict_ac_power — every downstream consumer (forecast
    service, recommendation engine) goes through this function instead of
    inlining a prediction elsewhere.
    """
    predictions = []
    for row in weather_rows:
        features = {
            "Year": row["Year"],
            "Month": row["Month"],
            "Day": row["Day"],
            "Hour": row["Hour"],
            "Minute": row["Minute"],
            "Temperature": row["Temperature"],
            "DHI": row["DHI"],
            "DNI": row["DNI"],
            "GHI": row["GHI"],
            "Relative Humidity": row["Relative Humidity"],
            "Solar Zenith Angle": row["Solar Zenith Angle"],
            "Wind Speed": row["Wind Speed"],
        }
        predictions.append({
            "timestamp": row["timestamp"],
            "predicted_ac_power_kw": predict_ac_power(features),
        })
    return predictions
