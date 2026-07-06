import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import Footer from "./Footer";

const AUTH_PATHS = new Set(["/login", "/register"]);

export default function Layout() {
  const location = useLocation();
  const { user } = useAuth();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem("sidebar_collapsed", String(next)); } catch {}
      return next;
    });
  };

  // Auth pages get a bare full-screen layout — the page handles its own visuals
  if (AUTH_PATHS.has(location.pathname)) {
    return <Outlet />;
  }

  const isAdmin = !!user?.is_admin;

  return (
    <div className="erp-root">
      <Sidebar collapsed={collapsed} onToggle={toggle} />

      <div className={`erp-main${collapsed ? " collapsed" : ""}`}>
        <TopBar collapsed={collapsed} onToggle={toggle} />

        <main className="erp-content">
          <Outlet />
        </main>

        {/* Footer is shown only for customer-facing pages, not the admin/restaurant panels */}
        {!isAdmin && <Footer />}
      </div>
    </div>
  );
}
