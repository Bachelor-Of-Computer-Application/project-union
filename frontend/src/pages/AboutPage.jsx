import { Link } from "react-router-dom";
import {
  ForkKnife, MapPin, Clock, Phone, Envelope,
  Star, Users, ShoppingCart, SealCheck,
  ArrowRight, Heart, Leaf, Fire,
} from "@phosphor-icons/react";

const HOURS = [
  { day: "Sunday – Thursday", hours: "10:00 AM – 10:00 PM", open: true  },
  { day: "Friday",            hours: "10:00 AM – 11:00 PM", open: true  },
  { day: "Saturday",          hours: "10:00 AM – 11:00 PM", open: true  },
];

const VALUES = [
  { icon: Heart,    title: "Made with Love",       desc: "Every dish is prepared with care, using family recipes perfected over years." },
  { icon: Leaf,     title: "Fresh Every Day",      desc: "We source fresh local ingredients daily — no frozen shortcuts." },
  { icon: Fire,     title: "Bold Flavours",        desc: "Authentic Nepali and fusion recipes that keep customers coming back." },
  { icon: SealCheck,title: "Quality Guaranteed",   desc: "If you're not satisfied, we make it right. Every single time." },
];

const TEAM = [
  { name: "Raj Kumar Shrestha", role: "Head Chef",         initial: "RK", color: "#f25f3a" },
  { name: "Priya Gurung",       role: "Kitchen Manager",   initial: "PG", color: "#3b82f6" },
  { name: "Bikash Thapa",       role: "Delivery Head",     initial: "BT", color: "#10b981" },
  { name: "Sita Adhikari",      role: "Customer Relations",initial: "SA", color: "#f59e0b" },
];

const MILESTONES = [
  { year: "2020", title: "Founded",          desc: "QuickServer1 opened its doors in Simalchaur, Pokhara with a small but passionate team." },
  { year: "2022", title: "500 Customers",    desc: "Crossed 500 loyal customers and expanded our menu to over 30 items." },
  { year: "2023", title: "Online Ordering",  desc: "Launched our digital platform for seamless online ordering and live tracking." },
  { year: "2025", title: "50+ Menu Items",   desc: "Today we serve a full menu of Nepali, fusion, and international dishes." },
];

export default function AboutPage() {
  return (
    <div className="about-page">

      {/* ── HERO ── */}
      <section className="about-hero">
        <div className="about-hero-content">
          <div className="landing-section-tag" style={{ marginBottom: 16 }}>Our Story</div>
          <h1>Bringing Pokhara's<br /><span className="landing-hero-accent">Best Food to You</span></h1>
          <p>
            QuickServer1 started with a simple idea — make it easy for people in Pokhara to enjoy
            freshly prepared, flavourful food without leaving home. Since 2020, we've been doing
            exactly that, one order at a time.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
            <Link to="/menu" className="btn btn-primary btn-lg">
              <ForkKnife size={16} weight="fill" /> Order Now
            </Link>
            <Link to="/contact" className="btn btn-outline btn-lg">
              Contact Us <ArrowRight size={15} weight="bold" />
            </Link>
          </div>
        </div>
        <div className="about-hero-stats">
          {[
            { value: "5+",   label: "Years Serving" },
            { value: "500+", label: "Happy Customers" },
            { value: "50+",  label: "Menu Items" },
            { value: "4.9★", label: "Avg. Rating" },
          ].map((s) => (
            <div key={s.label} className="about-stat-card">
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── VALUES ── */}
      <section className="landing-section">
        <div className="landing-section-header">
          <div className="landing-section-tag">What We Stand For</div>
          <h2>Our Core Values</h2>
          <p>The principles that guide every dish we prepare and every delivery we make.</p>
        </div>
        <div className="landing-features-grid">
          {VALUES.map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.title} className="landing-feature-card">
                <div className="landing-feature-icon">
                  <Icon size={24} weight="duotone" />
                </div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── STORY TIMELINE ── */}
      <section className="landing-section landing-section-alt">
        <div className="landing-section-header">
          <div className="landing-section-tag">Our Journey</div>
          <h2>How We Got Here</h2>
          <p>From a small kitchen to a full online restaurant — here's our story.</p>
        </div>
        <div className="about-timeline">
          {MILESTONES.map((m, i) => (
            <div key={m.year} className={`about-timeline-item ${i % 2 === 0 ? "left" : "right"}`}>
              <div className="about-timeline-year">{m.year}</div>
              <div className="about-timeline-dot" />
              <div className="about-timeline-card">
                <h3>{m.title}</h3>
                <p>{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── OPENING HOURS + LOCATION ── */}
      <section className="landing-section landing-section-alt">
        <div className="about-info-grid">

          {/* Hours */}
          <div className="about-info-card">
            <h2 style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div className="landing-feature-icon" style={{ width: 40, height: 40 }}>
                <Clock size={20} weight="duotone" />
              </div>
              Opening Hours
            </h2>
            <div className="about-hours-list">
              {HOURS.map((h) => (
                <div key={h.day} className="about-hours-row">
                  <span className="about-hours-day">{h.day}</span>
                  <span className="about-hours-time">
                    <span className={`about-hours-dot ${h.open ? "open" : "closed"}`} />
                    {h.hours}
                  </span>
                </div>
              ))}
            </div>
            <div className="about-hours-note">
              <SealCheck size={14} weight="fill" style={{ color: "var(--success)", flexShrink: 0 }} />
              We are open on all public holidays.
            </div>
          </div>

          {/* Location */}
          <div className="about-info-card">
            <h2 style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div className="landing-feature-icon" style={{ width: 40, height: 40 }}>
                <MapPin size={20} weight="duotone" />
              </div>
              Find Us
            </h2>
            <div className="about-contact-list">
              <div className="about-contact-row">
                <MapPin size={15} weight="fill" style={{ color: "var(--p)", flexShrink: 0 }} />
                <span>Simalchaur, Pokhara-16, Kaski, Nepal</span>
              </div>
              <div className="about-contact-row">
                <Phone size={15} weight="fill" style={{ color: "var(--p)", flexShrink: 0 }} />
                <span>+977 061-XXXXXX</span>
              </div>
              <div className="about-contact-row">
                <Envelope size={15} weight="fill" style={{ color: "var(--p)", flexShrink: 0 }} />
                <span>hello@quickserver1.com.np</span>
              </div>
            </div>
            <Link to="/contact" className="btn btn-primary btn-sm" style={{ marginTop: 20 }}>
              <MapPin size={14} /> Get Directions
            </Link>
          </div>

        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-cta" style={{ marginTop: 0 }}>
        <div className="landing-cta-inner">
          <h2>Hungry? We've got you covered.</h2>
          <p>Browse our full menu and place your order in under 2 minutes.</p>
          <Link to="/menu" className="btn btn-xl" style={{ background: "#fff", color: "var(--p-dark)", border: "none", fontWeight: 800 }}>
            <ForkKnife size={18} weight="fill" /> View Full Menu
          </Link>
        </div>
      </section>

    </div>
  );
}
