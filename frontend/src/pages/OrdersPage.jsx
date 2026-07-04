import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getOrders } from "../api/orders";
import { ClipboardText, ArrowRight, ForkKnife } from "@phosphor-icons/react";

const STATUS_CONFIG = {
  "Order Placed": { badge: "badge-warning",   label: "Placed" },
  Preparing:      { badge: "badge-info",      label: "Preparing" },
  "Out for Delivery": { badge: "badge-primary", label: "On the Way" },
  Delivered:      { badge: "badge-success",   label: "Delivered" },
  Cancelled:      { badge: "badge-danger",    label: "Cancelled" },
};

const FILTERS = ["All", "Order Placed", "Preparing", "Out for Delivery", "Delivered", "Cancelled"];

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
        <div className="empty-icon" style={{ width: 80, height: 80, margin: "0 auto 20px" }}>
          <ClipboardText size={36} style={{ opacity: 0.35, color: "var(--text-muted)" }} />
        </div>
        <h2>No orders yet</h2>
        <p>Place your first order from our menu and it'll appear here</p>
        <Link to="/menu" className="btn btn-primary btn-lg">
          <ForkKnife size={17} /> Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <h1 style={{ margin: 0 }}>My Orders</h1>
        <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", fontWeight: 500 }}>
          {orders.length} total orders
        </span>
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
              {f}
              {count > 0 && (
                <span style={{
                  background: filter === f ? "rgba(255,255,255,0.3)" : "var(--surface-3)",
                  borderRadius: "var(--r-full)",
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
            const cfg = STATUS_CONFIG[order.status] || { badge: "badge-secondary", label: order.status };
            return (
              <Link to={`/orders/${order.id}`} key={order.id} className="order-card">
                <div className="order-card-header">
                  <span className="order-id">Order #{order.id}</span>
                  <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                </div>

                <div className="order-card-body">
                  <span>{new Date(order.order_date).toLocaleDateString("en-US", {
                    weekday: "short", month: "short", day: "numeric"
                  })}</span>
                  <span style={{ color: "var(--text-muted)" }}>
                    {new Date(order.order_date).toLocaleTimeString("en-US", {
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </span>
                  <span style={{ fontWeight: 600, color: "var(--text)" }}>
                    {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="order-card-footer">
                  <span className="order-amount-large">Rs {order.total_amount}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 500 }}>
                    Track order <ArrowRight size={13} weight="bold" />
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
