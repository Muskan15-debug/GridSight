import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 w-full z-50 transition-all duration-300"
      style={{
        backdropFilter: scrolled ? "blur(12px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
        backgroundColor: scrolled ? "rgba(15,23,42,0.85)" : "transparent",
        borderBottom: scrolled
          ? "1px solid rgba(255,255,255,0.08)"
          : "1px solid transparent",
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <span
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#F59E0B" }}
          className="font-bold text-xl tracking-tight"
        >
          GridSight
        </span>
        <div className="flex items-center gap-6">
          <Link
            to="/login"
            className="text-sm font-medium"
            style={{ color: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="text-sm font-medium px-4 py-2 rounded-full"
            style={{
              backgroundColor: "#F59E0B",
              color: "#0F172A",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  );
}
