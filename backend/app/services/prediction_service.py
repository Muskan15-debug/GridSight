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
            "GHI": row["GHI"],
            "DNI": row["DNI"],
            "DHI": row["DHI"],
            "Temperature": row["Temperature"],
            "Wind_Speed": row["Wind_Speed"],
            "hour": row["hour"],
            "month": row["month"],
        }
        predictions.append({
            "timestamp": row["timestamp"],
            "predicted_ac_power_kw": predict_ac_power(features),
        })
    return predictions
