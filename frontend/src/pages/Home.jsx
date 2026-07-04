import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { getDashboard } from "../api/orders";
import { useAuth } from "../context/AuthContext";
import {
  Users, ClipboardText, CurrencyDollar, ChartBar,
  ShoppingCart, ForkKnife, Package, TrendUp,
  ArrowRight, CheckCircle, Clock, Truck,
} from "@phosphor-icons/react";

const STATUS_CHART = {
  "Order Placed":      { color: "var(--warning)",  label: "Placed" },
  Preparing:           { color: "var(--info)",      label: "Preparing" },
  "Out for Delivery":  { color: "var(--primary)",   label: "Delivering" },
  Delivered:           { color: "var(--success)",   label: "Delivered" },
};

const STATUS_BADGE = {
  "Order Placed":     "badge-warning",
  Preparing:          "badge-info",
  "Out for Delivery": "badge-primary",
  Delivered:          "badge-success",
  Cancelled:          "badge-danger",
};

function MiniLineChart({ data, color = "var(--primary)" }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 200, h = 60, pad = 4;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - (v / max) * (h - pad * 2);
    return `${x},${y}`;
  });
  const polyline = pts.join(" ");
  const area = `${pad},${h - pad} ${polyline} ${w - pad},${h - pad}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "60px" }}>
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#grad)" />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Home() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user?.is_admin) { setLoading(false); return; }
    getDashboard()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated, user]);

  if (authLoading) return <div className="page-loader"><div className="loader-spinner" /></div>;
  if (!isAuthenticated || !user?.is_admin) return <Navigate to="/menu" replace />;
  if (loading) return <div className="page-loader"><div className="loader-spinner" />Loading dashboard...</div>;

  const statuses = [
    { label: "Order Placed",      count: data?.pending_orders || 0 },
    { label: "Preparing",         count: data?.preparing_orders || 0 },
    { label: "Out for Delivery",  count: data?.out_for_delivery || 0 },
    { label: "Delivered",         count: data?.delivered_orders || 0 },
  ];
  const maxCount = Math.max(...statuses.map((s) => s.count), 1);
  const totalOrders = data?.total_orders || 0;
  const deliveredPct = totalOrders
    ? Math.round(((data?.delivered_orders || 0) / totalOrders) * 100) : 0;

  const mockRevenueTrend = [1200, 1850, 1400, 2200, 1900, 2600, 2400, 3100, 2800, 3400, 3200, 3800];

  const kpiCards = [
    {
      label: "Total Revenue",
      value: `Rs ${(data?.total_revenue || 0).toLocaleString()}`,
      icon: CurrencyDollar, iconClass: "success",
      trend: "+12%", up: true,
    },
    {
      label: "Total Orders",
      value: totalOrders,
      icon: ClipboardText, iconClass: "",
      trend: `${data?.pending_orders || 0} pending`, up: null,
    },
    {
      label: "Customers",
      value: data?.total_customers || 0,
      icon: Users, iconClass: "info",
      trend: "+5 this week", up: true,
    },
    {
      label: "Low Stock Items",
      value: data?.low_stock_items || 0,
      icon: Package, iconClass: "danger",
      trend: "Needs attention", up: false,
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Good morning, {user?.username} </h1>
          <p>Here's what's happening with your restaurant today.</p>
        </div>
        <div className="dashboard-header-actions">
          <Link to="/admin?tab=orders" className="btn btn-outline btn-sm">
            <ShoppingCart size={15} /> Orders
          </Link>
          <Link to="/restaurant" className="btn btn-primary btn-sm">
            <ForkKnife size={15} /> Restaurant Panel
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
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
                <div className={`stat-icon-wrap ${card.iconClass}`}>
                  <Icon size={22} weight="duotone" />
                </div>
              </div>
              {card.up !== null && (
                <div className={`stat-trend ${card.up ? "up" : "down"}`}>
                  <TrendUp size={13} weight="bold" style={{ transform: card.up ? "" : "scaleY(-1)" }} />
                  {card.trend}
                </div>
              )}
              {card.up === null && (
                <div className="stat-trend" style={{ color: "var(--text-muted)" }}>{card.trend}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="dashboard-charts">
        {/* Revenue Trend */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3><ChartBar size={16} weight="duotone" /> Revenue Trend</h3>
              <div className="chart-subtitle">Last 12 months</div>
            </div>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 800, color: "var(--success)" }}>
              Rs {(data?.total_revenue || 0).toLocaleString()}
            </span>
          </div>
          <MiniLineChart data={mockRevenueTrend} color="var(--success)" />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "6px" }}>
            <span>Jan</span><span>Apr</span><span>Jul</span><span>Oct</span><span>Dec</span>
          </div>
        </div>

        {/* Order Status */}
        <div className="chart-card">
          <h3><ClipboardText size={16} weight="duotone" /> Order Status</h3>
          <div className="bar-chart" style={{ marginTop: "16px" }}>
            {statuses.map((s) => (
              <div key={s.label} className="bar-row">
                <span className="bar-label">{STATUS_CHART[s.label]?.label || s.label}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${(s.count / maxCount) * 100}%`,
                      background: STATUS_CHART[s.label]?.color || "var(--primary)",
                    }}
                  />
                </div>
                <span className="bar-value">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Rate + Quick Actions */}
        <div className="chart-card">
          <h3>Delivery Rate</h3>
          <div className="donut-container" style={{ marginTop: "16px" }}>
            <div className="donut">
              <svg viewBox="0 0 36 36" className="donut-svg">
                <path className="donut-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="donut-fill" strokeDasharray={`${deliveredPct}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="donut-text">
                <span className="donut-pct">{deliveredPct}%</span>
                <span className="donut-label">Success</span>
              </div>
            </div>
            <div className="donut-legend">
              <div className="legend-item">
                <span className="legend-dot" style={{ background: "var(--success)" }} />
                <span>Delivered ({data?.delivered_orders || 0})</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: "var(--warning)" }} />
                <span>Pending ({totalOrders - (data?.delivered_orders || 0)})</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: "20px" }}>
            <div className="quick-actions">
              <Link to="/admin?tab=menu" className="quick-action-btn"><ForkKnife size={18} /><span>Menu</span></Link>
              <Link to="/admin?tab=orders" className="quick-action-btn"><ShoppingCart size={18} /><span>Orders</span></Link>
              <Link to="/admin?tab=inventory" className="quick-action-btn"><Package size={18} /><span>Inventory</span></Link>
              <Link to="/restaurant" className="quick-action-btn"><Clock size={18} /><span>Kitchen</span></Link>
            </div>
          </div>
        </div>
      </div>

      {/* Status Pills Row */}
      <div className="stats-row">
        {[
          { label: "Pending",     value: data?.pending_orders,    badge: "badge-warning" },
          { label: "Preparing",   value: data?.preparing_orders,  badge: "badge-info" },
          { label: "Delivering",  value: data?.out_for_delivery,  badge: "badge-primary" },
          { label: "Delivered",   value: data?.delivered_orders,  badge: "badge-success" },
          { label: "Low Stock",   value: data?.low_stock_items,   badge: "badge-danger" },
        ].map((item) => (
          <div key={item.label} className="stat-card-sm">
            <span className={`badge ${item.badge}`}>{item.value ?? 0}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Recent Orders Table */}
      {data?.recent_orders?.length > 0 && (
        <div className="section">
          <div className="section-header">
            <h2>Recent Orders</h2>
            <Link to="/admin" className="btn btn-sm btn-outline">
              View All <ArrowRight size={13} weight="bold" />
            </Link>
          </div>
          <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_orders.map((order) => (
                  <tr key={order.id}>
                    <td><strong>#{order.id}</strong></td>
                    <td>{order.customer_name}</td>
                    <td style={{ fontWeight: 600, color: "var(--text)" }}>Rs {order.total_amount}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[order.status] || "badge-secondary"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>
                      {new Date(order.order_date).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
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
