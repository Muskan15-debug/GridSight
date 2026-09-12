import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function RepredictModal({ open, onClose, user, onSuccess }) {
  const { updateUser } = useAuth();
  const [demandKwh, setDemandKwh] = useState("");
  const [storageCapacityKwh, setStorageCapacityKwh] = useState("");
  const [currentChargeKwh, setCurrentChargeKwh] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setError("");
    setDemandKwh(user.demand?.default_daily_kwh ?? "");
    setStorageCapacityKwh(user.storage?.capacity_kwh ?? "");
    setCurrentChargeKwh(user.storage?.current_charge_kwh ?? "");
  }, [open, user]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const formValues = {
        demand_kwh: parseFloat(demandKwh),
        storage_capacity_kwh: parseFloat(storageCapacityKwh),
        current_charge_kwh: parseFloat(currentChargeKwh),
      };
      const res = await api.post("/api/v1/forecast/repredict", formValues);

      updateUser({
        demand: { ...user.demand, default_daily_kwh: formValues.demand_kwh },
        storage: {
          ...user.storage,
          capacity_kwh: formValues.storage_capacity_kwh,
          current_charge_kwh: formValues.current_charge_kwh,
        },
      });

      onSuccess(res.data.forecast, res.data.recommendation);
      onClose();
    } catch (err) {
        const detail = err.response?.data?.detail;
        setError(typeof detail === "string" ? detail : "Repredict failed — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Update parameters &amp; re-predict</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-text-secondary hover:text-text-primary"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-text-secondary" htmlFor="repredict-demand">
              Demand (kWh)
            </label>
            <input
              id="repredict-demand"
              type="number"
              min="0"
              step="any"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
              value={demandKwh}
              onChange={(e) => setDemandKwh(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-text-secondary" htmlFor="repredict-storage-capacity">
              Storage capacity (kWh)
            </label>
            <input
              id="repredict-storage-capacity"
              type="number"
              min="0"
              step="any"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
              value={storageCapacityKwh}
              onChange={(e) => setStorageCapacityKwh(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-text-secondary" htmlFor="repredict-current-charge">
              Current charge (kWh)
            </label>
            <input
              id="repredict-current-charge"
              type="number"
              min="0"
              step="any"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
              value={currentChargeKwh}
              onChange={(e) => setCurrentChargeKwh(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-border py-2 font-medium text-text-primary transition hover:bg-background"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-md bg-primary py-2 font-medium text-background transition hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Re-predicting…" : "Re-predict"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
