import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

const AUTH_PATHS = new Set(["/login", "/register"]);

export default function Layout() {
  const location = useLocation();

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

  // Auth pages get full-screen layout — the page component handles its own visuals
  if (AUTH_PATHS.has(location.pathname)) {
    return <Outlet />;
  }

  return (
    <div className="erp-root">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <div className={`erp-main${collapsed ? " collapsed" : ""}`}>
        <TopBar collapsed={collapsed} onToggle={toggle} />
        <main className="erp-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
