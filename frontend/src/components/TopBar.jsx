import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, MagnifyingGlass, List, ForkKnife, X } from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";

const BREADCRUMBS = {
  "/":           ["Home", "Dashboard"],
  "/menu":       ["Home", "Browse Menu"],
  "/about":      ["Home", "About Us"],
  "/contact":    ["Home", "Contact"],
  "/cart":       ["Home", "Cart"],
  "/checkout":   ["Home", "Checkout"],
  "/orders":     ["Home", "My Orders"],
  "/profile":    ["Home", "My Profile"],
  "/admin":      ["Home", "Admin Panel"],
  "/restaurant": ["Home", "Restaurant Panel"],
  "/login":      ["Home", "Sign In"],
  "/register":   ["Home", "Register"],
};

export default function TopBar({ collapsed, onToggle }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const crumbs = BREADCRUMBS[location.pathname] ?? ["Home", "Page"];

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "?";

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });

  const handleSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    navigate(`/menu?search=${encodeURIComponent(q)}`);
    setSearch("");
  };

  const clearSearch = () => setSearch("");

  return (
    <header className="erp-topbar">
      <div className="tb-left">
        {/* Sidebar toggle */}
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

      {/* Functional search — navigates to /menu?search=… */}
      <form className="tb-search" onSubmit={handleSearch} style={{ position: "relative" }}>
        <MagnifyingGlass size={15} color="var(--txt-m)" style={{ flexShrink: 0 }} />
        <input
          placeholder="Search menu…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search menu items"
        />
        {search && (
          <button
            type="button"
            onClick={clearSearch}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--txt-m)", display: "flex", padding: 0, flexShrink: 0,
            }}
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        )}
      </form>

      <div className="tb-right">
        {/* Date chip */}
        <span className="tb-user-label">{today}</span>

        <div className="tb-divider" />

        {/* Notifications (placeholder) */}
        <button className="tb-icon-btn" title="Notifications">
          <Bell size={17} />
          <span className="tb-notif-dot" />
        </button>

        {/* User avatar → links to profile for customers, dashboard for admin */}
        {user ? (
          <Link
            to={user.is_admin ? "/" : "/profile"}
            style={{ textDecoration: "none" }}
            title={user.is_admin ? "Dashboard" : "My Profile"}
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
