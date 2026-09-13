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

function getStatus(kw, ratio) {
  if (kw <= 0.01) {
    return { label: "NIGHT", border: "#475569", badgeBg: "rgba(148,163,184,0.15)", badgeText: "#94A3B8" };
  }
  if (ratio < 0.3) {
    return { label: "LOW", border: "#F59E0B", badgeBg: "rgba(245,158,11,0.15)", badgeText: "#F59E0B" };
  }
  return { label: "GENERATING", border: "#10B981", badgeBg: "rgba(16,185,129,0.15)", badgeText: "#10B981" };
}

export default function CurrentPowerCard({ forecast, panelCapacityKw }) {
  const entry = findCurrentHourEntry(forecast?.hourly);
  const kw = entry?.predicted_ac_power_kw ?? 0;
  const ratio = panelCapacityKw > 0 ? kw / panelCapacityKw : 0;
  const status = getStatus(kw, ratio);

  return (
    <div
      className="h-full rounded-xl bg-card p-6"
      style={{ borderLeft: `3px solid ${status.border}` }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">Current Power</p>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold tracking-wide"
          style={{ backgroundColor: status.badgeBg, color: status.badgeText }}
        >
          {status.label}
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span
          className="font-bold text-text-primary"
          style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(4rem, 8vw, 7rem)", lineHeight: 1 }}
        >
          {kw.toFixed(2)}
        </span>
        <span className="text-2xl font-semibold" style={{ color: "#F59E0B" }}>
          kW
        </span>
      </div>
      {entry && (
        <p className="mt-2 text-sm text-text-secondary">
          Forecast for {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · updates hourly
        </p>
      )}
    </div>
  );
}
