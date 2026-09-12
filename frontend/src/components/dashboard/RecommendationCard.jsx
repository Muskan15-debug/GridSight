import { motion } from "framer-motion";
import useAnimatedNumber from "../../hooks/useAnimatedNumber";

const ACTION_CONFIG = {
  charge_storage: {
    borderClass: "border-l-success",
    textClass: "text-success",
    rgb: "16,185,129",
    figureKey: "surplus_kwh",
    figureLabel: "Surplus",
  },
  export_or_curtail: {
    borderClass: "border-l-info",
    textClass: "text-info",
    rgb: "59,130,246",
    figureKey: "excess_kwh",
    figureLabel: "Excess",
  },
  draw_from_storage: {
    borderClass: "border-l-warning",
    textClass: "text-warning",
    rgb: "245,158,11",
    figureKey: "deficit_kwh",
    figureLabel: "Deficit",
  },
  draw_from_grid: {
    borderClass: "border-l-danger",
    textClass: "text-danger",
    rgb: "239,68,68",
    figureKey: "grid_kwh_needed",
    figureLabel: "Grid needed",
  },
};

export default function RecommendationCard({ recommendation }) {
  const config = recommendation
    ? ACTION_CONFIG[recommendation.action] ?? {
        borderClass: "border-l-border",
        textClass: "text-text-primary",
        rgb: "148,163,184",
      }
    : null;
  const figureValue = config?.figureKey ? recommendation[config.figureKey] : undefined;
  const animatedFigure = useAnimatedNumber(figureValue ?? 0, 700);

  if (!recommendation) return null;

  return (
    <div className="relative md:col-span-2">
      <motion.div
        className="pointer-events-none absolute -inset-2 rounded-2xl blur-xl"
        style={{ backgroundColor: `rgba(${config.rgb}, 1)` }}
        animate={{ opacity: [0.08, 0.22, 0.08] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      />
      <div className={`glass-card relative rounded-xl border-l-4 ${config.borderClass} p-6`}>
        <p className={`text-sm font-medium ${config.textClass}`}>{recommendation.title}</p>
        <p className="mt-2 text-text-primary">{recommendation.message}</p>
        {figureValue !== undefined && (
          <p className="mt-3 font-heading text-xl font-bold text-text-primary">
            {animatedFigure.toFixed(1)} kWh{" "}
            <span className="font-sans text-sm font-normal text-text-secondary">
              {config.figureLabel}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
