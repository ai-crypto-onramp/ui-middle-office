import { type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { hasPermission, type Permission, type Role } from "@/types/rbac";
import { classNames } from "@/utils";
import { Button } from "@/components/Button";

type NavItem = { to: string; label: string; perm: Permission; icon: string };

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", perm: "kyc.review", icon: "◆" },
  { to: "/kyc", label: "KYC Review", perm: "kyc.review", icon: "▤" },
  { to: "/alerts", label: "AML / KYT Alerts", perm: "alerts.triage", icon: "⚠" },
  { to: "/policy", label: "Policy / Risk", perm: "policy.manage", icon: "⚖" },
  { to: "/users", label: "User Management", perm: "users.manage", icon: "👤" },
  { to: "/audit", label: "Audit Log", perm: "audit.read", icon: "📜" },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout, switchRole } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const items = NAV_ITEMS.filter((n) => hasPermission(user?.role as Role, n.perm));

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="brand">Middle Office</span>
        <span className="muted small">AI Crypto On-Ramp</span>
        <div className="header-spacer" />
        {user && (
          <select
            className="select"
            style={{ width: "auto", fontSize: "0.8rem" }}
            value={user.role}
            onChange={(e) => switchRole(e.target.value as Role)}
            aria-label="switch role"
            title="Switch role (mock mode)"
          >
            <option value="compliance">compliance</option>
            <option value="support">support</option>
            <option value="ops">ops</option>
            <option value="admin">admin</option>
          </select>
        )}
        <span className="small muted">{user?.email}</span>
        <Button size="sm" onClick={toggle} title="Toggle dark mode">
          {theme === "light" ? "🌙" : "☀"}
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Sign out
        </Button>
      </header>
      <aside className="app-sidebar">
        <nav>
          {items.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) => classNames("nav-link", isActive && "active")}
            >
              <span aria-hidden style={{ width: 16, display: "inline-block" }}>
                {n.icon}
              </span>
              {n.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="app-main">{children}</main>
    </div>
  );
}