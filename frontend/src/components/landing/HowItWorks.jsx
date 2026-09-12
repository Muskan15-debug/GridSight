import { motion } from "framer-motion";

const STEPS = [
  {
    icon: "☀️",
    title: "Weather Data",
    desc: "Live GHI, temperature, wind, humidity and more, pulled from real weather models for your exact location.",
  },
  {
    icon: "🤖",
    title: "AI Prediction",
    desc: "A trained model turns that weather into an hour-by-hour solar power forecast, 72 hours out.",
  },
  {
    icon: "💡",
    title: "Smart Recommendation",
    desc: "We weigh generation against your demand and battery to tell you exactly what to do next.",
  },
  {
    icon: "💰",
    title: "You Save",
    desc: "Charge storage, export surplus, or draw from the grid — always at the right moment.",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.12, ease: "easeOut" },
  }),
};

export default function HowItWorks() {
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-6 py-24">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.5 }}
        className="mb-14 text-center font-heading text-3xl font-semibold text-text-primary sm:text-4xl"
      >
        How it works
      </motion.h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.title}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={cardVariants}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="mb-4 text-3xl">{step.icon}</div>
            <h3 className="mb-2 font-heading text-lg font-semibold text-text-primary">{step.title}</h3>
            <p className="text-sm text-text-secondary">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
