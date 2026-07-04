import { Link, useLocation } from "react-router-dom";
import {
  Bell, MagnifyingGlass, List,
  ForkKnife,
} from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";

const BREADCRUMBS = {
  "/":           ["Home", "Dashboard"],
  "/menu":       ["Home", "Browse Menu"],
  "/cart":       ["Home", "Cart"],
  "/checkout":   ["Home", "Checkout"],
  "/orders":     ["Home", "My Orders"],
  "/admin":      ["Home", "Admin Panel"],
  "/restaurant": ["Home", "Restaurant Panel"],
  "/login":      ["Home", "Sign In"],
  "/register":   ["Home", "Register"],
};

export default function TopBar({ collapsed, onToggle }) {
  const { user } = useAuth();
  const location = useLocation();

  const crumbs = BREADCRUMBS[location.pathname]
    ?? ["Home", "Page"];

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "?";

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });

  return (
    <header className="erp-topbar">
      <div className="tb-left">
        {/* Mobile / extra toggle */}
        <button className="tb-icon-btn" onClick={onToggle} title="Toggle sidebar">
          <List size={18} />
        </button>

        {/* Breadcrumb */}
        <nav className="tb-breadcrumb">
          <span>
            <ForkKnife size={12} style={{ color: "var(--p)", marginRight: 4, verticalAlign: "middle" }} />
            {crumbs[0]}
          </span>
          <span className="tb-sep">/</span>
          <span>{crumbs[1]}</span>
        </nav>
      </div>

      {/* Search — shown for all users */}
      <div className="tb-search">
        <MagnifyingGlass size={15} color="var(--txt-m)" />
        <input placeholder="Quick search…" />
      </div>

      <div className="tb-right">
        {/* Date chip */}
        <span className="tb-user-label">{today}</span>

        <div className="tb-divider" />

        {/* Notifications */}
        <button className="tb-icon-btn" title="Notifications">
          <Bell size={17} />
          <span className="tb-notif-dot" />
        </button>

        {/* User avatar */}
        {user ? (
          <Link
            to={user.is_admin ? "/" : "/orders"}
            style={{ textDecoration: "none" }}
            title={user.username}
          >
            <div className="tb-avatar">{initials}</div>
          </Link>
        ) : (
          <Link to="/login" className="btn btn-primary btn-sm">Sign In</Link>
        )}
      </div>
    </header>
  );
}
