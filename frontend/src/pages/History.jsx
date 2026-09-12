import { useEffect, useState } from "react";
import ErrorBanner from "../components/common/ErrorBanner";
import LoadingSpinner from "../components/common/LoadingSpinner";
import HistoryChart from "../components/history/HistoryChart";
import api from "../services/api";
import { generateHistoryInsight } from "../utils/formatters";

function SummaryCard({ label, value, prefixColor }) {
  return (
    <div className="rounded-xl border border-border p-6">
      <p
        className="text-text-primary"
        style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "2.5rem", fontWeight: 700, lineHeight: 1 }}
      >
        {prefixColor && (
          <span style={{ color: prefixColor }}>{value.prefix}</span>
        )}
        {value.number}
      </p>
      <p className="mt-2 uppercase text-text-secondary" style={{ fontSize: "0.8rem" }}>
        {label}
      </p>
    </div>
  );
}

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
  const historyInsight = generateHistoryInsight(dailySummary);

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
            <SummaryCard
              label="Total Predicted"
              value={{ number: `${totalGenerated.toFixed(1)} kWh` }}
            />
            <SummaryCard
              label="Total Demand"
              value={{ number: `${totalDemand.toFixed(1)} kWh` }}
            />
            <SummaryCard
              label="Net Result"
              value={{
                prefix: net >= 0 ? "+" : "−",
                number: `${Math.abs(net).toFixed(1)} kWh`,
              }}
              prefixColor={net >= 0 ? "#10B981" : "#EF4444"}
            />
          </div>

          {historyInsight && (
            <p
              className="mb-4 text-text-primary"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.1rem" }}
            >
              {historyInsight}
            </p>
          )}

          <HistoryChart dailySummary={dailySummary} />
        </>
      )}
    </div>
  );
}
