import { motion } from "framer-motion";

export default function HeroSVG() {
  return (
    <svg
      viewBox="0 0 500 120"
      width="500"
      style={{ maxWidth: "100%" }}
      className="mx-auto"
    >
      {/* Sun icon */}
      <g transform="translate(40, 60)">
        <circle r="18" fill="#F59E0B" />
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * Math.PI) / 4;
          const x1 = Math.cos(angle) * 24;
          const y1 = Math.sin(angle) * 24;
          const x2 = Math.cos(angle) * 30;
          const y2 = Math.sin(angle) * 30;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#F59E0B"
              strokeWidth="2"
              strokeLinecap="round"
            />
          );
        })}
      </g>

      {/* Dashed arrow 1 */}
      <line
        x1="70"
        y1="60"
        x2="195"
        y2="60"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeDasharray="6 6"
        opacity="0.5"
      />
      <path d="M 190 54 L 200 60 L 190 66" fill="none" stroke="#F59E0B" strokeWidth="2" opacity="0.5" />

      {/* Solar panel icon */}
      <g transform="translate(220, 60)">
        <rect x="-22" y="-16" width="44" height="32" rx="3" fill="none" stroke="#F59E0B" strokeWidth="2" />
        <line x1="-22" y1="-5.5" x2="22" y2="-5.5" stroke="#F59E0B" strokeWidth="1.5" />
        <line x1="-22" y1="5.5" x2="22" y2="5.5" stroke="#F59E0B" strokeWidth="1.5" />
        <line x1="-7.5" y1="-16" x2="-7.5" y2="16" stroke="#F59E0B" strokeWidth="1.5" />
        <line x1="7.5" y1="-16" x2="7.5" y2="16" stroke="#F59E0B" strokeWidth="1.5" />
      </g>

      {/* Dashed arrow 2 */}
      <line
        x1="250"
        y1="60"
        x2="375"
        y2="60"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeDasharray="6 6"
        opacity="0.5"
      />
      <path d="M 370 54 L 380 60 L 370 66" fill="none" stroke="#F59E0B" strokeWidth="2" opacity="0.5" />

      {/* Battery icon */}
      <g transform="translate(430, 60)">
        <rect x="-20" y="-14" width="40" height="28" rx="3" fill="none" stroke="#F59E0B" strokeWidth="2" />
        <rect x="20" y="-6" width="5" height="12" rx="1" fill="#F59E0B" />
        <rect x="-14" y="-8" width="20" height="16" fill="#F59E0B" opacity="0.6" />
      </g>

      {/* Traveling particle along the full path */}
      <motion.circle
        r="5"
        cy="60"
        fill="#F59E0B"
        initial={{ cx: 40 }}
        animate={{ cx: 460 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
    </svg>
  );
}
