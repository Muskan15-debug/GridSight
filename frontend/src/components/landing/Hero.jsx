import { motion } from "framer-motion";
import { useRef } from "react";
import CtaButton from "./CtaButton";
import CursorGlow from "./CursorGlow";
import EnergyFlow from "./EnergyFlow";

export default function Hero() {
  const heroRef = useRef(null);

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center"
    >
      <CursorGlow containerRef={heroRef} />

      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 max-w-4xl font-heading text-4xl font-bold leading-tight text-transparent sm:text-6xl"
        style={{
          backgroundImage: "linear-gradient(90deg, #F59E0B, #FCD34D)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
        }}
      >
        Know Your Power.
        <br />
        Before It Happens.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
        className="relative z-10 mt-6 max-w-xl text-lg text-text-secondary"
      >
        GridSight forecasts your solar panel's output 72 hours ahead and tells you exactly when to
        store, use, or sell your energy.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
        className="relative z-10 mt-10"
      >
        <CtaButton>Get Started</CtaButton>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.45, ease: "easeOut" }}
        className="relative z-10 mt-16 w-full"
      >
        <EnergyFlow />
      </motion.div>
    </section>
  );
}
