import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect } from "react";

export default function CursorGlow({ containerRef }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { damping: 22, stiffness: 120, mass: 0.6 });
  const springY = useSpring(mouseY, { damping: 22, stiffness: 120, mass: 0.6 });

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    mouseX.set(rect.width / 2);
    mouseY.set(rect.height / 2);

    function handleMove(e) {
      const rect = node.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    }

    node.addEventListener("mousemove", handleMove);
    return () => node.removeEventListener("mousemove", handleMove);
  }, [containerRef, mouseX, mouseY]);

  return (
    <motion.div
      className="pointer-events-none absolute z-0 rounded-full"
      style={{
        left: springX,
        top: springY,
        width: 400,
        height: 400,
        marginLeft: -200,
        marginTop: -200,
        background:
          "radial-gradient(circle, rgba(245,158,11,0.35) 0%, rgba(252,211,77,0.15) 40%, rgba(245,158,11,0) 70%)",
        filter: "blur(50px)",
      }}
      aria-hidden="true"
    />
  );
}
