function polarToCartesian(cx, cy, r, angleDeg) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

function GaugeArc({ label, value, unit, max }) {
  const r = 45;
  const cx = 60;
  const cy = 60;
  const strokeWidth = 10;
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;

  const fullArcPath = describeArc(cx, cy, r, -90, 90);
  const arcLength = Math.PI * r;
  const dashOffset = arcLength * (1 - ratio);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-0 rounded-full blur-lg transition-opacity duration-700"
          style={{ opacity: 0.15 + ratio * 0.45, backgroundColor: "#F59E0B" }}
          aria-hidden="true"
        />
        <svg viewBox="0 0 120 70" className="relative w-28">
          <path
            d={fullArcPath}
            fill="none"
            stroke="#334155"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <path
            d={fullArcPath}
            fill="none"
            stroke="#F59E0B"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.7s ease" }}
          />
        </svg>
      </div>
      <span className="font-heading text-lg font-semibold text-text-primary">
        {Number(value).toFixed(1)}
        {unit}
      </span>
      <span className="text-xs text-text-secondary">{label}</span>
    </div>
  );
}

const GAUGE_ORDER = [
  { key: "ghi", label: "GHI" },
  { key: "temperature", label: "Temperature" },
  { key: "wind_speed", label: "Wind Speed" },
  { key: "relative_humidity", label: "Relative Humidity" },
  { key: "solar_zenith_angle", label: "Solar Zenith Angle" },
];

export default function WeatherGauges({ weather }) {
  if (!weather?.gauges) return null;

  const updatedAt = weather.timestamp
    ? new Date(weather.timestamp).toLocaleString()
    : null;

  return (
    <div className="md:col-span-2">
      <div className="mb-2 flex items-baseline justify-between px-1">
        <p className="text-sm text-text-secondary">Weather</p>
        {updatedAt && (
          <p className="text-xs text-text-secondary">Updated {updatedAt}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {GAUGE_ORDER.map(({ key, label }) => {
          const gauge = weather.gauges[key];
          if (!gauge) return null;
          return (
            <div key={key} className="glass-card flex justify-center rounded-xl p-4">
              <GaugeArc label={label} value={gauge.value} unit={gauge.unit} max={gauge.max} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
