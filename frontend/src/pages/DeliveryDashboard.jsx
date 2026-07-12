import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDeliveryDashboard, getDeliveryOrders, markDelivered, markOutForDelivery, markCashCollected } from "../api/delivery";
import { ClipboardText, Clock, CheckCircle, MapPin, Phone, ArrowRight, WarningCircle, CurrencyDollar } from "@phosphor-icons/react";

export default function DeliveryDashboard() {
  const [stats, setStats] = useState({
    total_assigned: 0,
    pending: 0,
    completed: 0,
  });
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashRes, ordersRes] = await Promise.all([
        getDeliveryDashboard(),
        getDeliveryOrders(),
      ]);
      setStats(dashRes.data);
      // Active orders = not cancelled, and either not delivered OR delivered-COD-unpaid
      setActiveOrders(ordersRes.data.filter(o =>
        o.status !== "Cancelled" &&
        !(o.status === "Delivered" && (o.payment_method !== "COD" || o.payment_status === "Paid"))
      ));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOutForDelivery = async (id) => {
    try {
      await markOutForDelivery(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelivered = async (id) => {
    try {
      await markDelivered(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCashCollected = async (id) => {
    try {
      await markCashCollected(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="page-loader">
        <div className="loader-spinner" />
        Loading delivery dashboard...
      </div>
    );
  }

  return (
    <div className="delivery-dashboard">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <h1>Delivery Dashboard</h1>
        <p>Monitor your assigned orders, delivery routes, and statistics</p>
      </div>

      {/* KPI Stats Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 28 }}>
        {[
          {
            label: "Total Assigned Orders",
            value: stats.total_assigned,
            icon: ClipboardText,
            cls: "info",
            cardCls: "info-card",
          },
          {
            label: "Pending Deliveries",
            value: stats.pending,
            icon: Clock,
            cls: "warning",
            cardCls: "warning-card",
          },
          {
            label: "Completed Deliveries",
            value: stats.completed,
            icon: CheckCircle,
            cls: "success",
            cardCls: "success-card",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div className={`stat-card ${card.cardCls}`} key={card.label}>
              <div className="stat-card-header">
                <div>
                  <div className="stat-label">{card.label}</div>
                  <div className="stat-value" style={{ fontSize: "1.875rem" }}>{card.value}</div>
                </div>
                <div className={`stat-icon-wrap ${card.cls}`}>
                  <Icon size={20} weight="duotone" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Deliveries Section */}
      <div className="section" style={{ marginBottom: 28 }}>
        <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2>Active Deliveries</h2>
          <Link to="/delivery/orders" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.875rem", fontWeight: 600 }}>
            View All Orders <ArrowRight size={14} />
          </Link>
        </div>

        {activeOrders.length === 0 ? (
          <div style={{
            padding: 40,
            textAlign: "center",
            color: "var(--txt-m)",
            border: "1.5px dashed var(--border)",
            borderRadius: "var(--r)",
            background: "var(--surface)",
          }}>
            <CheckCircle size={32} weight="duotone" style={{ color: "var(--success)", marginBottom: 10 }} />
            <p style={{ fontWeight: 600, color: "var(--txt)" }}>All Deliveries Completed!</p>
            <p className="fs-sm">No pending orders assigned to you right now.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {activeOrders.map((order) => (
              <div className="panel-order-card" key={order.id} style={{ borderTop: `3px solid ${order.status === "Out for Delivery" ? "var(--p)" : "#8b5cf6"}` }}>
                <div className="panel-order-header">
                  <span className="panel-order-id">Order #{order.id}</span>
                  <span className={`badge ${order.status === "Out for Delivery" ? "badge-primary" : "badge-secondary"}`}>
                    {order.status}
                  </span>
                </div>
                <div className="panel-order-body">
                  <div style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: 10, color: "var(--txt)" }}>
                    {order.customer}
                  </div>
                  <div style={{ display: "flex", alignItems: "start", gap: 6, fontSize: "0.8125rem", color: "var(--txt-2)", marginBottom: 6 }}>
                    <MapPin size={14} style={{ color: "var(--p)", marginTop: 2, flexShrink: 0 }} weight="fill" />
                    <span>{order.address || "No address details available."}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8125rem", color: "var(--txt-2)", marginBottom: 10 }}>
                    <Phone size={14} style={{ color: "var(--p)", flexShrink: 0 }} weight="fill" />
                    <span>{order.phone}</span>
                  </div>

                  {/* Payment Details */}
                  <div style={{ background: "var(--s2)", border: "1.5px solid var(--border)", borderRadius: "var(--r-sm)", padding: 8, margin: "8px 0", fontSize: "0.8125rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ color: "var(--txt-m)" }}>Payment:</span>
                      <strong style={{ color: order.payment_status === "Paid" ? "var(--success)" : "var(--warning)" }}>
                        {order.payment_method === "COD" ? "Cash on Delivery" : "eSewa"} ({order.payment_status})
                      </strong>
                    </div>
                    {order.payment_method === "COD" && order.payment_status !== "Paid" && (
                      <div style={{ color: "var(--danger)", fontWeight: 700, display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                        <WarningCircle size={14} weight="fill" /> Collect Rs {order.total} Cash
                      </div>
                    )}
                  </div>

                  {/* Order Notes */}
                  {order.notes && (
                    <div style={{ fontSize: "0.8125rem", color: "var(--txt-2)", fontStyle: "italic", background: "var(--s2)", borderLeft: "3px solid var(--warning)", padding: "6px 8px", borderRadius: "0 var(--r-sm) var(--r-sm) 0", margin: "8px 0" }}>
                      <strong>Note:</strong> {order.notes}
                    </div>
                  )}
                  
                  <div style={{ borderTop: "1px solid var(--border-l)", paddingTop: 10, marginTop: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="text-muted fs-sm">Total Amount:</span>
                      <span style={{ fontWeight: 700, fontSize: "1.0625rem", color: "var(--p-dark)" }}>Rs {order.total}</span>
                    </div>
                  </div>
                </div>
                
                <div className="panel-order-footer">
                  {order.status === "Ready" ? (
                    <button
                      className="btn btn-sm btn-primary btn-block"
                      onClick={() => handleOutForDelivery(order.id)}
                    >
                      Start Delivery
                    </button>
                  ) : order.status === "Out for Delivery" ? (
                    <button
                      className="btn btn-sm btn-success btn-block"
                      onClick={() => handleDelivered(order.id)}
                    >
                      Mark as Delivered
                    </button>
                  ) : order.status === "Delivered" && order.payment_method === "COD" && order.payment_status !== "Paid" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                      <div style={{
                        background: "#fff3cd", border: "1px solid #ffc107",
                        borderRadius: "var(--r-sm)", padding: "6px 10px",
                        fontSize: "0.8125rem", color: "#856404",
                        display: "flex", alignItems: "center", gap: 6,
                      }}>
                        <WarningCircle size={13} weight="fill" />
                        Cash not collected — Rs {order.total}
                      </div>
                      <button
                        className="btn btn-sm btn-primary btn-block"
                        onClick={() => handleCashCollected(order.id)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                      >
                        <CurrencyDollar size={13} weight="fill" />
                        Mark Cash Collected
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.8125rem", color: "var(--txt-m)", textAlign: "center", width: "100%" }}>
                      Waiting for kitchen to prepare order.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}