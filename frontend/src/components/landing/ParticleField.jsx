import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 50;
const COLORS = ["#F59E0B", "#FCD34D"];

function createParticle(width, height, spawnAnywhere) {
  return {
    x: Math.random() * width,
    y: spawnAnywhere ? Math.random() * height : height + Math.random() * 100,
    radius: 1 + Math.random() * 1.8,
    baseOpacity: 0.15 + Math.random() * 0.15,
    vy: -(0.08 + Math.random() * 0.18),
    vx: (Math.random() - 0.5) * 0.12,
    wobbleAmplitude: 5 + Math.random() * 15,
    wobbleFrequency: 0.0005 + Math.random() * 0.001,
    wobblePhase: Math.random() * Math.PI * 2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  };
}

export default function ParticleField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: PARTICLE_COUNT }, () =>
      createParticle(width, height, true)
    );

    let animationFrameId;
    let lastTime = performance.now();

    function tick(now) {
      const dt = Math.min(now - lastTime, 50);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.y += p.vy * (dt / 16.67);
        p.x += p.vx * (dt / 16.67);
        const wobble = Math.sin(now * p.wobbleFrequency + p.wobblePhase) * p.wobbleAmplitude * 0.02;
        const drawX = p.x + wobble;

        if (p.y < -10) {
          Object.assign(p, createParticle(width, height, false));
          p.y = height + 10;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(drawX, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.baseOpacity;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.radius * 4;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      animationFrameId = requestAnimationFrame(tick);
    }

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}
