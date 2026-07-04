import { useEffect, useState } from "react";
import { getMenuManage, createMenuItem, updateMenuItem, deleteMenuItem, getMenuCategories } from "../api/menu";
import { getAdminOrders, adminUpdateOrder } from "../api/orders";
import {
  CheckCircle, XCircle, Plus, PencilSimple, Trash,
  ForkKnife, ClipboardText, Clock, Fire, Truck, Package,
} from "@phosphor-icons/react";

const STATUS_CONFIG = {
  "Order Placed":     { badge: "badge-warning", color: "var(--warning)",  label: "New Order", icon: Clock },
  Preparing:          { badge: "badge-info",    color: "var(--info)",     label: "Preparing", icon: Fire },
  "Out for Delivery": { badge: "badge-primary", color: "var(--primary)",  label: "Out",       icon: Truck },
};

export default function RestaurantPanel() {
  const [tab, setTab] = useState("orders");
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: "", category: "", price: "", description: "", is_available: true });
  const [imageFile, setImageFile] = useState(null);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([getMenuManage(), getAdminOrders(), getMenuCategories()])
      .then(([m, o, c]) => { setItems(m.data); setOrders(o.data); setCategories(c.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => {
    setForm({ name: "", category: "", price: "", description: "", is_available: true });
    setEditItem(null); setShowForm(false); setImageFile(null);
  };

  const handleEdit = (item) => {
    setForm({ name: item.name, category: item.category, price: item.price, description: item.description || "", is_available: item.is_available });
    setEditItem(item); setShowForm(true);
  };

  const handleSubmit = async () => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (imageFile) fd.append("image", imageFile);
    if (editItem) { await updateMenuItem(editItem.id, fd); }
    else { await createMenuItem(fd); }
    resetForm(); fetchAll();
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this item?")) { await deleteMenuItem(id); fetchAll(); }
  };

  const handleOrderStatus = async (id, status) => {
    await adminUpdateOrder(id, { status }); fetchAll();
  };

  if (loading) {
    return <div className="page-loader"><div className="loader-spinner" />Loading restaurant panel...</div>;
  }

  const activeOrders = orders.filter((o) => !["Delivered", "Cancelled"].includes(o.status));
  const byStatus = {
    "Order Placed":     activeOrders.filter((o) => o.status === "Order Placed"),
    Preparing:          activeOrders.filter((o) => o.status === "Preparing"),
    "Out for Delivery": activeOrders.filter((o) => o.status === "Out for Delivery"),
  };

  const TABS = [
    { key: "orders", label: "Live Orders", icon: ClipboardText,
      badge: activeOrders.length || null },
    { key: "menu",   label: "Menu Management", icon: ForkKnife, badge: null },
  ];

  return (
    <div className="restaurant-page">
      <div className="page-header">
        <h1>Restaurant Panel</h1>
        <p>Manage your kitchen orders and menu in real time</p>
      </div>

      <div className="tabs">
        {TABS.map(({ key, label, icon: Icon, badge }) => (
          <button key={key} className={`tab ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>
            <Icon size={15} weight={tab === key ? "fill" : "regular"} />
            {label}
            {badge !== null && badge !== undefined && (
              <span style={{
                background: tab === key ? "var(--danger-light)" : "var(--danger-light)",
                color: "var(--danger)",
                borderRadius: "var(--r-full)", padding: "1px 7px", fontSize: "0.6875rem", fontWeight: 700,
              }}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* LIVE ORDERS — Kanban style */}
      {tab === "orders" && (
        <div className="section">
          {activeOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Package size={28} /></div>
              <p>No active orders right now. You're all caught up!</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
              {Object.entries(byStatus).map(([status, statusOrders]) => {
                const cfg = STATUS_CONFIG[status];
                const Icon = cfg.icon;
                return (
                  <div key={status}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      marginBottom: "12px", padding: "10px 14px",
                      background: "var(--surface)", border: "1.5px solid var(--border)",
                      borderRadius: "var(--r-sm)", borderTop: `3px solid ${cfg.color}`,
                    }}>
                      <Icon size={16} style={{ color: cfg.color }} weight="fill" />
                      <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>{cfg.label}</span>
                      <span style={{ marginLeft: "auto", background: cfg.color + "20", color: cfg.color,
                        borderRadius: "var(--r-full)", padding: "2px 8px", fontSize: "0.6875rem", fontWeight: 700 }}>
                        {statusOrders.length}
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {statusOrders.length === 0 ? (
                        <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)",
                          fontSize: "0.8125rem", border: "1.5px dashed var(--border)", borderRadius: "var(--r-sm)",
                          background: "var(--surface)" }}>
                          No orders
                        </div>
                      ) : (
                        statusOrders.map((o) => (
                          <div key={o.id} className="panel-order-card" style={{ borderTop: `3px solid ${cfg.color}` }}>
                            <div className="panel-order-header">
                              <span className="panel-order-id">#{o.id}</span>
                              <span className={`badge ${cfg.badge}`}>{status}</span>
                            </div>
                            <div className="panel-order-body">
                              <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "6px" }}>
                                {o.customer_name}
                              </div>
                              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "10px" }}>
                                {new Date(o.order_date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                              </div>
                              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.0625rem", color: "var(--primary-dark)" }}>
                                Rs {o.total_amount}
                              </div>
                            </div>
                            <div className="panel-order-footer">
                              <select
                                value={o.status}
                                onChange={(e) => handleOrderStatus(o.id, e.target.value)}
                                className="form-select-sm"
                                style={{ flex: 1 }}
                              >
                                {["Order Placed", "Preparing", "Out for Delivery", "Delivered", "Cancelled"].map((s) => (
                                  <option key={s}>{s}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MENU MANAGEMENT */}
      {tab === "menu" && (
        <div className="section">
          <div className="section-header">
            <h2>Menu Items <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-muted)" }}>({items.length} items)</span></h2>
            <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowForm(true); }}>
              <Plus size={15} weight="bold" /> Add Item
            </button>
          </div>

          {showForm && (
            <div className="form-card">
              <h3>{editItem ? "Edit Item" : "New Menu Item"}</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Item Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Chicken Momo" />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                    <option value="">Select...</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price (Rs)</label>
                  <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Availability</label>
                  <select value={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.value === "true" })}>
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Describe this dish..." />
              </div>
              <div className="form-group">
                <label>Photo</label>
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0] || null)} />
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={handleSubmit}>{editItem ? "Update" : "Create"}</button>
                <button className="btn btn-outline" onClick={resetForm}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--text)" }}>{item.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        {item.category_name || item.category}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: "var(--primary-dark)" }}>Rs {item.price}</td>
                    <td>
                      {item.is_available
                        ? <span className="badge badge-success"><CheckCircle size={12} weight="fill" /> Available</span>
                        : <span className="badge badge-danger"><XCircle size={12} weight="fill" /> Unavailable</span>}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button className="btn btn-xs btn-outline" onClick={() => handleEdit(item)}>
                          <PencilSimple size={13} /> Edit
                        </button>
                        <button className="btn btn-xs btn-danger" onClick={() => handleDelete(item.id)}>
                          <Trash size={13} /> Delete
                        </button>
                      </div>
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
