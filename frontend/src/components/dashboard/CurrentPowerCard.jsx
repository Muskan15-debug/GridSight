import useAnimatedNumber from "../../hooks/useAnimatedNumber";

function findCurrentHourEntry(hourly) {
  if (!hourly || hourly.length === 0) return null;
  const now = new Date();
  let candidate = null;
  for (const entry of hourly) {
    if (new Date(entry.timestamp) <= now) {
      candidate = entry;
    } else {
      break;
    }
  }
  return candidate ?? hourly[0];
}

const STATUS = {
  green: { dot: "bg-success", rgb: "16,185,129" },
  yellow: { dot: "bg-warning", rgb: "245,158,11" },
  red: { dot: "bg-danger", rgb: "239,68,68" },
};

export default function CurrentPowerCard({ forecast, panelCapacityKw, refreshing, onRefresh }) {
  const entry = findCurrentHourEntry(forecast?.hourly);
  const kw = entry?.predicted_ac_power_kw ?? 0;
  const ratio = panelCapacityKw > 0 ? Math.min(kw / panelCapacityKw, 1) : 0;
  const animatedKw = useAnimatedNumber(kw, 800);

  const statusKey = ratio > 0.7 ? "green" : ratio >= 0.3 ? "yellow" : "red";
  const status = STATUS[statusKey];
  const glowOpacity = 0.08 + ratio * 0.32;

  return (
    <div className="relative md:col-span-2">
      <div
        className="pointer-events-none absolute -inset-4 rounded-2xl blur-2xl transition-opacity duration-700"
        style={{ backgroundColor: `rgba(${status.rgb}, ${glowOpacity})` }}
        aria-hidden="true"
      />
      <div className="glass-card relative rounded-xl p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">Current Power</p>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Refresh current power"
            className="text-text-secondary transition hover:text-text-primary disabled:opacity-40"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            >
              <path
                fillRule="evenodd"
                d="M15.312 3.313a8 8 0 1 0 2.196 7.039.75.75 0 0 0-1.456-.364 6.5 6.5 0 1 1-1.801-5.734l-1.627 1.627A.75.75 0 0 0 13.25 7.5h3.5A.75.75 0 0 0 17.5 6.75v-3.5a.75.75 0 0 0-1.28-.53l-1.908 1.593Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div className="mt-2 flex items-baseline gap-3">
          <span className="font-heading text-4xl font-bold text-text-primary">
            {animatedKw.toFixed(2)}
          </span>
          <span className="text-lg text-text-secondary">kW</span>
          <span className={`ml-2 h-3 w-3 rounded-full ${status.dot}`} />
        </div>
        {entry && (
          <p className="mt-1 text-xs text-text-secondary">
            Forecast for{" "}
            {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{" "}
            · updates hourly
          </p>
        )}
      </div>
    </div>
  );
}
