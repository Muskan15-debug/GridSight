import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import AuthSplitLayout from "../components/auth/AuthSplitLayout";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const STEP_LABELS = ["Account", "Panel & Location", "Demand", "Storage"];
const STEP_TITLES = ["Account details", "Panel & location", "Daily demand", "Battery storage"];

const initialForm = {
  email: "",
  password: "",
  panel_area_sqm: "",
  panel_capacity_kw: "",
  address: "",
  daily_demand_kwh: "",
  storage_capacity_kwh: "",
  current_charge_kwh: "",
};

function inputStyle() {
  return {
    background: "transparent",
    border: "none",
    borderBottom: "1px solid #334155",
    borderRadius: 0,
    padding: "12px 0",
    color: "#F8FAFC",
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.95rem",
    width: "100%",
  };
}

function handleFocus(e) {
  e.target.style.borderBottomColor = "#F59E0B";
}
function handleBlur(e) {
  e.target.style.borderBottomColor = "#334155";
}

function labelStyle() {
  return {
    fontFamily: "'Inter', sans-serif",
    color: "#6B7280",
    fontSize: "0.75rem",
    letterSpacing: "0.05em",
  };
}

function StepIndicator({ step }) {
  return (
    <p className="mb-6" style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8rem" }}>
      {STEP_LABELS.map((label, i) => (
        <span key={label} style={{ color: i === step ? "#F8FAFC" : "#374151" }}>
          {String(i + 1).padStart(2, "0")} &mdash; {label}
          {i < STEP_LABELS.length - 1 && <span style={{ color: "#374151" }}>&nbsp;&nbsp;</span>}
        </span>
      ))}
    </p>
  );
}

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validateStep() {
    if (step === 0) {
      if (!form.email || form.password.length < 8) {
        return "Enter a valid email and a password of at least 8 characters.";
      }
    } else if (step === 1) {
      if (!form.panel_area_sqm || !form.panel_capacity_kw || !form.address) {
        return "Fill in panel area, panel capacity, and address.";
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
      const res = await api.post("/api/v1/auth/signup", {
        email: form.email,
        password: form.password,
        panel_area_sqm: parseFloat(form.panel_area_sqm),
        panel_capacity_kw: parseFloat(form.panel_capacity_kw),
        address: form.address,
        daily_demand_kwh: parseFloat(form.daily_demand_kwh),
        storage_capacity_kwh: parseFloat(form.storage_capacity_kwh),
        current_charge_kwh: parseFloat(form.current_charge_kwh),
      });
      login(res.data.token, res.data.user);
      navigate("/onboarding");
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") {
        setError(detail);
      } else {
        setError("Something went wrong creating your account. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const isLastStep = step === STEP_LABELS.length - 1;

  return (
    <AuthSplitLayout>
      <StepIndicator step={step} />
      <h1
        className="mb-8"
        style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.4rem", fontWeight: 700, color: "#F8FAFC" }}
      >
        {STEP_TITLES[step]}
      </h1>

      <form onSubmit={handleSubmit}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {step === 0 && (
              <>
                <div>
                  <label style={labelStyle()} className="mb-1 block uppercase" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    style={inputStyle()}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                  />
                </div>
                <div>
                  <label style={labelStyle()} className="mb-1 block uppercase" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    style={inputStyle()}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                  />
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div>
                  <label style={labelStyle()} className="mb-1 block uppercase" htmlFor="panel_area_sqm">
                    Panel area (m²)
                  </label>
                  <input
                    id="panel_area_sqm"
                    type="number"
                    min="0"
                    step="any"
                    style={inputStyle()}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    value={form.panel_area_sqm}
                    onChange={(e) => update("panel_area_sqm", e.target.value)}
                  />
                </div>
                <div>
                  <label style={labelStyle()} className="mb-1 block uppercase" htmlFor="panel_capacity_kw">
                    Panel capacity (kW)
                  </label>
                  <input
                    id="panel_capacity_kw"
                    type="number"
                    min="0"
                    step="any"
                    style={inputStyle()}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    value={form.panel_capacity_kw}
                    onChange={(e) => update("panel_capacity_kw", e.target.value)}
                  />
                </div>
                <div>
                  <label style={labelStyle()} className="mb-1 block uppercase" htmlFor="address">
                    Address
                  </label>
                  <input
                    id="address"
                    type="text"
                    placeholder="City, region, country"
                    style={inputStyle()}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <div>
                <label style={labelStyle()} className="mb-1 block uppercase" htmlFor="daily_demand_kwh">
                  Average daily demand (kWh)
                </label>
                <input
                  id="daily_demand_kwh"
                  type="number"
                  min="0"
                  step="any"
                  style={inputStyle()}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  value={form.daily_demand_kwh}
                  onChange={(e) => update("daily_demand_kwh", e.target.value)}
                />
                <p className="mt-2 text-xs" style={{ color: "#6B7280" }}>
                  Average electricity your home or facility uses per day.
                </p>
              </div>
            )}

            {step === 3 && (
              <>
                <div>
                  <label style={labelStyle()} className="mb-1 block uppercase" htmlFor="storage_capacity_kwh">
                    Battery storage capacity (kWh)
                  </label>
                  <input
                    id="storage_capacity_kwh"
                    type="number"
                    min="0"
                    step="any"
                    style={inputStyle()}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    value={form.storage_capacity_kwh}
                    onChange={(e) => update("storage_capacity_kwh", e.target.value)}
                  />
                </div>
                <div>
                  <label style={labelStyle()} className="mb-1 block uppercase" htmlFor="current_charge_kwh">
                    Current charge level (kWh)
                  </label>
                  <input
                    id="current_charge_kwh"
                    type="number"
                    min="0"
                    step="any"
                    style={inputStyle()}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    value={form.current_charge_kwh}
                    onChange={(e) => update("current_charge_kwh", e.target.value)}
                  />
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {error && <p className="mt-4 text-sm text-danger">{error}</p>}

        <div className="flex gap-3 pt-8">
          {step > 0 && (
            <button
              type="button"
              onClick={handleBack}
              style={{
                background: "transparent",
                border: "1px solid #334155",
                color: "#F8FAFC",
                borderRadius: 4,
                padding: "13px",
              }}
              className="flex-1 font-medium"
            >
              Back
            </button>
          )}
          {!isLastStep && (
            <motion.button
              type="button"
              onClick={handleNext}
              whileTap={{ scale: 0.98 }}
              style={{
                backgroundColor: "#F59E0B",
                color: "#0A0A0A",
                borderRadius: 4,
                padding: "13px",
                border: "none",
              }}
              className="flex-1 font-medium"
            >
              Next
            </motion.button>
          )}
          {isLastStep && (
            <motion.button
              type="submit"
              disabled={submitting}
              whileTap={{ scale: 0.98 }}
              style={{
                backgroundColor: "#F59E0B",
                color: "#0A0A0A",
                borderRadius: 4,
                padding: "13px",
                border: "none",
              }}
              className="flex-1 font-medium disabled:opacity-50"
            >
              {submitting ? "Creating account…" : "Create account"}
            </motion.button>
          )}
        </div>
      </form>

      <p className="mt-6" style={{ fontFamily: "'Inter', sans-serif", color: "#6B7280", fontSize: "0.85rem" }}>
        Already have an account?{" "}
        <Link to="/login" style={{ color: "#F59E0B", textDecoration: "none" }}>
          Log in
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
