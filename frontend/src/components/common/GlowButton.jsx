import { AnimatePresence, motion } from "framer-motion";

function Spinner() {
  return (
    <motion.span
      key="spinner"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
      className="h-4 w-4 animate-spin rounded-full border-2 border-background/40 border-t-background"
    />
  );
}

function Checkmark() {
  return (
    <motion.svg
      key="check"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
    >
      <motion.path
        d="M4 10.5l3.5 3.5L16 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
    </motion.svg>
  );
}

export default function GlowButton({
  type = "button",
  onClick,
  disabled = false,
  loading = false,
  success = false,
  children,
  className = "",
  fullWidth = false,
  variant = "primary",
}) {
  const isSecondary = variant === "secondary";

  return (
    <motion.div
      className={`inline-block rounded-md ${fullWidth ? "w-full" : ""} ${className}`}
      animate={
        isSecondary
          ? undefined
          : {
              boxShadow: [
                "0 0 12px 1px rgba(245,158,11,0.3)",
                "0 0 26px 6px rgba(245,158,11,0.5)",
                "0 0 12px 1px rgba(245,158,11,0.3)",
              ],
            }
      }
      transition={isSecondary ? undefined : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
    >
      <motion.button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        whileTap={{ scale: 0.97 }}
        className={`flex items-center justify-center gap-2 rounded-md px-4 py-2 font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
          fullWidth ? "w-full" : ""
        } ${
          isSecondary
            ? "border border-border text-text-primary hover:bg-background"
            : "bg-gradient-to-r from-amber-500 to-amber-300 text-background hover:brightness-110"
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {success ? (
            <Checkmark />
          ) : loading ? (
            <Spinner />
          ) : (
            <motion.span
              key="label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {children}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  );
}
