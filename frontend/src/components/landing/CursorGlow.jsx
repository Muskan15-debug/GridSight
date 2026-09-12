import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef } from "react";

export default function CursorGlow({ containerRef }) {
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const springX = useSpring(x, { stiffness: 80, damping: 20 });
  const springY = useSpring(y, { stiffness: 80, damping: 20 });
  const localRef = useRef(null);

  useEffect(() => {
    const el = containerRef?.current ?? localRef.current?.parentElement;
    if (!el) return;

    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      x.set(e.clientX - rect.left);
      y.set(e.clientY - rect.top);
    };

    el.addEventListener("mousemove", handleMouseMove);
    return () => el.removeEventListener("mousemove", handleMouseMove);
  }, [containerRef, x, y]);

  return (
    <motion.div
      ref={localRef}
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{
        left: springX,
        top: springY,
        translateX: "-50%",
        translateY: "-50%",
        width: 400,
        height: 400,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(245,158,11,1) 0%, rgba(245,158,11,0) 70%)",
        filter: "blur(80px)",
        opacity: 0.15,
      }}
    />
  );
}
