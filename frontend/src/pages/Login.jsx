import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { addToCart } from "../api/orders";
import { ForkKnife, Eye, EyeSlash, User, Lock, Clock, Truck, ShieldCheck } from "@phosphor-icons/react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(username, password);
      const intent = sessionStorage.getItem("cart_intent");
      if (intent) {
        sessionStorage.removeItem("cart_intent");
        try {
          const { menu_item, quantity } = JSON.parse(intent);
          await addToCart(menu_item, quantity);
          navigate("/cart");
          return;
        } catch {
          navigate(user?.is_admin ? "/" : "/menu");
          return;
        }
      }
      navigate(user?.is_admin ? "/" : "/menu");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid username or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-visual-content">
          <div className="auth-visual-icon">
            <ForkKnife size={36} weight="fill" />
          </div>
          <h2>Order food you love, delivered fast</h2>
          <p>Browse menus from top restaurants in Pokhara and get your meal delivered right to your door.</p>

          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon">
                <Clock size={16} weight="fill" />
              </div>
              <span>Real-time order tracking</span>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">
                <Truck size={16} weight="fill" />
              </div>
              <span>Fast local delivery</span>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">
                <ShieldCheck size={16} weight="fill" />
              </div>
              <span>Secure cash on delivery</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-logo">
            <ForkKnife size={20} weight="fill" style={{ color: "var(--primary)" }} />
            QuickServer1
          </div>

          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your account to continue</p>

          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-input-group">
              <div className="auth-input-icon">
                <User size={18} weight="duotone" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Username"
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="auth-input-group">
              <div className="auth-input-icon">
                <Lock size={18} weight="duotone" />
              </div>
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password"
                autoComplete="current-password"
                style={{ paddingRight: "44px" }}
              />
              <button
                type="button"
                className="auth-pwd-toggle"
                onClick={() => setShowPwd(!showPwd)}
              >
                {showPwd ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="auth-options">
              <label className="auth-checkbox">
                <input type="checkbox" defaultChecked />
                <span className="auth-checkbox-mark" />
                Remember me
              </label>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}
              style={{ marginTop: "6px" }}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account? <Link to="/register">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
