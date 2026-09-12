import { useState } from "react";
import GlowButton from "../components/common/GlowButton";
import LoadingSpinner from "../components/common/LoadingSpinner";
import LocationPicker from "../components/common/LocationPicker";
import { useToast } from "../components/common/Toast";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

function inputClass() {
  return "w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary focus:border-primary focus:outline-none";
}

function labelClass() {
  return "mb-1 block text-sm text-text-secondary";
}

function SectionCard({ title, children }) {
  return (
    <div className="glass-card rounded-xl p-6">
      <h2 className="mb-4 font-heading text-lg font-semibold text-text-primary">{title}</h2>
      {children}
    </div>
  );
}

function useSaveFeedback() {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  async function run(action, successMessage) {
    setSaving(true);
    try {
      await action();
      setSaving(false);
      setSuccess(true);
      showToast(successMessage, "success");
      setTimeout(() => setSuccess(false), 1200);
      return true;
    } catch (err) {
      setSaving(false);
      const detail = err.response?.data?.detail;
      showToast(typeof detail === "string" ? detail : "Something went wrong. Please try again.", "error");
      return false;
    }
  }

  return { saving, success, run };
}

function PanelInfoSection({ user, updateUser }) {
  const [panelAreaSqm, setPanelAreaSqm] = useState(user.panel?.area_sqm ?? "");
  const [panelCapacityKw, setPanelCapacityKw] = useState(user.panel?.capacity_kw ?? "");
  const { saving, success, run } = useSaveFeedback();

  async function handleSubmit(e) {
    e.preventDefault();
    await run(async () => {
      const res = await api.put("/api/v1/users/me", {
        panel_area_sqm: parseFloat(panelAreaSqm),
        panel_capacity_kw: parseFloat(panelCapacityKw),
      });
      updateUser({ panel: res.data.panel });
    }, "Panel info saved.");
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
            value={panelCapacityKw}
            onChange={(e) => setPanelCapacityKw(e.target.value)}
          />
        </div>
        <GlowButton type="submit" loading={saving} success={success} disabled={saving || success}>
          Save
        </GlowButton>
      </form>
    </SectionCard>
  );
}

function EnergySettingsSection({ user, updateUser }) {
  const [demandKwh, setDemandKwh] = useState(user.demand?.default_daily_kwh ?? "");
  const [storageCapacityKwh, setStorageCapacityKwh] = useState(user.storage?.capacity_kwh ?? "");
  const [currentChargeKwh, setCurrentChargeKwh] = useState(user.storage?.current_charge_kwh ?? "");
  const { saving, success, run } = useSaveFeedback();

  async function handleSubmit(e) {
    e.preventDefault();
    await run(async () => {
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
    }, "Energy settings saved.");
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
            value={currentChargeKwh}
            onChange={(e) => setCurrentChargeKwh(e.target.value)}
          />
        </div>
        <p className="text-xs text-text-secondary">
          Updating these values will automatically recalculate your recommendation.
        </p>
        <GlowButton type="submit" loading={saving} success={success} disabled={saving || success}>
          Save
        </GlowButton>
      </form>
    </SectionCard>
  );
}

function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const { showToast } = useToast();
  const { saving, success, run } = useSaveFeedback();

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast("New password must be at least 8 characters.", "error");
      return;
    }
    const ok = await run(async () => {
      await api.put("/api/v1/auth/password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
    }, "Password changed.");
    if (ok) {
      setCurrentPassword("");
      setNewPassword("");
    }
  }

  return (
    <SectionCard title="Change Password">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass()} htmlFor="current-password">Current password</label>
          <input
            id="current-password"
            type="password"
            className={inputClass()}
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
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <GlowButton type="submit" loading={saving} success={success} disabled={saving || success}>
          Change password
        </GlowButton>
      </form>
    </SectionCard>
  );
}

function AccountSection({ user, updateUser }) {
  const [changingLocation, setChangingLocation] = useState(false);
  const [location, setLocation] = useState({ mode: "address", address: "" });
  const { saving, success, run } = useSaveFeedback();

  async function handleSubmit(e) {
    e.preventDefault();
    const ok = await run(async () => {
      const payload =
        location.mode === "coords"
          ? { lat: location.lat, lon: location.lon, display_name: location.display_name }
          : { address: location.address };
      const res = await api.put("/api/v1/users/me", payload);
      updateUser({ location: res.data.location });
    }, "Location updated.");
    if (ok) setChangingLocation(false);
  }

  return (
    <SectionCard title="Account">
      <div className="space-y-4">
        <div>
          <p className={labelClass()}>Email</p>
          <p className="text-text-primary">{user.email}</p>
        </div>

        <div>
          <p className={labelClass()}>Location</p>
          {!changingLocation && (
            <div className="flex items-center justify-between">
              <p className="text-text-primary">{user.location?.display_name}</p>
              <button
                type="button"
                onClick={() => {
                  setLocation({ mode: "address", address: user.location?.display_name ?? "" });
                  setChangingLocation(true);
                }}
                className="text-sm text-primary hover:underline"
              >
                Change location
              </button>
            </div>
          )}

          {changingLocation && (
            <form onSubmit={handleSubmit} className="mt-2 space-y-3">
              <LocationPicker
                initialAddress={user.location?.display_name ?? ""}
                onChange={(value) => setLocation(value)}
              />
              <div className="flex gap-3">
                <GlowButton type="button" variant="secondary" onClick={() => setChangingLocation(false)} fullWidth>
                  Cancel
                </GlowButton>
                <GlowButton
                  type="submit"
                  loading={saving}
                  success={success}
                  disabled={saving || success}
                  fullWidth
                >
                  Save
                </GlowButton>
              </div>
            </form>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

export default function Settings() {
  const { user, updateUser } = useAuth();

  if (!user) {
    return <LoadingSpinner fullScreen label="Loading settings…" />;
  }

  return (
    <div className="space-y-6 p-6 text-text-primary">
      <h1 className="font-heading text-2xl font-semibold">Settings</h1>
      <PanelInfoSection user={user} updateUser={updateUser} />
      <EnergySettingsSection user={user} updateUser={updateUser} />
      <ChangePasswordSection />
      <AccountSection user={user} updateUser={updateUser} />
    </div>
  );
}
