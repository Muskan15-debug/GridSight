import { useEffect, useRef, useState } from "react";

/**
 * Smoothly tweens a displayed number from its previous value to `target`
 * whenever `target` changes, instead of snapping instantly.
 */
export default function useAnimatedNumber(target, duration = 600) {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  const frameRef = useRef();

  useEffect(() => {
    const from = fromRef.current;
    const to = target;
    if (from === to) return;

    let startTime = null;

    function tick(now) {
      if (startTime === null) startTime = now;
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(from + (to - from) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return display;
}
