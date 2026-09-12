import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import GlowButton from "../common/GlowButton";
import { useToast } from "../common/Toast";

export default function RepredictModal({ open, onClose, user, onSuccess }) {
  const { updateUser } = useAuth();
  const { showToast } = useToast();
  const [demandKwh, setDemandKwh] = useState("");
  const [storageCapacityKwh, setStorageCapacityKwh] = useState("");
  const [currentChargeKwh, setCurrentChargeKwh] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setSuccess(false);
    setDemandKwh(user.demand?.default_daily_kwh ?? "");
    setStorageCapacityKwh(user.storage?.capacity_kwh ?? "");
    setCurrentChargeKwh(user.storage?.current_charge_kwh ?? "");
  }, [open, user]);

  async function handleSubmit(e) {
    e.preventDefault();
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
      setSubmitting(false);
      setSuccess(true);
      showToast("Forecast updated with your new parameters.", "success");
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setSubmitting(false);
      if (err.response?.status === 429) {
        showToast("Please wait 10 minutes before re-predicting.", "error");
      } else {
        const detail = err.response?.data?.detail;
        showToast(typeof detail === "string" ? detail : "Repredict failed — please try again.", "error");
      }
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="glass-card w-full max-w-sm rounded-xl p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-text-primary">
                Update parameters &amp; re-predict
              </h2>
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
                <label
                  className="mb-1 block text-sm text-text-secondary"
                  htmlFor="repredict-storage-capacity"
                >
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
                <label
                  className="mb-1 block text-sm text-text-secondary"
                  htmlFor="repredict-current-charge"
                >
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

              <div className="flex gap-3 pt-2">
                <GlowButton type="button" variant="secondary" onClick={onClose} className="flex-1" fullWidth>
                  Cancel
                </GlowButton>
                <GlowButton
                  type="submit"
                  loading={submitting}
                  success={success}
                  disabled={submitting || success}
                  className="flex-1"
                  fullWidth
                >
                  Re-predict
                </GlowButton>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
