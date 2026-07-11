import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { getDashboard } from "../api/orders";
import { getMenuCategories } from "../api/menu";
import { useAuth } from "../context/AuthContext";
import {
  Users, ClipboardText, CurrencyDollar, ChartBar,
  ShoppingCart, ForkKnife, TrendUp,
  ArrowRight, CheckCircle, Clock, Truck, Star,
  Flame, SealCheck, Timer, MapPin,
} from "@phosphor-icons/react";

/* ── tiny sparkline used in admin KPI cards ── */
function MiniLineChart({ data, color = "var(--p)" }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 200, h = 60, pad = 4;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - (v / max) * (h - pad * 2);
    return `${x},${y}`;
  });
  const area = `${pad},${h - pad} ${pts.join(" ")} ${w - pad},${h - pad}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 60 }}>
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#grad)" />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const STATUS_CHART = {
  "Order Placed":     { color: "var(--warning)",  label: "Placed" },
  Preparing:          { color: "var(--info)",      label: "Preparing" },
  Ready:              { color: "#8b5cf6",          label: "Ready" },
  "Out for Delivery": { color: "var(--p)",         label: "Delivering" },
  Delivered:          { color: "var(--success)",   label: "Delivered" },
};
const STATUS_BADGE = {
  "Order Placed":     "badge-warning",
  Preparing:          "badge-info",
  Ready:              "badge-secondary",
  "Out for Delivery": "badge-primary",
  Delivered:          "badge-success",
  Cancelled:          "badge-danger",
};

/* ══════════════════════════════════════════════════════
   ADMIN DASHBOARD  (unchanged layout)
══════════════════════════════════════════════════════ */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

function AdminHome({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader"><div className="loader-spinner" />Loading dashboard…</div>;

  const statuses = [
    { label: "Order Placed",     count: data?.pending_orders   || 0 },
    { label: "Preparing",        count: data?.preparing_orders || 0 },
    { label: "Out for Delivery", count: data?.out_for_delivery || 0 },
    { label: "Delivered",        count: data?.delivered_orders || 0 },
  ];
  const maxCount   = Math.max(...statuses.map((s) => s.count), 1);
  const totalOrders = data?.total_orders || 0;
  const deliveredPct = totalOrders
    ? Math.round(((data?.delivered_orders || 0) / totalOrders) * 100) : 0;

  const kpiCards = [
    { label: "Total Revenue",  value: `Rs ${(data?.total_revenue || 0).toLocaleString()}`, icon: CurrencyDollar, iconClass: "success", trend: "+12%",                         up: true  },
    { label: "Total Orders",   value: totalOrders,                                          icon: ClipboardText,  iconClass: "",        trend: `${data?.pending_orders||0} pending`, up: null  },
    { label: "Customers",      value: data?.total_customers || 0,                           icon: Users,          iconClass: "info",    trend: "+5 this week",               up: true  },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>{getGreeting()}, {user?.username} 👋</h1>
          <p>Here's what's happening with your restaurant today.</p>
        </div>
        <div className="dashboard-header-actions">
          <Link to="/admin?tab=orders" className="btn btn-outline btn-sm"><ShoppingCart size={15} /> Orders</Link>
          <Link to="/restaurant"       className="btn btn-primary btn-sm"><ForkKnife size={15} /> Restaurant Panel</Link>
        </div>
      </div>

      {/* KPI */}
      <div className="stats-grid">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div className="stat-card" key={card.label}>
              <div className="stat-card-header">
                <div>
                  <div className="stat-label">{card.label}</div>
                  <div className="stat-value">{card.value}</div>
                </div>
                <div className={`stat-icon-wrap ${card.iconClass}`}><Icon size={22} weight="duotone" /></div>
              </div>
              {card.up !== null && (
                <div className={`stat-trend ${card.up ? "up" : "down"}`}>
                  <TrendUp size={13} weight="bold" style={{ transform: card.up ? "" : "scaleY(-1)" }} />
                  {card.trend}
                </div>
              )}
              {card.up === null && (
                <div className="stat-trend" style={{ color: "var(--txt-m)" }}>{card.trend}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="dashboard-charts">
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3><ChartBar size={16} weight="duotone" /> Revenue Trend</h3>
              <div className="chart-subtitle">Last 12 months</div>
            </div>
            <span style={{ fontFamily: "var(--fh)", fontSize: "1.25rem", fontWeight: 800, color: "var(--success)" }}>
              Rs {(data?.total_revenue || 0).toLocaleString()}
            </span>
          </div>
          <MiniLineChart data={data?.revenue_trend || []} color="var(--success)" />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6875rem", color: "var(--txt-m)", marginTop: 6 }}>
            <span>Jan</span><span>Apr</span><span>Jul</span><span>Oct</span><span>Dec</span>
          </div>
        </div>

        <div className="chart-card">
          <h3><ClipboardText size={16} weight="duotone" /> Order Status</h3>
          <div className="bar-chart" style={{ marginTop: 16 }}>
            {statuses.map((s) => (
              <div key={s.label} className="bar-row">
                <span className="bar-label">{STATUS_CHART[s.label]?.label || s.label}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(s.count / maxCount) * 100}%`, background: STATUS_CHART[s.label]?.color || "var(--p)" }} />
                </div>
                <span className="bar-value">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <h3>Delivery Rate</h3>
          <div className="donut-container" style={{ marginTop: 16 }}>
            <div className="donut">
              <svg viewBox="0 0 36 36" className="donut-svg">
                <path className="donut-bg"   d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="donut-fill" strokeDasharray={`${deliveredPct}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="donut-text">
                <span className="donut-pct">{deliveredPct}%</span>
                <span className="donut-label">Success</span>
              </div>
            </div>
            <div className="donut-legend">
              <div className="legend-item"><span className="legend-dot" style={{ background: "var(--success)" }} /><span>Delivered ({data?.delivered_orders || 0})</span></div>
              <div className="legend-item"><span className="legend-dot" style={{ background: "var(--warning)" }} /><span>Pending ({totalOrders - (data?.delivered_orders || 0)})</span></div>
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <div className="quick-actions">
              <Link to="/admin?tab=menu"      className="quick-action-btn"><ForkKnife size={18} /><span>Menu</span></Link>
              <Link to="/admin?tab=orders"    className="quick-action-btn"><ShoppingCart size={18} /><span>Orders</span></Link>
              <Link to="/restaurant"          className="quick-action-btn"><Clock size={18} /><span>Kitchen</span></Link>
            </div>
          </div>
        </div>
      </div>

      {/* Status pills */}
      <div className="stats-row">
        {[
          { label: "Pending",    value: data?.pending_orders,   badge: "badge-warning"  },
          { label: "Preparing",  value: data?.preparing_orders, badge: "badge-info"     },
          { label: "Delivering", value: data?.out_for_delivery, badge: "badge-primary"  },
          { label: "Delivered",  value: data?.delivered_orders, badge: "badge-success"  },
        ].map((item) => (
          <div key={item.label} className="stat-card-sm">
            <span className={`badge ${item.badge}`}>{item.value ?? 0}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Recent orders table */}
      {data?.recent_orders?.length > 0 && (
        <div className="section">
          <div className="section-header">
            <h2>Recent Orders</h2>
            <Link to="/admin" className="btn btn-sm btn-outline">View All <ArrowRight size={13} weight="bold" /></Link>
          </div>
          <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden", boxShadow: "var(--sh-sm)" }}>
            <table className="table">
              <thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {data.recent_orders.map((order) => (
                  <tr key={order.id}>
                    <td><strong>#{order.id}</strong></td>
                    <td>{order.customer_name}</td>
                    <td style={{ fontWeight: 600, color: "var(--txt)" }}>Rs {order.total_amount}</td>
                    <td><span className={`badge ${STATUS_BADGE[order.status] || "badge-secondary"}`}>{order.status}</span></td>
                    <td style={{ color: "var(--txt-m)" }}>
                      {new Date(order.order_date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   CUSTOMER / GUEST LANDING PAGE
══════════════════════════════════════════════════════ */
function CustomerHome({ user }) {
  const [categories, setCategories]   = useState([]);
  const [featuredItems, setFeatured]  = useState([]);
  const [loading, setLoading]         = useState(true);
  const isLoggedIn = !!user;

  useEffect(() => {
    getMenuCategories()
      .then((r) => {
        const cats = r.data || [];
        setCategories(cats);
        // Collect up to 8 featured items (first 2 per category)
        const items = cats.flatMap((c) => (c.items || []).slice(0, 2)).slice(0, 8);
        setFeatured(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const FEATURES = [
    { icon: Timer,     title: "Fast Delivery",      desc: "Your order delivered hot in 25–35 minutes, straight to your door." },
    { icon: SealCheck, title: "Fresh Ingredients",  desc: "Every dish is prepared fresh daily with quality local ingredients." },
    { icon: Star,      title: "Top Rated",           desc: "Hundreds of happy customers trust QuickServer1 every day." },
    { icon: Truck,     title: "Live Tracking",       desc: "Follow your order in real-time from kitchen to your doorstep." },
  ];

  const HOW_IT_WORKS = [
    { step: "01", title: "Browse the Menu",  desc: "Explore our full menu. Filter by category, search by name — find exactly what you're craving.", icon: ForkKnife },
    { step: "02", title: "Add to Cart",      desc: "Pick your favourite items, adjust quantities, and review your order before placing it.",          icon: ShoppingCart },
    { step: "03", title: "Track Your Order", desc: "Place your order and watch it move through our kitchen all the way to your door.",                icon: Truck },
  ];

  return (
    <div className="landing-page">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <div className="landing-hero-badge">
            <Flame size={14} weight="fill" style={{ color: "var(--p)" }} />
            Now Open · Pokhara, Nepal
          </div>
          <h1 className="landing-hero-title">
            Delicious Food,<br />
            <span className="landing-hero-accent">Delivered Fast</span>
          </h1>
          <p className="landing-hero-sub">
            Order from QuickServer1's full menu and get hot, freshly prepared food delivered right to your door in under 35 minutes.
          </p>
          <div className="landing-hero-actions">
            <Link to="/menu" className="btn btn-primary btn-xl">
              <ForkKnife size={18} weight="fill" /> Order Now
            </Link>
            {!isLoggedIn && (
              <Link to="/register" className="btn btn-outline btn-xl">
                Create Account <ArrowRight size={16} weight="bold" />
              </Link>
            )}
          </div>
          <div className="landing-hero-trust">
            <div className="landing-trust-item"><CheckCircle size={15} weight="fill" style={{ color: "var(--success)" }} /> Free delivery on first order</div>
            <div className="landing-trust-item"><CheckCircle size={15} weight="fill" style={{ color: "var(--success)" }} /> Fresh ingredients daily</div>
            <div className="landing-trust-item"><CheckCircle size={15} weight="fill" style={{ color: "var(--success)" }} /> Live order tracking</div>
          </div>
        </div>
        <div className="landing-hero-visual">
          <div className="landing-hero-graphic">
            <div className="hero-graphic-circle hero-circle-1" />
            <div className="hero-graphic-circle hero-circle-2" />
            <div className="hero-graphic-icon">
              <ForkKnife size={72} weight="duotone" style={{ color: "#fff" }} />
            </div>
            {/* floating cards */}
            <div className="hero-float-card hero-float-1">
              <CheckCircle size={16} weight="fill" style={{ color: "var(--success)" }} />
              <span>Order Delivered!</span>
            </div>
            <div className="hero-float-card hero-float-2">
              <Star size={14} weight="fill" style={{ color: "#f59e0b" }} />
              <span>4.9 Rating</span>
            </div>
            <div className="hero-float-card hero-float-3">
              <Clock size={14} weight="fill" style={{ color: "var(--p)" }} />
              <span>~30 min</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────── */}
      <section className="landing-stats-strip">
        {[
          { value: "500+",  label: "Happy Customers" },
          { value: "50+",   label: "Menu Items" },
          { value: "4.9★",  label: "Average Rating" },
          { value: "30 min",label: "Avg. Delivery" },
        ].map((s) => (
          <div key={s.label} className="landing-stat">
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section className="landing-section">
        <div className="landing-section-header">
          <div className="landing-section-tag">Why Choose Us</div>
          <h2>Food you love, service you trust</h2>
          <p>Everything we do is built around getting great food to you as fast and fresh as possible.</p>
        </div>
        <div className="landing-features-grid">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="landing-feature-card">
                <div className="landing-feature-icon">
                  <Icon size={24} weight="duotone" />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FEATURED MENU ────────────────────────────────────── */}
      {!loading && featuredItems.length > 0 && (
        <section className="landing-section landing-section-alt">
          <div className="landing-section-header">
            <div className="landing-section-tag">Our Menu</div>
            <h2>Today's Popular Picks</h2>
            <p>Hand-picked favourites our customers order again and again.</p>
          </div>
          <div className="landing-menu-grid">
            {featuredItems.map((item) => (
              <div key={item.id} className="landing-menu-card">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="landing-menu-img" />
                ) : (
                  <div className="landing-menu-img-placeholder">
                    <ForkKnife size={32} weight="duotone" style={{ color: "var(--p)" }} />
                  </div>
                )}
                <div className="landing-menu-body">
                  <h3>{item.name}</h3>
                  {item.description && <p>{item.description}</p>}
                  <div className="landing-menu-footer">
                    <span className="landing-menu-price">Rs {item.price}</span>
                    <Link to="/menu" className="btn btn-primary btn-sm">Order</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <Link to="/menu" className="btn btn-outline btn-lg">
              View Full Menu <ArrowRight size={16} weight="bold" />
            </Link>
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="landing-section">
        <div className="landing-section-header">
          <div className="landing-section-tag">How It Works</div>
          <h2>Order in 3 simple steps</h2>
          <p>From browsing to your doorstep — it only takes a few minutes.</p>
        </div>
        <div className="landing-steps">
          {HOW_IT_WORKS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.step} className="landing-step">
                <div className="landing-step-num">{step.step}</div>
                <div className="landing-step-icon-wrap">
                  <Icon size={28} weight="duotone" />
                </div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                {i < HOW_IT_WORKS.length - 1 && <div className="landing-step-arrow"><ArrowRight size={20} weight="bold" /></div>}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────────── */}
      {!loading && categories.length > 0 && (
        <section className="landing-section landing-section-alt">
          <div className="landing-section-header">
            <div className="landing-section-tag">Categories</div>
            <h2>Browse by Category</h2>
            <p>Find exactly what you're in the mood for.</p>
          </div>
          <div className="landing-cats-grid">
            {categories.map((cat) => (
              <Link key={cat.id} to={`/menu?category=${cat.id}`} className="landing-cat-card">
                <div className="landing-cat-icon"><ForkKnife size={26} weight="duotone" /></div>
                <div className="landing-cat-name">{cat.name}</div>
                <div className="landing-cat-count">{cat.items?.length || 0} items</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA BANNER ───────────────────────────────────────── */}
      <section className="landing-cta">
        <div className="landing-cta-inner">
          <h2>Ready to order?</h2>
          <p>Fresh food, fast delivery, and live tracking — all in one place.</p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/menu" className="btn btn-xl" style={{ background: "#fff", color: "var(--p-dark)", border: "none", fontWeight: 800 }}>
              <ForkKnife size={18} weight="fill" /> Browse Menu
            </Link>
            {!isLoggedIn && (
              <Link to="/register" className="btn btn-xl btn-outline" style={{ borderColor: "rgba(255,255,255,0.5)", color: "#fff" }}>
                Sign Up Free <ArrowRight size={16} weight="bold" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── LOCATION TEASER ──────────────────────────────────── */}
      <section className="landing-section" style={{ paddingBottom: 0 }}>
        <div className="landing-location-bar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <MapPin size={22} weight="fill" style={{ color: "var(--p)", flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--txt)" }}>Simalchaur, Pokhara</div>
              <div style={{ fontSize: "0.8125rem", color: "var(--txt-m)" }}>Open daily · 10:00 AM – 10:00 PM</div>
            </div>
          </div>
          <Link to="/contact" className="btn btn-outline btn-sm">Get Directions</Link>
        </div>
      </section>

    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ROOT — route to the right view
══════════════════════════════════════════════════════ */
export default function Home() {
  const { user, loading: authLoading } = useAuth();
  if (authLoading) return <div className="page-loader"><div className="loader-spinner" /></div>;
  if (user?.is_admin) return <AdminHome user={user} />;
  return <CustomerHome user={user} />;
}
