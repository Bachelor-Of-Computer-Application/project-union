import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getOrders } from "../api/orders";
import { ClipboardText, ArrowRight, ForkKnife, Clock, CurrencyDollar } from "@phosphor-icons/react";

const STATUS_CONFIG = {
  "Order Placed":     { badge: "badge-warning",  label: "Placed",      emoji: "📋", step: 1 },
  Preparing:          { badge: "badge-info",     label: "Preparing",   emoji: "👨‍🍳", step: 2 },
  Ready:              { badge: "badge-secondary", label: "Ready",       emoji: "✨", step: 3 },
  "Out for Delivery": { badge: "badge-primary",  label: "On the Way",  emoji: "🛵", step: 4 },
  Delivered:          { badge: "badge-success",  label: "Delivered",   emoji: "✅", step: 5 },
  Cancelled:          { badge: "badge-danger",   label: "Cancelled",   emoji: "❌", step: 0 },
};

const FILTERS = ["All", "Order Placed", "Preparing", "Ready", "Out for Delivery", "Delivered", "Cancelled"];

function OrderProgressBar({ status }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg || cfg.step === 0) return null;
  const pct = Math.round((cfg.step / 4) * 100);
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ height: 4, background: "var(--s2)", borderRadius: "var(--r-f)", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: status === "Delivered"
            ? "var(--success)"
            : "linear-gradient(90deg,var(--p),var(--p-dark))",
          borderRadius: "var(--r-f)",
          transition: "width 0.6s var(--ease)",
        }} />
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = d.toDateString() === today.toDateString();
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `Today at ${time}`;
  if (isYesterday) return `Yesterday at ${time}`;
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) + ` · ${time}`;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    getOrders()
      .then((res) => setOrders(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "All" ? orders : orders.filter((o) => o.status === filter);

  if (loading) {
    return (
      <div className="page-loader">
        <div className="loader-spinner" />
        Loading your orders...
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="empty-page">
        <div className="empty-icon" style={{ width: 88, height: 88, margin: "0 auto 24px", background: "var(--p-light)" }}>
          <ClipboardText size={38} style={{ color: "var(--p)", opacity: 0.7 }} />
        </div>
        <h2>No orders yet</h2>
        <p>Place your first order from our menu and it'll appear here</p>
        <Link to="/menu" className="btn btn-primary btn-lg" style={{ marginTop: 4 }}>
          <ForkKnife size={17} /> Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="orders-page">
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
        <div>
          <h1 style={{ margin: 0 }}>My Orders</h1>
          <p style={{ color: "var(--txt-m)", fontSize: "0.875rem", marginTop: 3 }}>
            {orders.length} total order{orders.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link to="/menu" className="btn btn-outline btn-sm">
          <ForkKnife size={14} /> Order Again
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="orders-filter-tabs">
        {FILTERS.map((f) => {
          const count = f === "All" ? orders.length : orders.filter((o) => o.status === f).length;
          return (
            <button
              key={f}
              className={`orders-filter-tab ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {STATUS_CONFIG[f]?.emoji && <span>{STATUS_CONFIG[f].emoji}</span>}
              {f === "All" ? "All Orders" : STATUS_CONFIG[f]?.label || f}
              {count > 0 && (
                <span style={{
                  background: filter === f ? "rgba(255,255,255,0.3)" : "var(--s2)",
                  borderRadius: "var(--r-f)",
                  padding: "1px 6px",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          No orders with status "{filter}"
        </div>
      ) : (
        <div className="order-list">
          {filtered.map((order) => {
            const cfg = STATUS_CONFIG[order.status] || { badge: "badge-secondary", label: order.status, emoji: "📦", step: 0 };
            const itemNames = order.items?.map((i) => i.item_name).join(", ") || "";
            const isActive = order.status !== "Delivered" && order.status !== "Cancelled";

            return (
              <Link to={`/orders/${order.id}`} key={order.id} className="order-card">
                {/* Header row */}
                <div className="order-card-header">
                  <div>
                    <span className="order-id">Order #{order.id}</span>
                    {itemNames && (
                      <p className="order-items-preview">{itemNames}</p>
                    )}
                  </div>
                  <span className={`badge ${cfg.badge}`} style={{ flexShrink: 0 }}>
                    {cfg.emoji} {cfg.label}
                  </span>
                </div>

                {/* Meta row */}
                <div className="order-card-meta">
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={13} />
                    {formatDate(order.order_date)}
                  </span>
                  <span className="order-meta-sep">●</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <ForkKnife size={13} />
                    {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""}
                  </span>
                  <span className="order-meta-sep">●</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <CurrencyDollar size={13} />
                    Rs {order.total_amount}
                  </span>
                </div>

                {/* Progress bar for active orders */}
                <OrderProgressBar status={order.status} />

                {/* Footer */}
                <div className="order-card-footer" style={{ marginTop: 10 }}>
                  <span className="order-amount-large">Rs {order.total_amount}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 600, color: isActive ? "var(--p)" : "var(--txt-m)" }}>
                    {isActive ? "Track order" : "View details"} <ArrowRight size={13} weight="bold" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
