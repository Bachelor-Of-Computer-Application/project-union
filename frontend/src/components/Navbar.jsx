import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ForkKnife, ShoppingCart, ClipboardText, List, SignOut } from "@phosphor-icons/react";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path ? "nav-link active" : "nav-link";

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to={isAuthenticated && user?.is_admin ? "/" : "/menu"} className="navbar-brand">
          <ForkKnife className="brand-icon" size={22} weight="fill" />
          QuickServer1
        </Link>

        <div className="navbar-links">
          {!isAuthenticated ? (
            <>
              <Link to="/menu" className={isActive("/menu")}>Menu</Link>
              <div className="nav-divider" />
              <Link to="/login" className="btn btn-outline btn-sm">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          ) : user?.is_admin ? (
            <>
              <Link to="/" className={isActive("/")}>Dashboard</Link>
              <Link to="/admin" className={isActive("/admin")}>
                <List size={15} /> Admin Panel
              </Link>
              <Link to="/restaurant" className={isActive("/restaurant")}>
                <ForkKnife size={15} /> Restaurant
              </Link>
              <div className="nav-divider" />
              <div className="nav-user">
                <div className="user-avatar">
                  {user?.username?.slice(0, 2)?.toUpperCase()}
                </div>
                <button onClick={handleLogout} className="btn btn-outline btn-sm">
                  <SignOut size={14} /> Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/menu" className={isActive("/menu")}>Menu</Link>
              <Link to="/orders" className={isActive("/orders")}>
                <ClipboardText size={15} /> Orders
              </Link>
              <Link to="/cart" className="nav-cart-btn">
                <ShoppingCart size={18} weight="bold" />
                Cart
              </Link>
              <div className="nav-divider" />
              <div className="nav-user">
                <div className="user-avatar" title={user?.username}>
                  {user?.username?.slice(0, 2)?.toUpperCase()}
                </div>
                <span className="nav-username">{user?.username}</span>
                <button onClick={handleLogout} className="btn btn-outline btn-sm">
                  <SignOut size={14} /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
