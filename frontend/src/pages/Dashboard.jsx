import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
import { generateGreeting } from "../utils/formatters";

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

  const lastUpdated = forecast?.generated_at
    ? new Date(forecast.generated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  const greeting = generateGreeting(noForecast ? [] : forecast?.hourly);

  return (
    <div className="px-8 pt-6 pb-8 text-text-primary">
      <p
        className="mb-6 text-text-primary"
        style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", fontWeight: 600 }}
      >
        {greeting}
      </p>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm text-text-secondary">
          {user?.location?.display_name && (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M9.69 18.933a.75.75 0 0 0 .62 0c.081-.037.2-.094.35-.17a19 19 0 0 0 1.826-1.06c.822-.55 1.789-1.316 2.756-2.278C17.076 13.702 18.75 11.28 18.75 8.25a8.25 8.25 0 1 0-16.5 0c0 3.03 1.674 5.452 3.504 7.175a17 17 0 0 0 2.756 2.279 19 19 0 0 0 1.826 1.06zM10 11.25a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" clipRule="evenodd" />
              </svg>
              <span>{user.location.display_name}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          {lastUpdated && (
            <p className="text-xs text-text-secondary">Last updated: {lastUpdated}</p>
          )}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
          >
            Re-predict
          </button>
        </div>
      </div>

      {forecastLoading && <LoadingSpinner label="Loading forecast…" />}
      {!forecastLoading && forecastError && <ErrorBanner message={forecastError} />}
      {!forecastLoading && !forecastError && noForecast && (
        <div className="flex justify-center py-16">
          <div className="text-center" style={{ maxWidth: 560 }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              fill="none"
              className="mx-auto mb-6"
              style={{ width: 48, height: 48 }}
            >
              <circle cx="24" cy="24" r="10" stroke="#F59E0B" strokeWidth="1.5" />
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i * Math.PI) / 4;
                const x1 = 24 + Math.cos(angle) * 15;
                const y1 = 24 + Math.sin(angle) * 15;
                const x2 = 24 + Math.cos(angle) * 21;
                const y2 = 24 + Math.sin(angle) * 21;
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#F59E0B"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>

            <h2
              className="mb-3"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.5rem", color: "#F8FAFC" }}
            >
              Your first forecast is one click away.
            </h2>
            <p className="mb-6" style={{ fontFamily: "'Inter', sans-serif", color: "#6B7280", fontSize: "0.9rem" }}>
              GridSight will fetch live weather for your location and predict your panel output for the next 72 hours.
            </p>

            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => setModalOpen(true)}
              style={{
                backgroundColor: "#F59E0B",
                color: "#0A0A0A",
                borderRadius: 4,
                padding: "13px 32px",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                border: "none",
                display: "inline-block",
              }}
            >
              Generate forecast &rarr;
            </motion.button>

            <p className="mt-3 text-xs" style={{ color: "#6B7280" }}>
              Takes about 5 seconds
            </p>
          </div>
        </div>
      )}

      {!forecastLoading && !forecastError && !noForecast && forecast && (
        <div className="flex flex-col" style={{ gap: "24px" }}>
          <div className="flex flex-col gap-6 lg:flex-row" style={{ gap: "24px" }}>
            <div className="lg:basis-[60%]">
              <CurrentPowerCard
                forecast={forecast}
                panelCapacityKw={user?.panel?.capacity_kw ?? 0}
                refreshing={forecastRefreshing}
                onRefresh={() => fetchForecast({ silent: true })}
              />
            </div>

            <div className="lg:basis-[40%]">
              {weatherLoading && (
                <div className="h-full rounded-xl p-6">
                  <LoadingSpinner label="Loading weather…" />
                </div>
              )}
              {!weatherLoading && weatherError && (
                <div className="h-full rounded-xl p-6">
                  <ErrorBanner message={weatherError} />
                </div>
              )}
              {!weatherLoading && !weatherError && weather && <WeatherGauges weather={weather} />}
            </div>
          </div>

          <ForecastChart forecast={forecast} noForecast={noForecast} />

          <RecommendationCard recommendation={recommendation} />

          <AIRecommendationCard recommendation={forecast?.ai_recommendation} />
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
