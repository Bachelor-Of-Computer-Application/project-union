import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getOrderDetail } from "../api/orders";
import { ArrowLeft, Check, Clock, Fire, Truck, CheckCircle, MapPin, CreditCard, Package, XCircle } from "@phosphor-icons/react";

const STEPS = [
  { key: "Order Placed",     icon: Package,      label: "Order Placed",      sub: "We received your order" },
  { key: "Preparing",        icon: Fire,         label: "Preparing",         sub: "Kitchen is on it" },
  { key: "Out for Delivery", icon: Truck,        label: "Out for Delivery",  sub: "On the way to you" },
  { key: "Delivered",        icon: CheckCircle,  label: "Delivered",         sub: "Enjoy your meal! 🎉" },
];

const STATUS_BADGE = {
  "Order Placed":     "badge-warning",
  Preparing:          "badge-info",
  "Out for Delivery": "badge-primary",
  Delivered:          "badge-success",
  Cancelled:          "badge-danger",
};

const STATUS_MESSAGES = {
  "Order Placed":     "Your order is confirmed and waiting for the kitchen to pick it up.",
  Preparing:          "Your food is being freshly prepared by our kitchen team.",
  "Out for Delivery": "Your order is on its way! Get ready to enjoy your meal.",
  Delivered:          "Your order was delivered successfully. Bon appétit!",
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrderDetail(id)
      .then((res) => setOrder(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const currentStep = STEPS.findIndex((s) => s.key === order?.status);
  const isCancelled = order?.status === "Cancelled";
  const isDelivered = order?.status === "Delivered";
  const progressPct = !isCancelled && currentStep >= 0
    ? Math.round((currentStep / (STEPS.length - 1)) * 100)
    : 0;

  if (loading) {
    return (
      <div className="page-loader">
        <div className="loader-spinner" />
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="empty-page">
        <h2>Order not found</h2>
        <Link to="/orders" className="btn btn-outline">Back to Orders</Link>
      </div>
    );
  }

  return (
    <div className="order-detail-page">
      <Link to="/orders" className="back-link">
        <ArrowLeft size={15} weight="bold" /> Back to Orders
      </Link>

      {/* Header */}
      <div className="order-header">
        <h1>Order #{order.id}</h1>
        <span className={`badge ${STATUS_BADGE[order.status] || "badge-secondary"}`} style={{ fontSize: "0.75rem", padding: "5px 14px" }}>
          {order.status}
        </span>
        <span style={{ fontSize: "0.875rem", color: "var(--txt-m)", marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
          <Clock size={14} />
          {new Date(order.order_date).toLocaleString("en-US", {
            weekday: "short", month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit",
          })}
        </span>
      </div>

      {/* Status message */}
      {STATUS_MESSAGES[order.status] && (
        <div style={{
          background: isDelivered ? "var(--success-l)" : "var(--p-light)",
          border: `1.5px solid ${isDelivered ? "var(--success-b)" : "var(--p-mid)"}`,
          borderRadius: "var(--r-sm)", padding: "12px 16px",
          fontSize: "0.875rem", fontWeight: 500,
          color: isDelivered ? "var(--success)" : "var(--p-dark)",
          marginBottom: 20,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          {isDelivered
            ? <CheckCircle size={18} weight="fill" />
            : <Clock size={18} weight="fill" />}
          {STATUS_MESSAGES[order.status]}
        </div>
      )}

      {/* Cancelled alert */}
      {isCancelled && (
        <div className="alert alert-error" style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: 10 }}>
          <XCircle size={18} weight="fill" />
          This order has been cancelled.
        </div>
      )}

      {/* Tracking Timeline */}
      {!isCancelled && (
        <div className="order-tracking">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <h2 style={{ margin: 0 }}>Live Tracking</h2>
            {!isDelivered && (
              <span style={{ fontSize: "0.8125rem", color: "var(--txt-m)", display: "flex", alignItems: "center", gap: 5 }}>
                <Clock size={13} />
                Est. 25–35 min
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div style={{ position: "relative", marginBottom: 32 }}>
            <div style={{ height: 4, background: "var(--s2)", borderRadius: "var(--r-f)", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${progressPct}%`,
                background: isDelivered
                  ? "var(--success)"
                  : "linear-gradient(90deg,var(--success),var(--p))",
                borderRadius: "var(--r-f)",
                transition: "width 1s var(--ease)",
              }} />
            </div>
          </div>

          <div className="tracking-steps" style={{ position: "relative" }}>
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const done = i < currentStep;
              const active = i === currentStep;
              return (
                <div key={step.key} className={`tracking-step ${active ? "active" : ""} ${done ? "completed" : ""}`}>
                  <div className="step-indicator">
                    {done
                      ? <Check size={16} weight="bold" />
                      : <Icon size={16} weight={active ? "fill" : "regular"} />
                    }
                  </div>
                  <div>
                    <div className="step-label" style={{ fontWeight: 600, fontSize: "0.8125rem" }}>
                      {step.label}
                    </div>
                    <div className="step-label" style={{ fontSize: "0.6875rem", marginTop: 2, opacity: 0.75 }}>
                      {step.sub}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info Grid */}
      <div className="order-info-grid">
        <div className="info-card">
          <h3>
            <MapPin size={13} style={{ marginRight: 4, verticalAlign: "middle", color: "var(--p)" }} />
            Delivery Address
          </h3>
          {order.delivery_address_detail ? (
            <>
              <p><strong>{order.delivery_address_detail.label}</strong></p>
              <p>{order.delivery_address_detail.full_address}</p>
              <p>{order.delivery_address_detail.city}</p>
            </>
          ) : (
            <p className="text-muted">No address saved</p>
          )}
        </div>

        <div className="info-card">
          <h3>
            <CreditCard size={13} style={{ marginRight: 4, verticalAlign: "middle", color: "var(--p)" }} />
            Payment Details
          </h3>
          <p>
            <strong>Method:</strong>{" "}
            <span style={{ color: "var(--txt)" }}>{order.payment_method || "Cash on Delivery"}</span>
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <span style={{
              color: order.payment_status === "Paid" ? "var(--success)" : "var(--warning)",
              fontWeight: 600,
            }}>
              {order.payment_status}
            </span>
          </p>
          <p style={{ marginTop: 14, fontSize: "1.125rem", fontWeight: 800, color: "var(--p-dark)", fontFamily: "var(--fh)" }}>
            Rs {order.total_amount}
          </p>
        </div>
      </div>

      {order.notes && (
        <div className="info-card" style={{ marginBottom: 24 }}>
          <h3>Special Instructions</h3>
          <p style={{ fontStyle: "italic", color: "var(--txt-2)" }}>"{order.notes}"</p>
        </div>
      )}

      {/* Order Items Table */}
      <div className="section">
        <div className="section-header">
          <h2>Items Ordered</h2>
          <span className="badge badge-secondary">{order.items?.length || 0} items</span>
        </div>
        <div style={{
          background: "var(--surface)", border: "1.5px solid var(--border)",
          borderRadius: "var(--r)", overflow: "hidden", boxShadow: "var(--sh-sm)",
        }}>
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Unit Price</th>
                <th>Qty</th>
                <th style={{ textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600, color: "var(--txt)" }}>{item.item_name}</td>
                  <td style={{ color: "var(--txt-2)" }}>Rs {item.item_price}</td>
                  <td>
                    <span className="badge badge-secondary">×{item.quantity}</span>
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 700, color: "var(--txt)" }}>
                    Rs {item.item_price * item.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid var(--border)" }}>
                <td colSpan={3} style={{ textAlign: "right", fontWeight: 700, fontSize: "1rem", color: "var(--txt)", padding: "16px" }}>
                  Order Total
                </td>
                <td style={{ textAlign: "right", fontWeight: 800, fontSize: "1.125rem", color: "var(--p-dark)", padding: "16px", fontFamily: "var(--fh)" }}>
                  Rs {order.total_amount}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
