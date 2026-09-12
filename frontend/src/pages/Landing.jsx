import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import CursorGlow from "../components/landing/CursorGlow";
import HeroSVG from "../components/landing/HeroSVG";
import Navbar from "../components/landing/Navbar";

function useCountUp(target, duration = 1500) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            setValue(Math.round(progress * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return [ref, value];
}

const glowButtonAnimation = {
  boxShadow: [
    "0 0 0px rgba(245,158,11,0.4)",
    "0 0 30px rgba(245,158,11,0.7)",
    "0 0 0px rgba(245,158,11,0.4)",
  ],
};

function GetStartedButton() {
  return (
    <motion.div
      animate={glowButtonAnimation}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      style={{ display: "inline-block", borderRadius: 50 }}
    >
      <motion.div whileTap={{ scale: 0.97 }}>
        <Link
          to="/signup"
          style={{
            display: "inline-block",
            backgroundColor: "#F59E0B",
            color: "#0F172A",
            borderRadius: 50,
            padding: "14px 36px",
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 600,
            fontSize: "1rem",
          }}
        >
          Get Started
        </Link>
      </motion.div>
    </motion.div>
  );
}

const HOW_IT_WORKS = [
  {
    icon: "🌤️",
    title: "Weather Data",
    description:
      "We pull live GHI, DNI, DHI, temperature, and wind data for your exact location.",
  },
  {
    icon: "🤖",
    title: "AI Prediction",
    description:
      "A trained model turns raw weather into a 72-hour hourly power forecast for your panels.",
  },
  {
    icon: "💡",
    title: "Smart Recommendation",
    description:
      "We compare your forecasted generation against demand and storage to tell you what to do.",
  },
  {
    icon: "💰",
    title: "You Save",
    description:
      "Charge storage, export surplus, or draw from the grid at the right time — never guess again.",
  },
];

const STATS = [
  { target: 72, label: "Hour Forecasts" },
  { target: 12, label: "Weather Data Points" },
  { target: 4, label: "Recommendation Types" },
];

function StatItem({ target, label }) {
  const [ref, value] = useCountUp(target);
  return (
    <div ref={ref} className="text-center">
      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          color: "#F59E0B",
          fontSize: "clamp(2.5rem, 5vw, 4rem)",
          fontWeight: 700,
        }}
      >
        {value}
      </div>
      <div
        style={{ fontFamily: "'Inter', sans-serif", color: "#94A3B8" }}
        className="mt-2 text-sm md:text-base"
      >
        {label}
      </div>
    </div>
  );
}

export default function Landing() {
  const heroRef = useRef(null);

  return (
    <div>
      {/* Section 1 — Hero */}
      <section
        ref={heroRef}
        className="relative overflow-hidden flex items-center justify-center"
        style={{ minHeight: "100vh", backgroundColor: "#0F172A" }}
      >
        <Navbar />
        <CursorGlow containerRef={heroRef} />

        <div className="relative z-10 max-w-4xl mx-auto px-6 flex flex-col items-center text-center gap-6">
          <h1
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              fontWeight: 700,
              lineHeight: 1.1,
              backgroundImage: "linear-gradient(90deg, #F59E0B, #FDE68A)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            Know Your Power. Before It Happens.
          </h1>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              color: "#94A3B8",
              fontSize: "clamp(1rem, 2vw, 1.25rem)",
              maxWidth: "40rem",
            }}
          >
            72-hour solar generation forecasts powered by real weather data and AI.
          </p>

          <GetStartedButton />

          <div className="mt-8 w-full">
            <HeroSVG />
          </div>
        </div>
      </section>

      {/* Section 2 — How it works */}
      <section style={{ backgroundColor: "#0F172A", padding: "120px 0" }}>
        <div className="max-w-6xl mx-auto px-6">
          <p
            className="text-center uppercase tracking-widest text-sm font-semibold mb-4"
            style={{ color: "#F59E0B", fontFamily: "'Inter', sans-serif" }}
          >
            How It Works
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            {HOW_IT_WORKS.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                style={{
                  backgroundColor: "#1E293B",
                  borderRadius: 16,
                  padding: 32,
                }}
              >
                <div className="text-3xl mb-4">{card.icon}</div>
                <h3
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    color: "#F8FAFC",
                    fontWeight: 600,
                  }}
                  className="text-lg mb-2"
                >
                  {card.title}
                </h3>
                <p
                  style={{ fontFamily: "'Inter', sans-serif", color: "#94A3B8" }}
                  className="text-sm"
                >
                  {card.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3 — Stats */}
      <section style={{ backgroundColor: "#0A1120", padding: "100px 0" }}>
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-12">
          {STATS.map((stat) => (
            <StatItem key={stat.label} target={stat.target} label={stat.label} />
          ))}
        </div>
      </section>

      {/* Section 4 — Final CTA */}
      <section
        style={{ backgroundColor: "#0F172A", padding: "120px 0" }}
        className="flex flex-col items-center text-center px-6"
      >
        <h2
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            color: "#F8FAFC",
            fontSize: "clamp(1.75rem, 4vw, 3rem)",
            fontWeight: 700,
          }}
          className="mb-8 max-w-2xl"
        >
          Start predicting your solar output today.
        </h2>
        <GetStartedButton />
      </section>
    </div>
  );
}
