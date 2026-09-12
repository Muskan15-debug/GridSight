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

  const bgPath = describeArc(cx, cy, r, -90, 90);
  const valuePath = describeArc(cx, cy, r, -90, -90 + ratio * 180);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 70" className="w-28">
        <path
          d={bgPath}
          fill="none"
          stroke="#334155"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {ratio > 0 && (
          <path
            d={valuePath}
            fill="none"
            stroke="#F59E0B"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}
      </svg>
      <span className="text-lg font-semibold text-text-primary">
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
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-sm text-text-secondary">Weather</p>
        {updatedAt && (
          <p className="text-xs text-text-secondary">Updated {updatedAt}</p>
        )}
      </div>
      <div className="flex flex-wrap justify-around gap-4">
        {GAUGE_ORDER.map(({ key, label }) => {
          const gauge = weather.gauges[key];
          if (!gauge) return null;
          return (
            <GaugeArc
              key={key}
              label={label}
              value={gauge.value}
              unit={gauge.unit}
              max={gauge.max}
            />
          );
        })}
      </div>
    </div>
  );
}
