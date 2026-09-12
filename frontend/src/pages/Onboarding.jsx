import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const STEP_LABELS = ["Panel Info", "Location", "Daily Demand", "Storage"];

function inputClass() {
  return "w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary focus:border-primary focus:outline-none";
}

function labelClass() {
  return "mb-1 block text-sm text-text-secondary";
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, loading, updateUser } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    panel_area_sqm: "",
    panel_capacity_kw: "",
    address: "",
    daily_demand_kwh: "",
    storage_capacity_kwh: "",
    current_charge_kwh: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      panel_area_sqm: user.panel?.area_sqm ?? "",
      panel_capacity_kw: user.panel?.capacity_kw ?? "",
      address: user.location?.display_name ?? "",
      daily_demand_kwh: user.demand?.default_daily_kwh ?? "",
      storage_capacity_kwh: user.storage?.capacity_kwh ?? "",
      current_charge_kwh: user.storage?.current_charge_kwh ?? "",
    });
  }, [user]);

  if (!loading && !user) {
    navigate("/login", { replace: true });
    return null;
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validateStep() {
    if (step === 0) {
      if (!form.panel_area_sqm || !form.panel_capacity_kw) {
        return "Fill in panel area and panel capacity.";
      }
    } else if (step === 1) {
      if (!form.address) {
        return "Enter your address.";
      }
    } else if (step === 2) {
      if (!form.daily_demand_kwh) {
        return "Enter your average daily demand.";
      }
    } else if (step === 3) {
      if (form.storage_capacity_kwh === "" || form.current_charge_kwh === "") {
        return "Fill in storage capacity and current charge.";
      }
    }
    return "";
  }

  function handleNext() {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setStep((s) => s + 1);
  }

  function handleBack() {
    setError("");
    setStep((s) => s - 1);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const profileRes = await api.put("/api/v1/users/me", {
        panel_area_sqm: parseFloat(form.panel_area_sqm),
        panel_capacity_kw: parseFloat(form.panel_capacity_kw),
        address: form.address,
      });

      // These two also try to recompute the recommendation against the
      // latest forecast, which doesn't exist yet for a brand-new user —
      // that recompute 404s, but the demand/storage value itself is
      // already saved by the time it does, so treat 404 here as success.
      await Promise.all([
        api.put("/api/v1/demand/default", {
          demand_kwh: parseFloat(form.daily_demand_kwh),
        }).catch((err) => {
          if (err.response?.status !== 404) throw err;
        }),
        api.put("/api/v1/storage", {
          storage_capacity_kwh: parseFloat(form.storage_capacity_kwh),
          current_charge_kwh: parseFloat(form.current_charge_kwh),
        }).catch((err) => {
          if (err.response?.status !== 404) throw err;
        }),
      ]);

      updateUser({
        panel: profileRes.data.panel,
        location: profileRes.data.location,
        demand: { ...user.demand, default_daily_kwh: parseFloat(form.daily_demand_kwh) },
        storage: {
          ...user.storage,
          capacity_kwh: parseFloat(form.storage_capacity_kwh),
          current_charge_kwh: parseFloat(form.current_charge_kwh),
        },
      });

      navigate("/dashboard");
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") {
        setError(detail);
      } else {
        setError("Something went wrong saving your details. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const isLastStep = step === STEP_LABELS.length - 1;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-lg">
        <h1 className="mb-2 text-2xl font-semibold text-text-primary">Set up your account</h1>

        <div className="mb-6 flex items-center gap-2">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`h-1.5 w-full rounded-full ${i <= step ? "bg-primary" : "bg-border"}`}
              />
              <span className="text-[10px] text-text-secondary">{label}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 0 && (
            <>
              <div>
                <label className={labelClass()} htmlFor="panel_area_sqm">
                  Panel area (m²)
                </label>
                <input
                  id="panel_area_sqm"
                  type="number"
                  min="0"
                  step="any"
                  className={inputClass()}
                  value={form.panel_area_sqm}
                  onChange={(e) => update("panel_area_sqm", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass()} htmlFor="panel_capacity_kw">
                  Panel capacity (kW)
                </label>
                <input
                  id="panel_capacity_kw"
                  type="number"
                  min="0"
                  step="any"
                  className={inputClass()}
                  value={form.panel_capacity_kw}
                  onChange={(e) => update("panel_capacity_kw", e.target.value)}
                />
              </div>
            </>
          )}

          {step === 1 && (
            <div>
              <label className={labelClass()} htmlFor="address">
                Address
              </label>
              <input
                id="address"
                type="text"
                placeholder="City, region, country"
                className={inputClass()}
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
              />
              {user?.location?.display_name && (
                <p className="mt-1 text-xs text-text-secondary">
                  Currently resolved to: {user.location.display_name}
                </p>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <label className={labelClass()} htmlFor="daily_demand_kwh">
                Average daily demand (kWh)
              </label>
              <input
                id="daily_demand_kwh"
                type="number"
                min="0"
                step="any"
                className={inputClass()}
                value={form.daily_demand_kwh}
                onChange={(e) => update("daily_demand_kwh", e.target.value)}
              />
              <p className="mt-1 text-xs text-text-secondary">
                Average electricity your home or facility uses per day. Editable anytime from
                settings.
              </p>
            </div>
          )}

          {step === 3 && (
            <>
              <div>
                <label className={labelClass()} htmlFor="storage_capacity_kwh">
                  Battery storage capacity (kWh)
                </label>
                <input
                  id="storage_capacity_kwh"
                  type="number"
                  min="0"
                  step="any"
                  className={inputClass()}
                  value={form.storage_capacity_kwh}
                  onChange={(e) => update("storage_capacity_kwh", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass()} htmlFor="current_charge_kwh">
                  Current charge level (kWh)
                </label>
                <input
                  id="current_charge_kwh"
                  type="number"
                  min="0"
                  step="any"
                  className={inputClass()}
                  value={form.current_charge_kwh}
                  onChange={(e) => update("current_charge_kwh", e.target.value)}
                />
              </div>
            </>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex gap-3 pt-2">
            {step > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 rounded-md border border-border py-2 font-medium text-text-primary transition hover:bg-background"
              >
                Back
              </button>
            )}
            {!isLastStep && (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 rounded-md bg-primary py-2 font-medium text-background transition hover:opacity-90"
              >
                Next
              </button>
            )}
            {isLastStep && (
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-md bg-primary py-2 font-medium text-background transition hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Finish setup"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
