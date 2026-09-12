import { motion } from "framer-motion";

const Y = 40;
const SUN_X = 30;
const PANEL_X = 150;
const BATTERY_X = 270;

const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export default function EnergyFlow() {
  return (
    <svg viewBox="0 0 300 80" className="mx-auto w-full max-w-sm" aria-hidden="true">
      {/* Sun */}
      <g stroke="#FCD34D" strokeWidth="2" strokeLinecap="round">
        <circle cx={SUN_X} cy={Y} r="9" fill="#FCD34D" stroke="none" />
        {RAY_ANGLES.map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = SUN_X + Math.cos(rad) * 13;
          const y1 = Y + Math.sin(rad) * 13;
          const x2 = SUN_X + Math.cos(rad) * 17;
          const y2 = Y + Math.sin(rad) * 17;
          return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>

      {/* Arrow: sun -> panel */}
      <line
        x1={SUN_X + 20}
        y1={Y}
        x2={PANEL_X - 20}
        y2={Y}
        stroke="#475569"
        strokeWidth="2"
        strokeDasharray="4 4"
      />
      <polygon points={`${PANEL_X - 20},${Y - 4} ${PANEL_X - 20},${Y + 4} ${PANEL_X - 14},${Y}`} fill="#475569" />

      {/* Panel icon */}
      <g transform={`translate(${PANEL_X - 16}, ${Y - 14})`} stroke="#F59E0B" strokeWidth="2" fill="none">
        <rect width="32" height="28" rx="2" />
        <line x1="0" y1="9.3" x2="32" y2="9.3" />
        <line x1="0" y1="18.6" x2="32" y2="18.6" />
        <line x1="10.6" y1="0" x2="10.6" y2="28" />
        <line x1="21.3" y1="0" x2="21.3" y2="28" />
      </g>

      {/* Arrow: panel -> battery */}
      <line
        x1={PANEL_X + 20}
        y1={Y}
        x2={BATTERY_X - 20}
        y2={Y}
        stroke="#475569"
        strokeWidth="2"
        strokeDasharray="4 4"
      />
      <polygon
        points={`${BATTERY_X - 20},${Y - 4} ${BATTERY_X - 20},${Y + 4} ${BATTERY_X - 14},${Y}`}
        fill="#475569"
      />

      {/* Battery icon */}
      <g transform={`translate(${BATTERY_X - 14}, ${Y - 12})`} stroke="#10B981" strokeWidth="2" fill="none">
        <rect width="28" height="24" rx="3" />
        <rect x="28" y="8" width="4" height="8" fill="#10B981" stroke="none" />
        <rect x="4" y="6" width="14" height="12" fill="#10B981" fillOpacity="0.5" stroke="none" />
      </g>

      {/* Traveling glow dot */}
      <motion.circle
        r="4"
        cy={Y}
        fill="#FCD34D"
        style={{ filter: "drop-shadow(0 0 6px #FCD34D)" }}
        initial={{ cx: SUN_X }}
        animate={{ cx: [SUN_X, PANEL_X, BATTERY_X, BATTERY_X] }}
        transition={{
          duration: 3,
          times: [0, 0.45, 0.9, 1],
          repeat: Infinity,
          repeatDelay: 0.4,
          ease: "easeInOut",
        }}
      />
    </svg>
  );
}
