import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function Dashboard() {
  const { user } = useAuth();

  const [forecast, setForecast] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [noForecast, setNoForecast] = useState(false);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [forecastError, setForecastError] = useState("");

  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState("");

  useEffect(() => {
    api
      .get("/api/v1/forecast/latest")
      .then((res) => {
        setForecast(res.data.forecast);
        setRecommendation(res.data.recommendation);
        setNoForecast(false);
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setNoForecast(true);
        } else {
          setForecastError("Failed to load forecast.");
        }
      })
      .finally(() => setForecastLoading(false));
  }, []);

  useEffect(() => {
    if (!user?.location?.lat || !user?.location?.lon) return;
    api
      .get("/api/v1/weather/current", {
        params: { lat: user.location.lat, lon: user.location.lon },
      })
      .then((res) => setWeather(res.data))
      .catch(() => setWeatherError("Failed to load current weather."))
      .finally(() => setWeatherLoading(false));
  }, [user]);

  return (
    <div className="p-6 text-text-primary">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <section className="mt-6">
        <h2 className="text-lg font-medium">Forecast (/api/v1/forecast/latest)</h2>
        {forecastLoading && <p>Loading forecast…</p>}
        {!forecastLoading && forecastError && <p className="text-danger">{forecastError}</p>}
        {!forecastLoading && !forecastError && noForecast && (
          <p>No forecast yet — click Re-predict to generate one</p>
        )}
        {!forecastLoading && !forecastError && !noForecast && (
          <pre className="mt-2 overflow-auto rounded bg-card p-3 text-xs">
            {JSON.stringify({ forecast, recommendation }, null, 2)}
          </pre>
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-medium">
          Current Weather (/api/v1/weather/current)
        </h2>
        {weatherLoading && <p>Loading weather…</p>}
        {!weatherLoading && weatherError && <p className="text-danger">{weatherError}</p>}
        {!weatherLoading && !weatherError && weather && (
          <pre className="mt-2 overflow-auto rounded bg-card p-3 text-xs">
            {JSON.stringify(weather, null, 2)}
          </pre>
        )}
      </section>
    </div>
  );
}
