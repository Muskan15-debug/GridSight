import { useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const STATS = [
  { value: 72, suffix: "", label: "Hour Forecasts" },
  { value: 12, suffix: "+", label: "Weather Data Points" },
  { value: 4, suffix: "", label: "Recommendation Types" },
];

function useCountUp(target, duration, start) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;
    let startTime = null;
    let frameId;

    function tick(now) {
      if (startTime === null) startTime = now;
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(eased * target));
      if (progress < 1) frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [start, target, duration]);

  return value;
}

function StatItem({ value, suffix, label }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const count = useCountUp(value, 1600, inView);

  return (
    <div ref={ref} className="text-center">
      <p className="bg-gradient-to-r from-amber-500 to-amber-300 bg-clip-text font-heading text-5xl font-bold text-transparent">
        {count}
        {suffix}
      </p>
      <p className="mt-2 text-sm text-text-secondary">{label}</p>
    </div>
  );
}

export default function Stats() {
  return (
    <section className="relative z-10 border-y border-border bg-card/40 px-6 py-20">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-10 sm:grid-cols-3">
        {STATS.map((stat) => (
          <StatItem key={stat.label} {...stat} />
        ))}
      </div>
    </section>
  );
}
