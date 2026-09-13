import { useState } from "react";
import ErrorBanner from "../components/common/ErrorBanner";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

function inputClass() {
  return "w-full text-white transition focus:outline-none";
}

function inputStyle() {
  return {
    borderRadius: 6,
    padding: "10px 14px",
    backgroundColor: "#0F172A",
    border: "1px solid #334155",
  };
}

function handleFocus(e) {
  e.target.style.borderColor = "#F59E0B";
}
function handleBlur(e) {
  e.target.style.borderColor = "#334155";
}

function labelClass() {
  return "mb-1 block text-sm text-text-secondary";
}

function SectionCard({ title, children }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-4 text-lg font-semibold text-text-primary">{title}</h2>
      {children}
    </div>
  );
}

function SaveButton({ saving, children = "Save" }) {
  return (
    <div className="flex justify-end">
      <button
        type="submit"
        disabled={saving}
        style={{
          backgroundColor: "#F59E0B",
          color: "#0F172A",
          borderRadius: 4,
          padding: "8px 20px",
        }}
        className="text-sm font-medium transition hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Saving…" : children}
      </button>
    </div>
  );
}

function SuccessNote({ show }) {
  if (!show) return null;
  return <p className="mt-2 text-sm text-success">Saved.</p>;
}

function PanelInfoSection({ user, updateUser }) {
  const [panelAreaSqm, setPanelAreaSqm] = useState(user.panel?.area_sqm ?? "");
  const [panelCapacityKw, setPanelCapacityKw] = useState(user.panel?.capacity_kw ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const res = await api.put("/api/v1/users/me", {
        panel_area_sqm: parseFloat(panelAreaSqm),
        panel_capacity_kw: parseFloat(panelCapacityKw),
      });
      updateUser({ panel: res.data.panel });
      setSaved(true);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to save panel info.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Panel Info">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass()} htmlFor="panel-area">
            Panel area (m²)
          </label>
          <input
            id="panel-area"
            type="number"
            min="0"
            step="any"
            className={inputClass()}
            style={inputStyle()}
            onFocus={handleFocus}
            onBlur={handleBlur}
            value={panelAreaSqm}
            onChange={(e) => setPanelAreaSqm(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass()} htmlFor="panel-capacity">
            Panel capacity (kW)
          </label>
          <input
            id="panel-capacity"
            type="number"
            min="0"
            step="any"
            className={inputClass()}
            style={inputStyle()}
            onFocus={handleFocus}
            onBlur={handleBlur}
            value={panelCapacityKw}
            onChange={(e) => setPanelCapacityKw(e.target.value)}
          />
        </div>
        <ErrorBanner message={error} onDismiss={() => setError("")} />
        <SaveButton saving={saving} />
        <SuccessNote show={saved} />
      </form>
    </SectionCard>
  );
}

function EnergySettingsSection({ user, updateUser }) {
  const [demandKwh, setDemandKwh] = useState(user.demand?.default_daily_kwh ?? "");
  const [storageCapacityKwh, setStorageCapacityKwh] = useState(user.storage?.capacity_kwh ?? "");
  const [currentChargeKwh, setCurrentChargeKwh] = useState(user.storage?.current_charge_kwh ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const demandValue = parseFloat(demandKwh);
      const storageCapacityValue = parseFloat(storageCapacityKwh);
      const currentChargeValue = parseFloat(currentChargeKwh);

      // Both endpoints also try to recompute the recommendation against the
      // latest forecast — if none exists yet, that recompute 404s, but the
      // value itself is already saved by then, so treat 404 as success here.
      await Promise.all([
        api.put("/api/v1/demand/default", { demand_kwh: demandValue }).catch((err) => {
          if (err.response?.status !== 404) throw err;
        }),
        api
          .put("/api/v1/storage", {
            storage_capacity_kwh: storageCapacityValue,
            current_charge_kwh: currentChargeValue,
          })
          .catch((err) => {
            if (err.response?.status !== 404) throw err;
          }),
      ]);

      updateUser({
        demand: { ...user.demand, default_daily_kwh: demandValue },
        storage: {
          ...user.storage,
          capacity_kwh: storageCapacityValue,
          current_charge_kwh: currentChargeValue,
        },
      });
      setSaved(true);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to save energy settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Energy Settings">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass()} htmlFor="settings-demand">
            Daily demand (kWh)
          </label>
          <input
            id="settings-demand"
            type="number"
            min="0"
            step="any"
            className={inputClass()}
            style={inputStyle()}
            onFocus={handleFocus}
            onBlur={handleBlur}
            value={demandKwh}
            onChange={(e) => setDemandKwh(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass()} htmlFor="settings-storage-capacity">
            Storage capacity (kWh)
          </label>
          <input
            id="settings-storage-capacity"
            type="number"
            min="0"
            step="any"
            className={inputClass()}
            style={inputStyle()}
            onFocus={handleFocus}
            onBlur={handleBlur}
            value={storageCapacityKwh}
            onChange={(e) => setStorageCapacityKwh(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass()} htmlFor="settings-current-charge">
            Current charge (kWh)
          </label>
          <input
            id="settings-current-charge"
            type="number"
            min="0"
            step="any"
            className={inputClass()}
            style={inputStyle()}
            onFocus={handleFocus}
            onBlur={handleBlur}
            value={currentChargeKwh}
            onChange={(e) => setCurrentChargeKwh(e.target.value)}
          />
        </div>
        <p className="text-xs text-text-secondary">
          Updating these values will automatically recalculate your recommendation.
        </p>
        <ErrorBanner message={error} onDismiss={() => setError("")} />
        <SaveButton saving={saving} />
        <SuccessNote show={saved} />
      </form>
    </SectionCard>
  );
}

function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    setSaving(true);
    try {
      await api.put("/api/v1/auth/password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setSaved(true);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to change password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-border/60 p-4">
      <h2 className="mb-3 font-medium text-text-secondary" style={{ fontSize: "0.85rem" }}>
        Change Password
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className={labelClass()} htmlFor="current-password">Current password</label>
          <input
            id="current-password"
            type="password"
            className={inputClass()}
            style={inputStyle()}
            onFocus={handleFocus}
            onBlur={handleBlur}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass()} htmlFor="new-password">New password</label>
          <input
            id="new-password"
            type="password"
            className={inputClass()}
            style={inputStyle()}
            onFocus={handleFocus}
            onBlur={handleBlur}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <ErrorBanner message={error} onDismiss={() => setError("")} />
        <SaveButton saving={saving}>Change password</SaveButton>
        <SuccessNote show={saved} />
      </form>
    </div>
  );
}

function AccountSection({ user, updateUser }) {
  const [changingLocation, setChangingLocation] = useState(false);
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const res = await api.put("/api/v1/users/me", { address });
      updateUser({ location: res.data.location });
      setSaved(true);
      setChangingLocation(false);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to update location.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-t border-border pt-6">
      <p className="text-sm text-text-secondary">{user.email}</p>

      {!changingLocation && (
        <div className="mt-1 flex items-center justify-between">
          <p className="text-sm text-text-secondary">{user.location?.display_name}</p>
          <button
            type="button"
            onClick={() => {
              setAddress(user.location?.display_name ?? "");
              setChangingLocation(true);
              setSaved(false);
            }}
            className="text-sm text-primary hover:underline"
          >
            Change location
          </button>
        </div>
      )}

      {changingLocation && (
        <form onSubmit={handleSubmit} className="mt-2 space-y-3">
          <input
            type="text"
            className={inputClass()}
            style={inputStyle()}
            onFocus={handleFocus}
            onBlur={handleBlur}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="City, region, country"
          />
          <ErrorBanner message={error} onDismiss={() => setError("")} />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setChangingLocation(false)}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-background"
            >
              Cancel
            </button>
            <SaveButton saving={saving} />
          </div>
        </form>
      )}

      <SuccessNote show={saved && !changingLocation} />
    </div>
  );
}

export default function Settings() {
  const { user, updateUser } = useAuth();

  if (!user) {
    return <LoadingSpinner fullScreen label="Loading settings…" />;
  }

  return (
    <div className="mx-auto max-w-170 space-y-6 p-6 text-text-primary">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <PanelInfoSection user={user} updateUser={updateUser} />
      <EnergySettingsSection user={user} updateUser={updateUser} />
      <ChangePasswordSection />
      <AccountSection user={user} updateUser={updateUser} />
    </div>
  );
}
