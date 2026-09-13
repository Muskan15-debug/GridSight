import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import AuthSplitLayout from "../components/auth/AuthSplitLayout";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

function authInputStyle() {
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

function authLabelClass() {
  return "mb-1 block uppercase";
}

function authLabelStyle() {
  return {
    fontFamily: "'Inter', sans-serif",
    color: "#6B7280",
    fontSize: "0.75rem",
    letterSpacing: "0.05em",
  };
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await api.post("/api/v1/auth/login", { email, password });
      login(res.data.token, res.data.user);
      navigate("/dashboard");
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Invalid email or password.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthSplitLayout>
      <p style={{ fontFamily: "'Inter', sans-serif", color: "#6B7280", fontSize: "0.85rem" }}>
        Welcome back
      </p>
      <h1
        className="mb-8 mt-1"
        style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "2rem", fontWeight: 700, color: "#F8FAFC" }}
      >
        Log in
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className={authLabelClass()} style={authLabelStyle()} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={authInputStyle()}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>

        <div>
          <label className={authLabelClass()} style={authLabelStyle()} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={authInputStyle()}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <motion.button
          type="submit"
          disabled={submitting}
          whileTap={{ scale: 0.98 }}
          style={{
            backgroundColor: "#F59E0B",
            color: "#0A0A0A",
            borderRadius: 4,
            padding: "13px",
            width: "100%",
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 600,
            border: "none",
          }}
          className="disabled:opacity-50"
        >
          {submitting ? "Logging in…" : "Log in"}
        </motion.button>
      </form>

      <p className="mt-6" style={{ fontFamily: "'Inter', sans-serif", color: "#6B7280", fontSize: "0.85rem" }}>
        Don't have an account?{" "}
        <Link to="/signup" style={{ color: "#F59E0B", textDecoration: "none" }}>
          Sign up
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
