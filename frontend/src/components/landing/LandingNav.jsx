import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > window.innerHeight * 0.7);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-border bg-background/70 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <span className="font-heading text-lg font-semibold text-text-primary">GridSight</span>
        <div className="flex items-center gap-6">
          <Link
            to="/login"
            className="text-sm font-medium text-text-secondary transition hover:text-text-primary"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  );
}
