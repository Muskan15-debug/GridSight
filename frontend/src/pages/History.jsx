import { useEffect, useState } from "react";
import GlowButton from "../components/common/GlowButton";
import { HistorySkeleton } from "../components/common/Skeleton";
import { useToast } from "../components/common/Toast";
import HistoryChart from "../components/history/HistoryChart";
import api from "../services/api";

export default function History() {
  const { showToast } = useToast();
  const [dailySummary, setDailySummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  function fetchHistory(opts = {}) {
    if (opts.silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    api
      .get("/api/v1/history", { params: { days: 7 } })
      .then((res) => setDailySummary(res.data.daily_summary ?? []))
      .catch(() => showToast("Failed to load history.", "error"))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }

  useEffect(() => { fetchHistory(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalGenerated = dailySummary.reduce((sum, d) => sum + d.total_kwh, 0);
  const totalDemand = dailySummary.reduce((sum, d) => sum + (d.demand_kwh ?? 0), 0);
  const net = totalGenerated - totalDemand;

  return (
    <div className="p-6 text-text-primary">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">History</h1>
        <GlowButton variant="secondary" onClick={() => fetchHistory({ silent: true })} loading={refreshing}>
          Refresh
        </GlowButton>
      </div>

      {loading && <HistorySkeleton />}

      {!loading && dailySummary.length === 0 && (
        <p className="text-text-secondary">
          No history yet — forecasts will appear here after the first 24 hours
        </p>
      )}

      {!loading && dailySummary.length > 0 && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="glass-card rounded-xl p-6">
              <p className="text-sm text-text-secondary">Total Predicted</p>
              <p className="mt-1 font-heading text-2xl font-bold text-primary">
                {totalGenerated.toFixed(1)} kWh
              </p>
            </div>
            <div className="glass-card rounded-xl p-6">
              <p className="text-sm text-text-secondary">Total Demand</p>
              <p className="mt-1 font-heading text-2xl font-bold text-info">
                {totalDemand.toFixed(1)} kWh
              </p>
            </div>
            <div className="glass-card rounded-xl p-6">
              <p className="text-sm text-text-secondary">Net Result</p>
              <p
                className={`mt-1 font-heading text-2xl font-bold ${net >= 0 ? "text-success" : "text-danger"}`}
              >
                {net >= 0 ? "+" : ""}
                {net.toFixed(1)} kWh
              </p>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6">
            <HistoryChart dailySummary={dailySummary} />
          </div>
        </>
      )}
    </div>
  );
}
