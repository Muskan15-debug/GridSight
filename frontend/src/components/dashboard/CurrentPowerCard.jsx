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

export default function CurrentPowerCard({ forecast, panelCapacityKw }) {
  const entry = findCurrentHourEntry(forecast?.hourly);
  const kw = entry?.predicted_ac_power_kw ?? 0;
  const ratio = panelCapacityKw > 0 ? kw / panelCapacityKw : 0;

  const dotColor = ratio > 0.7 ? "bg-success" : ratio >= 0.3 ? "bg-warning" : "bg-danger";

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <p className="text-sm text-text-secondary">Current Power</p>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="text-4xl font-bold text-text-primary">{kw.toFixed(2)}</span>
        <span className="text-lg text-text-secondary">kW</span>
        <span className={`ml-2 h-3 w-3 rounded-full ${dotColor}`} />
      </div>
      {entry && (
        <p className="mt-1 text-xs text-text-secondary">
          As of {new Date(entry.timestamp).toLocaleString()}
        </p>
      )}
    </div>
  );
}
