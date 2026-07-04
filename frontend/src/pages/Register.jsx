import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api/auth";
import { ForkKnife, Eye, EyeSlash, CheckCircle } from "@phosphor-icons/react";

const BENEFITS = [
  "Browse 100+ menu items from local restaurants",
  "Real-time order tracking",
  "Multiple delivery addresses",
  "Order history & reorder anytime",
];

export default function Register() {
  const [form, setForm] = useState({
    username: "", email: "", password: "", name: "", phone: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/login");
    } catch (err) {
      const data = err.response?.data;
      const msg = typeof data === "object"
        ? Object.entries(data).map(([k, v]) => `${k}: ${[].concat(v).join(", ")}`).join(" | ")
        : "Registration failed. Please try again.";
      setError(msg);
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
          <h2>Join FoodExpress today</h2>
          <p>Create your free account and start ordering from the best local restaurants in minutes.</p>

          <div className="auth-features" style={{ marginTop: "28px" }}>
            {BENEFITS.map((b) => (
              <div key={b} className="auth-feature">
                <div className="auth-feature-icon">
                  <CheckCircle size={16} weight="fill" />
                </div>
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-form-panel" style={{ overflowY: "auto" }}>
        <div className="auth-card">
          <div className="auth-logo">
            <ForkKnife size={20} weight="fill" style={{ color: "var(--primary)" }} />
            FoodExpress
          </div>

          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Get started — it's completely free</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="Your full name" />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input name="username" value={form.username} onChange={handleChange} required placeholder="e.g. john_doe" />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="your@email.com" />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input name="phone" value={form.phone} onChange={handleChange} required placeholder="98XXXXXXXX" />
            </div>

            <div className="form-group" style={{ position: "relative" }}>
              <label>Password</label>
              <input
                type={showPwd ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Minimum 6 characters"
                minLength={6}
                style={{ paddingRight: "44px" }}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                style={{
                  position: "absolute", right: "12px", bottom: "10px",
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--text-muted)", padding: "0", display: "flex",
                }}
              >
                {showPwd ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}
              style={{ marginTop: "8px" }}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
