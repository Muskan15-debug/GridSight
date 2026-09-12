const ACTION_CONFIG = {
  charge_storage: {
    borderClass: "border-success",
    textClass: "text-success",
    figureKey: "surplus_kwh",
    figureLabel: "Surplus",
  },
  export_or_curtail: {
    borderClass: "border-info",
    textClass: "text-info",
    figureKey: "excess_kwh",
    figureLabel: "Excess",
  },
  draw_from_storage: {
    borderClass: "border-warning",
    textClass: "text-warning",
    figureKey: "deficit_kwh",
    figureLabel: "Deficit",
  },
  draw_from_grid: {
    borderClass: "border-danger",
    textClass: "text-danger",
    figureKey: "grid_kwh_needed",
    figureLabel: "Grid needed",
  },
};

export default function RecommendationCard({ recommendation }) {
  if (!recommendation) return null;

  const config = ACTION_CONFIG[recommendation.action] ?? {
    borderClass: "border-border",
    textClass: "text-text-primary",
  };
  const figureValue = config.figureKey ? recommendation[config.figureKey] : undefined;

  return (
    <div className={`rounded-xl border-l-4 ${config.borderClass} border-y border-r border-border bg-card p-6`}>
      <p className={`text-sm font-medium ${config.textClass}`}>{recommendation.title}</p>
      <p className="mt-2 text-text-primary">{recommendation.message}</p>
      {figureValue !== undefined && (
        <p className="mt-3 text-xl font-bold text-text-primary">
          {figureValue} kWh <span className="text-sm font-normal text-text-secondary">{config.figureLabel}</span>
        </p>
      )}
    </div>
  );
}
