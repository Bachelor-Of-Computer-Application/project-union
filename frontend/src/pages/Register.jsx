import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api/auth";
import { ForkKnife, Eye, EyeSlash, CheckCircle, User, Envelope, Phone, Lock } from "@phosphor-icons/react";

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
          <h2>Join QuickServer1 today</h2>
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
            QuickServer1
          </div>

          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Get started — it's completely free</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="auth-input-group">
                <div className="auth-input-icon">
                  <User size={18} weight="duotone" />
                </div>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="Full Name" />
              </div>
              <div className="auth-input-group">
                <div className="auth-input-icon">
                  <User size={18} weight="duotone" />
                </div>
                <input name="username" value={form.username} onChange={handleChange} required placeholder="Username" />
              </div>
            </div>

            <div className="auth-input-group">
              <div className="auth-input-icon">
                <Envelope size={18} weight="duotone" />
              </div>
              <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="Email Address" />
            </div>

            <div className="auth-input-group">
              <div className="auth-input-icon">
                <Phone size={18} weight="duotone" />
              </div>
              <input name="phone" value={form.phone} onChange={handleChange} required placeholder="Phone Number" />
            </div>

            <div className="auth-input-group">
              <div className="auth-input-icon">
                <Lock size={18} weight="duotone" />
              </div>
              <input
                type={showPwd ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Password (min 6 chars)"
                minLength={6}
                style={{ paddingRight: "44px" }}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-pwd-toggle"
                onClick={() => setShowPwd(!showPwd)}
              >
                {showPwd ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}
              style={{ marginTop: "10px" }}>
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
