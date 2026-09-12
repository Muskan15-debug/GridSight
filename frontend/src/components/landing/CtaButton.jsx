import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function CtaButton({ to = "/signup", children = "Get Started", className = "" }) {
  return (
    <motion.div
      className={`inline-block rounded-full ${className}`}
      animate={{
        boxShadow: [
          "0 0 18px 2px rgba(245,158,11,0.35)",
          "0 0 38px 10px rgba(245,158,11,0.55)",
          "0 0 18px 2px rgba(245,158,11,0.35)",
        ],
      }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      whileTap={{ scale: 0.94 }}
    >
      <Link
        to={to}
        className="inline-block rounded-full bg-gradient-to-r from-amber-500 to-amber-300 px-8 py-3 font-heading text-base font-semibold text-background transition hover:brightness-110"
      >
        {children}
      </Link>
    </motion.div>
  );
}
