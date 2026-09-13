const STATS = [
  { value: "72h", label: "Forecast window" },
  { value: "12", label: "Weather inputs" },
  { value: "4", label: "Decision types" },
];

export default function AuthSplitLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <div
        className="hidden md:flex md:w-2/5 flex-col justify-between p-10"
        style={{ backgroundColor: "#0A0A0A", borderRight: "1px solid #1F1F1F" }}
      >
        <span
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#F8FAFC", fontSize: "1.1rem" }}
        >
          <span style={{ color: "#F59E0B" }}>&bull;</span> GridSight
        </span>

        <div className="flex flex-col gap-8">
          <div>
            <h1
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "clamp(2rem, 3.5vw, 3rem)",
                fontWeight: 700,
                color: "#F8FAFC",
                lineHeight: 1.1,
              }}
            >
              72 hours of
              <br />
              solar foresight.
            </h1>
            <p
              className="mt-4"
              style={{ fontFamily: "'Inter', sans-serif", color: "#6B7280", fontSize: "0.9rem" }}
            >
              Predict your panel output before the sun rises.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex items-baseline gap-3">
                <span
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    color: "#F59E0B",
                    fontSize: "1.3rem",
                    fontWeight: 700,
                  }}
                >
                  {stat.value}
                </span>
                <span style={{ fontFamily: "'Inter', sans-serif", color: "#6B7280", fontSize: "0.75rem" }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontFamily: "'Inter', sans-serif", color: "#374151", fontSize: "0.75rem" }}>
          Powered by XGBoost + Open-Meteo
        </p>
      </div>

      <div
        className="flex w-full md:w-3/5 items-center justify-center px-6 py-10"
        style={{ backgroundColor: "#0F172A" }}
      >
        <div className="w-full" style={{ maxWidth: 400 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
