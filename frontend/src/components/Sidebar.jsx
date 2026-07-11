import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ForkKnife, House, ClipboardText, Package,
  ShoppingCart, Users, ChartBar, Phone,
  SignOut, CaretDoubleLeft, CaretDoubleRight,
  SignIn, UserPlus, Fire, UserCircle,
} from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";
import { getCart } from "../api/orders";

const ADMIN_NAV = [
  {
    section: "Overview",
    items: [
      { label: "Dashboard",        icon: House,         path: "/" },
      { label: "Admin Panel",      icon: ChartBar,      path: "/admin" },
    ],
  },
  {
    section: "Operations",
    items: [
      { label: "Live Orders",      icon: ClipboardText, path: "/admin?tab=orders",    basePath: "/admin" },
      { label: "Menu Management",  icon: ForkKnife,     path: "/admin?tab=menu",      basePath: "/admin" },
    ],
  },
  {
    section: "Management",
    items: [
      { label: "Restaurant Panel", icon: Fire,          path: "/restaurant" },
      { label: "Customers",        icon: Users,         path: "/admin?tab=users", basePath: "/admin" },
    ],
  },
];

const CUSTOMER_NAV = [
  {
    section: "Discover",
    items: [
      { label: "Home",         icon: House,         path: "/" },
      { label: "Browse Menu",  icon: ForkKnife,     path: "/menu" },
      { label: "About Us",     icon: Users,         path: "/about" },
      { label: "Contact",      icon: Phone,         path: "/contact" },
    ],
  },
  {
    section: "My Account",
    items: [
      { label: "Cart",         icon: ShoppingCart,  path: "/cart" },
      { label: "My Orders",    icon: ClipboardText, path: "/orders" },
      { label: "My Profile",   icon: UserCircle,    path: "/profile" },
    ],
  },
];

const GUEST_NAV = [
  {
    section: "Discover",
    items: [
      { label: "Browse Menu",  icon: ForkKnife,  path: "/menu" },
    ],
  },
  {
    section: "Account",
    items: [
      { label: "Sign In",      icon: SignIn,     path: "/login" },
      { label: "Get Started",  icon: UserPlus,   path: "/register" },
    ],
  },
];

function itemIsActive(item, location) {
  const [path, qs] = item.path.split("?");
  if (qs) {
    return location.pathname + location.search === item.path;
  }
  if (path === "/") return location.pathname === "/" && !location.search;
  return location.pathname === path && !location.search;
}

export default function Sidebar({ collapsed, onToggle }) {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || user?.is_admin) return;
    getCart()
      .then((res) => {
        const count = res.data?.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
        setCartCount(count);
      })
      .catch(() => {});
  }, [isAuthenticated, user, location.pathname]);

  const nav = user?.is_admin
    ? ADMIN_NAV
    : isAuthenticated
    ? CUSTOMER_NAV
    : GUEST_NAV;

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "?";

  const handleLogout = () => {
    logout();
    navigate("/menu");
  };

  return (
    <aside className={`erp-sidebar${collapsed ? " collapsed" : ""}`}>
      {/* Logo strip */}
      <div className="sb-logo">
        <Link to={isAuthenticated ? (user?.is_admin ? "/" : "/menu") : "/menu"} className="sb-brand">
          <ForkKnife size={22} weight="fill" className="sb-brand-icon" />
          <span className="sb-brand-text">QuickServer1</span>
        </Link>
        <button className="sb-toggle" onClick={onToggle} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed
            ? <CaretDoubleRight size={13} weight="bold" />
            : <CaretDoubleLeft size={13} weight="bold" />
          }
        </button>
      </div>

      {/* Scrollable nav */}
      <div className="sb-scroll">
        {nav.map(({ section, items }) => (
          <div key={section}>
            <div className="sb-section">{section}</div>
            {items.map((item) => {
                  const Icon = item.icon;
                  const active = itemIsActive(item, location);
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      className={`sb-item${active ? " active" : ""}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon size={18} weight={active ? "fill" : "regular"} className="sb-icon" />
                      <span className="sb-label">{item.label}</span>
                      {item.path === "/cart" && cartCount > 0 && (
                        <span className="sb-cart-count">{cartCount}</span>
                      )}
                    </Link>
              );
            })}
          </div>
        ))}
      </div>

      <div className="sb-divider" />

      {/* User footer */}
      <div className="sb-footer">
        {isAuthenticated && (
          <div className="sb-user" title={collapsed ? user?.username : undefined}>
            <div className="sb-avatar">{initials}</div>
            <div className="sb-user-info">
              <div className="sb-user-name">{user?.username}</div>
              <div className="sb-user-role">
                {user?.is_admin ? "Administrator" : "Customer"}
              </div>
            </div>
          </div>
        )}

        {isAuthenticated ? (
          <button
            className="sb-item"
            onClick={handleLogout}
            title={collapsed ? "Sign Out" : undefined}
            style={{ color: "var(--danger)" }}
          >
            <SignOut
              size={18}
              className="sb-icon"
              style={{ color: "var(--danger)" }}
            />
            <span className="sb-label">Sign Out</span>
          </button>
        ) : (
          <Link
            to="/login"
            className={`sb-item${location.pathname === "/login" ? " active" : ""}`}
          >
            <SignIn size={18} className="sb-icon" />
            <span className="sb-label">Sign In</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
