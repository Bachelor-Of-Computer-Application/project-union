import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getOrderDetail, cancelOrder } from "../api/orders";
import {
  ArrowLeft, Check, Clock, Fire, Truck, CheckCircle,
  MapPin, CreditCard, Package, XCircle, Warning,
} from "@phosphor-icons/react";

const STEPS = [
  { key: "Order Placed",     icon: Package,      label: "Order Placed",      sub: "We received your order" },
  { key: "Preparing",        icon: Fire,         label: "Preparing",         sub: "Kitchen is on it" },
  { key: "Ready",            icon: CheckCircle,  label: "Ready",             sub: "Order is ready!" },
  { key: "Out for Delivery", icon: Truck,        label: "Out for Delivery",  sub: "On the way to you" },
  { key: "Delivered",        icon: CheckCircle,  label: "Delivered",         sub: "Enjoy your meal! 🎉" },
];

const STATUS_BADGE = {
  "Order Placed":     "badge-warning",
  Preparing:          "badge-info",
  Ready:              "badge-secondary",
  "Out for Delivery": "badge-primary",
  Delivered:          "badge-success",
  Cancelled:          "badge-danger",
};

const STATUS_MESSAGES = {
  "Order Placed":     "Your order is confirmed and waiting for the kitchen to pick it up.",
  Preparing:          "Your food is being freshly prepared by our kitchen team.",  Ready:              "Your order is ready! Pick it up or wait for delivery.",  "Out for Delivery": "Your order is on its way! Get ready to enjoy your meal.",
  Delivered:          "Your order was delivered successfully. Bon appétit!",
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchOrder = () =>
    getOrderDetail(id)
      .then((res) => setOrder(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { fetchOrder(); }, [id]);

  const handleCancel = async () => {
    setCancelling(true);
    setCancelError("");
    try {
      const res = await cancelOrder(id);
      setOrder(res.data);
      setShowConfirm(false);
    } catch (err) {
      setCancelError(
        err.response?.data?.error || "Could not cancel this order. Please try again."
      );
    } finally {
      setCancelling(false);
    }
  };

  const currentStep = STEPS.findIndex((s) => s.key === order?.status);
  const isCancelled = order?.status === "Cancelled";
  const isDelivered = order?.status === "Delivered";
  const canCancel   = order?.status === "Order Placed" || order?.status === "Preparing";
  const progressPct = !isCancelled && currentStep >= 0
    ? Math.round(((currentStep - 1) / (STEPS.length - 1)) * 100)
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
        <span
          className={`badge ${STATUS_BADGE[order.status] || "badge-secondary"}`}
          style={{ fontSize: "0.75rem", padding: "5px 14px" }}
        >
          {order.status}
        </span>
        <span style={{
          fontSize: "0.875rem", color: "var(--txt-m)", marginLeft: "auto",
          display: "flex", alignItems: "center", gap: 5,
        }}>
          <Clock size={14} />
          {new Date(order.order_date).toLocaleString("en-US", {
            weekday: "short", month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit",
          })}
        </span>
      </div>

      {/* Status message banner */}
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

      {/* Cancelled banner */}
      {isCancelled && (
        <div className="alert alert-error" style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
          <XCircle size={18} weight="fill" />
          This order has been cancelled.
        </div>
      )}

      {/* Cancel action — only shown for "Order Placed" */}
      {canCancel && (
        <div style={{
          background: "var(--warning-l)", border: "1.5px solid var(--warning-b)",
          borderRadius: "var(--r-sm)", padding: "14px 18px",
          marginBottom: 20, display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 16, flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Warning size={18} weight="fill" style={{ color: "var(--warning)", flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--txt)" }}>
                Need to cancel?
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--txt-2)", marginTop: 2 }}>
                You can cancel this order while it's still waiting to be prepared.
              </div>
            </div>
          </div>
          {!showConfirm ? (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setShowConfirm(true)}
            >
              <XCircle size={14} weight="fill" /> Cancel Order
            </button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--txt)" }}>
                Are you sure?
              </span>
              <button
                className="btn btn-danger btn-sm"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? "Cancelling…" : "Yes, cancel it"}
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => { setShowConfirm(false); setCancelError(""); }}
                disabled={cancelling}
              >
                Keep order
              </button>
            </div>
          )}
        </div>
      )}

      {cancelError && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>{cancelError}</div>
      )}

      {/* Tracking timeline */}
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
          <div style={{ marginBottom: 32 }}>
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

          <div className="tracking-steps">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const done = i < currentStep;
              const active = i === currentStep;
              return (
                <div key={step.key} className={`tracking-step ${active ? "active" : ""} ${done ? "completed" : ""}`}>
                  <div className="step-indicator">
                    {done
                      ? <Check size={16} weight="bold" />
                      : <Icon size={16} weight={active ? "fill" : "regular"} />}
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

      {/* Info grid */}
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

      {/* Items table */}
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
                  <td><span className="badge badge-secondary">×{item.quantity}</span></td>
                  <td style={{ textAlign: "right", fontWeight: 700, color: "var(--txt)" }}>
                    Rs {(parseFloat(item.item_price) * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid var(--border)" }}>
                <td colSpan={3} style={{
                  textAlign: "right", fontWeight: 700,
                  fontSize: "1rem", color: "var(--txt)", padding: "16px",
                }}>
                  Order Total
                </td>
                <td style={{
                  textAlign: "right", fontWeight: 800,
                  fontSize: "1.125rem", color: "var(--p-dark)",
                  padding: "16px", fontFamily: "var(--fh)",
                }}>
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
