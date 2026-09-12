import { useEffect, useState } from "react";
import ErrorBanner from "../components/common/ErrorBanner";
import LoadingSpinner from "../components/common/LoadingSpinner";
import HistoryChart from "../components/history/HistoryChart";
import api from "../services/api";

export default function History() {
  const [dailySummary, setDailySummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function fetchHistory() {
    setLoading(true);
    setError("");
    api
      .get("/api/v1/history", { params: { days: 7 } })
      .then((res) => setDailySummary(res.data.daily_summary ?? []))
      .catch(() => setError("Failed to load history."))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchHistory(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalGenerated = dailySummary.reduce((sum, d) => sum + d.total_kwh, 0);
  const totalDemand = dailySummary.reduce((sum, d) => sum + (d.demand_kwh ?? 0), 0);
  const net = totalGenerated - totalDemand;

  return (
    <div className="p-6 text-text-primary">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">History</h1>
        <button
          type="button"
          onClick={fetchHistory}
          disabled={loading}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-text-secondary transition hover:text-text-primary disabled:opacity-40"
        >
          Refresh
        </button>
      </div>

      {loading && <LoadingSpinner label="Loading history…" />}
      {!loading && error && <ErrorBanner message={error} />}

      {!loading && !error && dailySummary.length === 0 && (
        <p className="text-text-secondary">
          No history yet — forecasts will appear here after the first 24 hours
        </p>
      )}

      {!loading && !error && dailySummary.length > 0 && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6">
              <p className="text-sm text-text-secondary">Total Predicted</p>
              <p className="mt-1 text-2xl font-bold text-primary">
                {totalGenerated.toFixed(1)} kWh
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <p className="text-sm text-text-secondary">Total Demand</p>
              <p className="mt-1 text-2xl font-bold text-info">{totalDemand.toFixed(1)} kWh</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <p className="text-sm text-text-secondary">Net Result</p>
              <p className={`mt-1 text-2xl font-bold ${net >= 0 ? "text-success" : "text-danger"}`}>
                {net >= 0 ? "+" : ""}
                {net.toFixed(1)} kWh
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <HistoryChart dailySummary={dailySummary} />
          </div>
        </>
      )}
    </div>
  );
}
