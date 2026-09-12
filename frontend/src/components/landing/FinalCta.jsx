import { motion } from "framer-motion";
import CtaButton from "./CtaButton";

export default function FinalCta() {
  return (
    <section className="relative z-10 px-6 py-28 text-center">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.5 }}
        className="mb-4 font-heading text-3xl font-semibold text-text-primary sm:text-4xl"
      >
        Stop guessing. Start knowing.
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mx-auto mb-10 max-w-xl text-text-secondary"
      >
        Set up your panel in minutes and get your first 72-hour forecast today.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <CtaButton>Get Started</CtaButton>
      </motion.div>
    </section>
  );
}
