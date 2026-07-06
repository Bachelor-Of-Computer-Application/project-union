import { useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin, Phone, Envelope, Clock, PaperPlaneTilt,
  CheckCircle, WarningCircle, User, ChatText,
  ForkKnife, WhatsappLogo, InstagramLogo, FacebookLogo,
} from "@phosphor-icons/react";

const CONTACT_ITEMS = [
  {
    icon: MapPin,
    title: "Visit Us",
    lines: ["Simalchaur, Pokhara-16", "Kaski, Nepal"],
    action: { label: "Get Directions", href: "https://maps.google.com/?q=Simalchaur+Pokhara+Nepal" },
    color: "var(--p)",
  },
  {
    icon: Phone,
    title: "Call Us",
    lines: ["+977 061-XXXXXX", "+977 98X-XXXXXXX"],
    action: { label: "Call Now", href: "tel:+977061XXXXXX" },
    color: "var(--success)",
  },
  {
    icon: Envelope,
    title: "Email Us",
    lines: ["hello@quickserver1.com.np", "support@quickserver1.com.np"],
    action: { label: "Send Email", href: "mailto:hello@quickserver1.com.np" },
    color: "var(--info)",
  },
  {
    icon: Clock,
    title: "Opening Hours",
    lines: ["Sun – Thu: 10 AM – 10 PM", "Fri – Sat: 10 AM – 11 PM"],
    action: null,
    color: "var(--warning)",
  },
];

export default function ContactPage() {
  const [form, setForm]       = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus]   = useState(null); // "success" | "error" | null
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setLoading(true);

    // Simulate a send (no backend endpoint for contact — just UX feedback)
    setTimeout(() => {
      setStatus("success");
      setForm({ name: "", email: "", subject: "", message: "" });
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="contact-page">

      {/* ── HERO ── */}
      <section className="contact-hero">
        <div className="landing-section-tag" style={{ marginBottom: 14 }}>Get in Touch</div>
        <h1>We'd love to <span className="landing-hero-accent">hear from you</span></h1>
        <p>Have a question, feedback, or special request? Drop us a message and we'll get back to you within a few hours.</p>
      </section>

      {/* ── CONTACT CARDS ── */}
      <section className="contact-cards-grid">
        {CONTACT_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="contact-info-card">
              <div className="contact-info-icon" style={{ "--card-color": item.color }}>
                <Icon size={22} weight="duotone" />
              </div>
              <h3>{item.title}</h3>
              {item.lines.map((l) => <p key={l}>{l}</p>)}
              {item.action && (
                <a
                  href={item.action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: 14, borderColor: item.color, color: item.color }}
                >
                  {item.action.label}
                </a>
              )}
            </div>
          );
        })}
      </section>

      {/* ── MAIN CONTENT: FORM + MAP ── */}
      <div className="contact-main-grid">

        {/* Contact form */}
        <div className="contact-form-card">
          <h2 style={{ marginBottom: 6 }}>Send us a Message</h2>
          <p style={{ color: "var(--txt-m)", fontSize: "0.875rem", marginBottom: 24 }}>
            We usually respond within 2–4 hours during working hours.
          </p>

          {status === "success" && (
            <div className="alert alert-success" style={{ marginBottom: 20 }}>
              <CheckCircle size={16} weight="fill" />
              Message sent! We'll get back to you soon.
            </div>
          )}
          {status === "error" && (
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              <WarningCircle size={16} weight="fill" />
              Something went wrong. Please try again.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>
                  <User size={12} style={{ marginRight: 5, verticalAlign: "middle", color: "var(--p)" }} />
                  Full Name
                </label>
                <input
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Your name"
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  <Envelope size={12} style={{ marginRight: 5, verticalAlign: "middle", color: "var(--p)" }} />
                  Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                <ChatText size={12} style={{ marginRight: 5, verticalAlign: "middle", color: "var(--p)" }} />
                Subject
              </label>
              <select value={form.subject} onChange={set("subject")}>
                <option value="">Select a subject…</option>
                <option value="order">Order Issue</option>
                <option value="feedback">General Feedback</option>
                <option value="catering">Catering / Bulk Order</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Message</label>
              <textarea
                value={form.message}
                onChange={set("message")}
                rows={5}
                placeholder="Tell us how we can help you…"
                required
                style={{ resize: "vertical" }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              disabled={loading}
              style={{ marginTop: 4 }}
            >
              {loading
                ? <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.65s linear infinite" }} /> Sending…</>
                : <><PaperPlaneTilt size={16} weight="fill" /> Send Message</>}
            </button>
          </form>

          {/* Social links */}
          <div className="contact-social">
            <span style={{ fontSize: "0.8125rem", color: "var(--txt-m)", fontWeight: 600 }}>Also find us on</span>
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              {[
                { icon: FacebookLogo,  label: "Facebook",  href: "#", color: "#1877f2" },
                { icon: InstagramLogo, label: "Instagram", href: "#", color: "#e1306c" },
                { icon: WhatsappLogo,  label: "WhatsApp",  href: "#", color: "#25d366" },
              ].map(({ icon: Icon, label, href, color }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-social-btn"
                  style={{ "--social-color": color }}
                  title={label}
                >
                  <Icon size={18} weight="fill" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Map + quick info */}
        <div className="contact-map-col">
          <div className="contact-map-card">
            <h3 style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <MapPin size={16} weight="fill" style={{ color: "var(--p)" }} />
              Our Location
            </h3>
            {/* Google Maps embed — Pokhara, Nepal */}
            <div className="contact-map-embed">
              <iframe
                title="QuickServer1 Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3516.0!2d83.9857!3d28.2096!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3995937bbf0376ff%3A0x6f99573eb9f80ba1!2sPokhara!5e0!3m2!1sen!2snp!4v1700000000000"
                width="100%"
                height="100%"
                style={{ border: 0, borderRadius: "var(--r-sm)" }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <a
              href="https://maps.google.com/?q=Simalchaur+Pokhara+Nepal"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm btn-block"
              style={{ marginTop: 12 }}
            >
              <MapPin size={13} /> Open in Google Maps
            </a>
          </div>

          {/* Quick order nudge */}
          <div className="contact-order-nudge">
            <ForkKnife size={28} weight="duotone" style={{ color: "var(--p)" }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: 4 }}>
                Ready to order?
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--txt-2)", marginBottom: 14 }}>
                Skip the wait — browse our full menu and order online right now.
              </div>
              <Link to="/menu" className="btn btn-primary btn-sm">
                <ForkKnife size={13} weight="fill" /> View Menu
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
