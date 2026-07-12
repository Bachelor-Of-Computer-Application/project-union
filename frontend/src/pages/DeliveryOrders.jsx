import React, { useEffect, useState } from "react";
import { getDeliveryOrders, markDelivered, markOutForDelivery, markCashCollected } from "../api/delivery";
import { ClipboardText, MapPin, Phone, CheckCircle, Clock, ForkKnife, Info, Truck, WarningCircle, CurrencyDollar } from "@phosphor-icons/react";

const STATUS_CONFIG = {
  "Order Placed":     { badge: "badge-warning",   color: "var(--warning)",  icon: Clock },
  "Preparing":        { badge: "badge-info",       color: "var(--info)",     icon: Clock },
  "Ready":            { badge: "badge-secondary",  color: "#8b5cf6",         icon: CheckCircle },
  "Out for Delivery": { badge: "badge-primary",    color: "var(--primary)",  icon: Truck },
  "Delivered":          { badge: "badge-success",    color: "var(--success)",  icon: CheckCircle },
  "Cancelled":          { badge: "badge-danger",     color: "var(--danger)",   icon: Info },
};

export default function DeliveryOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'pending', 'completed'

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data } = await getDeliveryOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleOutForDelivery = async (id) => {
    try {
      await markOutForDelivery(id);
      loadOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelivered = async (id) => {
    try {
      await markDelivered(id);
      loadOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCashCollected = async (id) => {
    try {
      await markCashCollected(id);
      loadOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === "pending") {
      return order.status !== "Delivered" && order.status !== "Cancelled";
    }
    if (filter === "completed") {
      return order.status === "Delivered";
    }
    return true; // 'all'
  });

  if (loading) {
    return (
      <div className="page-loader">
        <div className="loader-spinner" />
        Loading your assigned orders...
      </div>
    );
  }

  const TABS = [
    { key: "all",       label: "All Orders",       count: orders.length },
    { key: "pending",   label: "Pending",          count: orders.filter(o => o.status !== "Delivered" && o.status !== "Cancelled").length },
    { key: "completed", label: "Completed",        count: orders.filter(o => o.status === "Delivered").length },
  ];

  return (
    <div className="delivery-orders">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <h1>My Assigned Orders</h1>
        <p>Manage and track all deliveries assigned to you</p>
      </div>

      {/* Filter Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {TABS.map(({ key, label, count }) => (
          <button
            key={key}
            className={`tab ${filter === key ? "active" : ""}`}
            onClick={() => setFilter(key)}
          >
            {label}
            <span style={{
              background: filter === key ? "var(--primary-light)" : "var(--surface-3)",
              color: filter === key ? "var(--primary)" : "var(--text-muted)",
              borderRadius: "var(--r-full)", padding: "1px 7px", fontSize: "0.6875rem", fontWeight: 700,
              marginLeft: 6
            }}>{count}</span>
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div style={{
          padding: 48,
          textAlign: "center",
          color: "var(--txt-m)",
          border: "1.5px dashed var(--border)",
          borderRadius: "var(--r)",
          background: "var(--surface)",
        }}>
          <ClipboardText size={32} weight="duotone" style={{ color: "var(--p)", marginBottom: 10 }} />
          <p style={{ fontWeight: 600, color: "var(--txt)" }}>No orders found</p>
          <p className="fs-sm">There are no orders matching this filter status.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 20 }}>
          {filteredOrders.map((order) => {
            const cfg = STATUS_CONFIG[order.status] || { badge: "badge-secondary", color: "#6b7280", icon: Info };
            const Icon = cfg.icon;

            return (
              <div
                className="panel-order-card"
                key={order.id}
                style={{
                  borderTop: `3px solid ${cfg.color}`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div className="panel-order-header">
                    <span className="panel-order-id">Order #{order.id}</span>
                    <span className={`badge ${cfg.badge}`} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon size={12} weight="fill" />
                      {order.status}
                    </span>
                  </div>

                  <div className="panel-order-body">
                    <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 12, color: "var(--txt)" }}>
                      {order.customer}
                    </div>

                    <div style={{ display: "flex", alignItems: "start", gap: 8, fontSize: "0.875rem", color: "var(--txt-2)", marginBottom: 8 }}>
                      <MapPin size={16} style={{ color: "var(--p)", marginTop: 2, flexShrink: 0 }} weight="fill" />
                      <span>{order.address || "No address provided."}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem", color: "var(--txt-2)", marginBottom: 12 }}>
                      <Phone size={16} style={{ color: "var(--p)", flexShrink: 0 }} weight="fill" />
                      <span>{order.phone}</span>
                    </div>

                    {/* Payment Details */}
                    <div style={{ background: "var(--s2)", border: "1.5px solid var(--border)", borderRadius: "var(--r-sm)", padding: 10, margin: "10px 0", fontSize: "0.875rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: "var(--txt-m)" }}>Payment:</span>
                        <strong style={{ color: order.payment_status === "Paid" ? "var(--success)" : "var(--warning)" }}>
                          {order.payment_method === "COD" ? "Cash on Delivery" : "eSewa"} ({order.payment_status})
                        </strong>
                      </div>
                      {order.payment_method === "COD" && order.payment_status !== "Paid" && (
                        <div style={{ color: "var(--danger)", fontWeight: 700, display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                          <WarningCircle size={15} weight="fill" /> Collect Rs {order.total} Cash
                        </div>
                      )}
                    </div>

                    {/* Order Notes */}
                    {order.notes && (
                      <div style={{ fontSize: "0.875rem", color: "var(--txt-2)", fontStyle: "italic", background: "var(--s2)", borderLeft: "3px solid var(--warning)", padding: "8px", borderRadius: "0 var(--r-sm) var(--r-sm) 0", margin: "10px 0" }}>
                        <strong>Note:</strong> {order.notes}
                      </div>
                    )}

                    {/* Ordered Items */}
                    <div style={{ borderTop: "1px solid var(--border-l)", paddingTop: 12, marginTop: 12 }}>
                      <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--txt-m)", textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
                        <ForkKnife size={13} /> Items List
                      </div>
                      <ul style={{ paddingLeft: 16, margin: 0, fontSize: "0.875rem", color: "var(--txt-2)" }}>
                        {order.items.map((item, index) => (
                          <li key={index} style={{ marginBottom: 4 }}>
                            <strong>{item.quantity}x</strong> {item.name}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ borderTop: "1px solid var(--border-l)", paddingTop: 12, marginTop: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="text-muted fs-sm">Total Value:</span>
                        <span style={{ fontWeight: 800, fontSize: "1.125rem", color: "var(--p-dark)" }}>Rs {order.total}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="panel-order-footer" style={{ padding: 16, background: "var(--s2)", borderTop: "1px solid var(--border-l)" }}>
                  {order.status === "Ready" && (
                    <button
                      className="btn btn-warning btn-block btn-sm"
                      onClick={() => handleOutForDelivery(order.id)}
                    >
                      Start Delivery
                    </button>
                  )}

                  {order.status === "Out for Delivery" && (
                    <button
                      className="btn btn-success btn-block btn-sm"
                      onClick={() => handleDelivered(order.id)}
                    >
                      Mark as Delivered
                    </button>
                  )}

                  {["Order Placed", "Preparing"].includes(order.status) && (
                    <div style={{ width: "100%", textAlign: "center", fontSize: "0.8125rem", color: "var(--txt-m)", padding: "4px 0", fontStyle: "italic" }}>
                      Waiting for kitchen prep...
                    </div>
                  )}

                  {order.status === "Delivered" && order.payment_method === "COD" && order.payment_status !== "Paid" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                      <div style={{
                        background: "#fff3cd", border: "1px solid #ffc107",
                        borderRadius: "var(--r-sm)", padding: "8px 10px",
                        fontSize: "0.8125rem", color: "#856404",
                        display: "flex", alignItems: "center", gap: 6,
                      }}>
                        <WarningCircle size={14} weight="fill" />
                        Cash not collected yet — Rs {order.total}
                      </div>
                      <button
                        className="btn btn-primary btn-block btn-sm"
                        onClick={() => handleCashCollected(order.id)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                      >
                        <CurrencyDollar size={14} weight="fill" />
                        Mark Cash Collected
                      </button>
                    </div>
                  )}

                  {order.status === "Delivered" && (order.payment_method === "eSewa" || order.payment_status === "Paid") && (
                    <div style={{ width: "100%", textAlign: "center", fontSize: "0.8125rem", padding: "4px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <CheckCircle size={14} weight="fill" style={{ color: "var(--success)" }} />
                      <span style={{ color: "var(--success)", fontWeight: 600 }}>Delivered · Payment Confirmed</span>
                    </div>
                  )}

                  {order.status === "Cancelled" && (
                    <div style={{ width: "100%", textAlign: "center", fontSize: "0.8125rem", color: "var(--txt-m)", padding: "4px 0" }}>
                      Order Cancelled
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}