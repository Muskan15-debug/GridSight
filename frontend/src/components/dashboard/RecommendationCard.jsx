const ACTION_CONFIG = {
  charge_storage: {
    borderColor: "#10B981",
    figureKey: "surplus_kwh",
    figureLabel: "Surplus",
  },
  export_or_curtail: {
    borderColor: "#3B82F6",
    figureKey: "excess_kwh",
    figureLabel: "Excess",
  },
  draw_from_storage: {
    borderColor: "#F59E0B",
    figureKey: "deficit_kwh",
    figureLabel: "Deficit",
  },
  draw_from_grid: {
    borderColor: "#EF4444",
    figureKey: "grid_kwh_needed",
    figureLabel: "Grid needed",
  },
};

export default function RecommendationCard({ recommendation }) {
  if (!recommendation) return null;

  const config = ACTION_CONFIG[recommendation.action] ?? { borderColor: "#334155" };
  const figureValue = config.figureKey ? recommendation[config.figureKey] : undefined;

  return (
    <div
      className="rounded-xl bg-card p-6"
      style={{ borderLeft: `3px solid ${config.borderColor}` }}
    >
      <p
        className="text-text-primary"
        style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.1rem", fontWeight: 600 }}
      >
        {recommendation.title}
      </p>
      <p className="mt-2 text-sm" style={{ color: "#94A3B8" }}>
        {recommendation.message}
      </p>
      {figureValue !== undefined && (
        <p
          className="mt-4 text-text-primary"
          style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "2rem", fontWeight: 700 }}
        >
          {figureValue} kWh{" "}
          <span className="text-sm font-normal" style={{ color: "#94A3B8" }}>
            {config.figureLabel}
          </span>
        </p>
      )}
    </div>
  );
}
