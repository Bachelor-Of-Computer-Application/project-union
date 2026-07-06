import { Link } from "react-router-dom";
import {
  ForkKnife, Phone, MapPin, Envelope,
  FacebookLogo, InstagramLogo, WhatsappLogo,
} from "@phosphor-icons/react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-top">

          {/* Brand + contact */}
          <div>
            <div className="footer-brand">
              <ForkKnife size={20} weight="fill" style={{ color: "var(--p)" }} />
              QuickServer1
            </div>
            <p className="footer-desc">
              Freshly prepared food delivered hot and fast to your door in Pokhara.
              Order online and track every step — kitchen to doorstep.
            </p>
            <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8125rem", color: "var(--txt-2)" }}>
                <MapPin size={14} style={{ color: "var(--p)", flexShrink: 0 }} />
                Simalchaur, Pokhara-16, Nepal
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8125rem", color: "var(--txt-2)" }}>
                <Phone size={14} style={{ color: "var(--p)", flexShrink: 0 }} />
                +977 061-XXXXXX
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8125rem", color: "var(--txt-2)" }}>
                <Envelope size={14} style={{ color: "var(--p)", flexShrink: 0 }} />
                hello@quickserver1.com.np
              </div>
            </div>
            {/* Social icons */}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              {[
                { icon: FacebookLogo,  href: "#", color: "#1877f2", label: "Facebook"  },
                { icon: InstagramLogo, href: "#", color: "#e1306c", label: "Instagram" },
                { icon: WhatsappLogo,  href: "#", color: "#25d366", label: "WhatsApp"  },
              ].map(({ icon: Icon, href, color, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  style={{
                    width: 34, height: 34, borderRadius: "var(--r-sm)",
                    background: "var(--s2)", border: "1.5px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: color, transition: "var(--tf)", textDecoration: "none",
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = color; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = color; }}
                  onMouseOut={(e)  => { e.currentTarget.style.background = "var(--s2)"; e.currentTarget.style.color = color; e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  <Icon size={16} weight="fill" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4>Quick Links</h4>
            <div className="footer-links">
              <Link to="/"        className="footer-link">Home</Link>
              <Link to="/menu"    className="footer-link">Browse Menu</Link>
              <Link to="/about"   className="footer-link">About Us</Link>
              <Link to="/contact" className="footer-link">Contact</Link>
              <Link to="/orders"  className="footer-link">My Orders</Link>
              <Link to="/cart"    className="footer-link">Cart</Link>
            </div>
          </div>

          {/* Support */}
          <div className="footer-col">
            <h4>Support</h4>
            <div className="footer-links">
              <Link to="/contact"  className="footer-link">Help Center</Link>
              <Link to="/contact"  className="footer-link">Order Support</Link>
              <Link to="/about"    className="footer-link">About QuickServer1</Link>
              <span className="footer-link">Privacy Policy</span>
              <span className="footer-link">Terms of Service</span>
            </div>
            <div style={{ marginTop: 20, padding: "14px", background: "var(--p-light)", borderRadius: "var(--r-sm)", border: "1.5px solid var(--p-mid)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--p-dark)", marginBottom: 4 }}>
                Opening Hours
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--txt-2)", lineHeight: 1.6 }}>
                Sun – Thu: 10 AM – 10 PM<br />
                Fri – Sat: 10 AM – 11 PM
              </div>
            </div>
          </div>

        </div>

        <div className="footer-bottom">
          <span>&copy; {year} QuickServer1. All rights reserved.</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            Built for LA Grandee International College — BCA Project
          </span>
        </div>
      </div>
    </footer>
  );
}
