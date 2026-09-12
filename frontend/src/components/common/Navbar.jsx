import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/history", label: "History" },
  { to: "/settings", label: "Settings" },
];

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-40 flex items-center justify-between border-b border-border/50 bg-card/60 px-6 py-3 backdrop-blur-md">
      <div className="flex items-center gap-6">
        <span className="font-heading font-semibold text-text-primary">GridSight</span>
        <div className="flex gap-4">
          {LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `text-sm font-medium transition ${
                  isActive ? "text-primary" : "text-text-secondary hover:text-text-primary"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user?.email && <span className="text-sm text-text-secondary">{user.email}</span>}
        <button
          type="button"
          onClick={logout}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-text-primary transition hover:bg-background"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
