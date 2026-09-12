import { useEffect, useState } from "react";
import CurrentPowerCard from "../components/dashboard/CurrentPowerCard";
import ForecastChart from "../components/dashboard/ForecastChart";
import RecommendationCard from "../components/dashboard/RecommendationCard";
import AIRecommendationCard from "../components/dashboard/AIRecommendationCard";
import RepredictModal from "../components/dashboard/RepredictModal";
import WeatherGauges from "../components/dashboard/WeatherGauges";
import ErrorBanner from "../components/common/ErrorBanner";
import LoadingSpinner from "../components/common/LoadingSpinner";
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

  const [modalOpen, setModalOpen] = useState(false);

  const [forecastRefreshing, setForecastRefreshing] = useState(false);

  function fetchForecast(opts = {}) {
    if (opts.silent) {
      setForecastRefreshing(true);
    } else {
      setForecastLoading(true);
    }
    setForecastError("");
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
      .finally(() => {
        setForecastLoading(false);
        setForecastRefreshing(false);
      });
  }

  useEffect(() => { fetchForecast(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  function handleRepredictSuccess(newForecast, newRecommendation) {
    setForecast(newForecast);
    setRecommendation(newRecommendation);
    setNoForecast(false);
  }

  return (
    <div className="p-6 text-text-primary">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          {user?.location?.display_name && (
            <p className="text-sm text-text-secondary">📍 {user.location.display_name}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-md bg-primary px-4 py-2 font-medium text-background transition hover:opacity-90"
        >
          Re-predict
        </button>
      </div>

      {forecastLoading && <LoadingSpinner label="Loading forecast…" />}
      {!forecastLoading && forecastError && <ErrorBanner message={forecastError} />}
      {!forecastLoading && !forecastError && noForecast && (
        <p className="text-text-secondary">No forecast yet — click Re-predict to generate one</p>
      )}

      {!forecastLoading && !forecastError && !noForecast && forecast && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <CurrentPowerCard
            forecast={forecast}
            panelCapacityKw={user?.panel?.capacity_kw ?? 0}
            refreshing={forecastRefreshing}
            onRefresh={() => fetchForecast({ silent: true })}
          />

          {weatherLoading && (
            <div className="rounded-xl border border-border bg-card p-6">
              <LoadingSpinner label="Loading weather…" />
            </div>
          )}
          {!weatherLoading && weatherError && (
            <div className="rounded-xl border border-border bg-card p-6">
              <ErrorBanner message={weatherError} />
            </div>
          )}
          {!weatherLoading && !weatherError && weather && <WeatherGauges weather={weather} />}

          <div className="md:col-span-2">
            <ForecastChart forecast={forecast} noForecast={noForecast} />
          </div>

          <div className="md:col-span-2">
            <RecommendationCard recommendation={recommendation} />
          </div>

          <div className="md:col-span-2">
            <AIRecommendationCard
              recommendation={forecast?.ai_recommendation}
            />
          </div>
        </div>
      )}

      <RepredictModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        user={user}
        onSuccess={handleRepredictSuccess}
      />
    </div>
  );
}
