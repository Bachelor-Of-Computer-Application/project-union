import { Link } from "react-router-dom";
import { ForkKnife, Phone, MapPin, Envelope } from "@phosphor-icons/react";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-top">
          <div>
            <div className="footer-brand">
              <ForkKnife size={20} weight="fill" style={{ color: "var(--primary)" }} />
              FoodExpress
            </div>
            <p className="footer-desc">
              Connecting customers with the best local restaurants in Pokhara. Fast, fresh, and delivered to your door.
            </p>
            <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8125rem" }}>
                <MapPin size={14} style={{ color: "var(--primary)", flexShrink: 0 }} />
                <span>Simalchaur, Pokhara, Nepal</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8125rem" }}>
                <Phone size={14} style={{ color: "var(--primary)", flexShrink: 0 }} />
                <span>+977 061-XXXXXX</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8125rem" }}>
                <Envelope size={14} style={{ color: "var(--primary)", flexShrink: 0 }} />
                <span>hello@foodexpress.com.np</span>
              </div>
            </div>
          </div>

          <div className="footer-col">
            <h4>Quick Links</h4>
            <div className="footer-links">
              <Link to="/menu" className="footer-link">Browse Menu</Link>
              <Link to="/orders" className="footer-link">My Orders</Link>
              <Link to="/cart" className="footer-link">Cart</Link>
              <Link to="/register" className="footer-link">Create Account</Link>
            </div>
          </div>

          <div className="footer-col">
            <h4>Support</h4>
            <div className="footer-links">
              <span className="footer-link">Order Tracking</span>
              <span className="footer-link">Help Center</span>
              <span className="footer-link">Privacy Policy</span>
              <span className="footer-link">Terms of Service</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} FoodExpress. All rights reserved.</span>
          <span>Built for LA Grandee International College — BCA Project</span>
        </div>
      </div>
    </footer>
  );
}
