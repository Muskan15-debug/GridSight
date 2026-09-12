import { useEffect, useState } from "react";
import CurrentPowerCard from "../components/dashboard/CurrentPowerCard";
import ForecastChart from "../components/dashboard/ForecastChart";
import RecommendationCard from "../components/dashboard/RecommendationCard";
import RepredictModal from "../components/dashboard/RepredictModal";
import WeatherGauges from "../components/dashboard/WeatherGauges";
import GlowButton from "../components/common/GlowButton";
import { DashboardSkeleton } from "../components/common/Skeleton";
import { useToast } from "../components/common/Toast";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [forecast, setForecast] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [noForecast, setNoForecast] = useState(false);
  const [forecastLoading, setForecastLoading] = useState(true);

  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);

  const [forecastRefreshing, setForecastRefreshing] = useState(false);

  function fetchForecast(opts = {}) {
    if (opts.silent) {
      setForecastRefreshing(true);
    } else {
      setForecastLoading(true);
    }
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
          showToast("Failed to load forecast.", "error");
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
      .catch(() => showToast("Failed to load current weather.", "error"))
      .finally(() => setWeatherLoading(false));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleRepredictSuccess(newForecast, newRecommendation) {
    setForecast(newForecast);
    setRecommendation(newRecommendation);
    setNoForecast(false);
  }

  const initialLoading = forecastLoading || weatherLoading;

  return (
    <div className="p-6 text-text-primary">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Dashboard</h1>
          {user?.location?.display_name && (
            <p className="text-sm text-text-secondary">📍 {user.location.display_name}</p>
          )}
        </div>
        <GlowButton onClick={() => setModalOpen(true)}>Re-predict</GlowButton>
      </div>

      {initialLoading && <DashboardSkeleton />}

      {!initialLoading && noForecast && (
        <p className="text-text-secondary">No forecast yet — click Re-predict to generate one</p>
      )}

      {!initialLoading && !noForecast && forecast && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <CurrentPowerCard
            forecast={forecast}
            panelCapacityKw={user?.panel?.capacity_kw ?? 0}
            refreshing={forecastRefreshing}
            onRefresh={() => fetchForecast({ silent: true })}
          />

          {weather && <WeatherGauges weather={weather} />}

          <ForecastChart forecast={forecast} noForecast={noForecast} />

          <RecommendationCard recommendation={recommendation} />
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
