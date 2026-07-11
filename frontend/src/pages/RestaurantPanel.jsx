import { useEffect, useState, useRef } from "react";
import {
  getMenuManage, createMenuItem, updateMenuItem, deleteMenuItem,
  adminGetMainCategories, adminGetSections,
} from "../api/menu";
import { getAdminOrders, adminUpdateOrder } from "../api/orders";
import {
  CheckCircle, XCircle, Plus, PencilSimple, Trash,
  ForkKnife, ClipboardText, Clock, Fire, Truck, Package,
} from "@phosphor-icons/react";

const STATUS_CONFIG = {
  "Order Placed":     { badge: "badge-warning",   color: "var(--warning)",  label: "New Order", icon: Clock },
  "Preparing":        { badge: "badge-info",       color: "var(--info)",     label: "Preparing", icon: Fire  },
  "Ready":            { badge: "badge-secondary",  color: "#8b5cf6",         label: "Ready",     icon: Fire  },
  "Out for Delivery": { badge: "badge-primary",    color: "var(--primary)",  label: "Out",       icon: Truck },
};

const KANBAN_COLS = ["Order Placed", "Preparing", "Ready", "Out for Delivery"];

// helper — shared inside and outside handlers
const isActive = (o) => !["Delivered", "Cancelled"].includes(o.status);

const EMPTY_FORM = {
  name: "", main_category: "", section: "", price: "", description: "", is_available: true,
};

export default function RestaurantPanel() {
  const [tab, setTab]                 = useState("orders");
  const [items, setItems]             = useState([]);
  const [orders, setOrders]           = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [editItem, setEditItem]       = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [imageFile, setImageFile]     = useState(null);
  const [formError, setFormError]     = useState("");
  const [draggedId, setDraggedId]     = useState(null);
  const [dropTarget, setDropTarget]   = useState(null);
  const colRefs = useRef({});

  // ── sections filtered by the currently selected main_category ────────────
  const filteredSections = allSections.filter(
    (s) => String(s.main_category) === String(form.main_category)
  );

  // ── data fetching ──────────────────────────────────────────────────────────
  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      getMenuManage(),
      getAdminOrders(),
      adminGetMainCategories(),
      adminGetSections(),
    ])
      .then(([m, o, mc, sec]) => {
        setItems(m.data);
        setOrders(o.data);
        setMainCategories(mc.data);
        setAllSections(sec.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  // ── form helpers ───────────────────────────────────────────────────────────
  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditItem(null);
    setShowForm(false);
    setImageFile(null);
    setFormError("");
  };

  const handleEdit = (item) => {
    setForm({
      name:          item.name,
      main_category: String(item.main_category_id ?? ""),
      section:       String(item.section ?? ""),
      price:         item.price,
      description:   item.description || "",
      is_available:  item.is_available,
    });
    setEditItem(item);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!form.section) { setFormError("Please select a menu section."); return; }
    const fd = new FormData();
    fd.append("name",         form.name);
    fd.append("section",      form.section);
    fd.append("price",        form.price);
    fd.append("description",  form.description);
    fd.append("is_available", form.is_available);
    if (imageFile) fd.append("image", imageFile);
    try {
      if (editItem) { await updateMenuItem(editItem.id, fd); }
      else          { await createMenuItem(fd); }
      resetForm();
      fetchAll();
    } catch (err) {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      setFormError(msg || "Something went wrong");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this item?")) { await deleteMenuItem(id); fetchAll(); }
  };

  const handleOrderStatus = async (id, newStatus) => {
    await adminUpdateOrder(id, { status: newStatus });
    fetchAll();
  };

  // ── drag-and-drop ──────────────────────────────────────────────────────────
  const handleDragStart = (e, order) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ id: order.id, from: order.status }));
    e.dataTransfer.effectAllowed = "move";
    setDraggedId(order.id);
  };

  const handleDragEnd = () => { setDraggedId(null); setDropTarget(null); };

  const handleCardDragOver = (e, status, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = e.currentTarget.getBoundingClientRect();
    const idx  = e.clientY - rect.top < rect.height / 2 ? index : index + 1;
    setDropTarget({ status, index: idx });
  };

  const handleColumnDragOver = (e, status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const count = orders.filter((o) => o.status === status && isActive(o)).length;
    setDropTarget({ status, index: count });
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    setDraggedId(null);
    const target = dropTarget ?? {
      status: targetStatus,
      index:  orders.filter((o) => o.status === targetStatus && isActive(o)).length,
    };
    setDropTarget(null);
    try {
      const { id, from } = JSON.parse(e.dataTransfer.getData("text/plain"));
      let dragged = orders.find((o) => o.id === id);
      if (!dragged) return;
      dragged = { ...dragged, status: target.status };
      const targetArr = orders.filter((o) => o.id !== id && o.status === target.status && isActive(o));
      targetArr.splice(Math.min(target.index, targetArr.length), 0, dragged);
      const rest = orders.filter((o) => o.id !== id && (o.status !== target.status || !isActive(o)));
      setOrders([...rest, ...targetArr]);
      if (from !== target.status) {
        adminUpdateOrder(id, { status: target.status }).catch(() => fetchAll());
      }
    } catch {}
  };

  // ── early return ───────────────────────────────────────────────────────────
  if (loading) {
    return <div className="page-loader"><div className="loader-spinner" /> Loading restaurant panel…</div>;
  }

  const activeOrders = orders.filter(isActive);

  const TABS = [
    { key: "orders", label: "Live Orders",      icon: ClipboardText, badge: activeOrders.length || null },
    { key: "menu",   label: "Menu Management",  icon: ForkKnife,     badge: null },
  ];

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="restaurant-page">
      <div className="page-header">
        <h1>Restaurant Panel</h1>
        <p>Manage your kitchen orders and menu in real time</p>
      </div>

      {/* Tab bar */}
      <div className="tabs">
        {TABS.map(({ key, label, icon: Icon, badge }) => (
          <button key={key} className={`tab ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>
            <Icon size={15} weight={tab === key ? "fill" : "regular"} />
            {label}
            {badge != null && (
              <span style={{
                background: "var(--danger-light)", color: "var(--danger)",
                borderRadius: "var(--r-full)", padding: "1px 7px",
                fontSize: "0.6875rem", fontWeight: 700,
              }}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── LIVE ORDERS (Kanban) ─────────────────────────────────────────── */}
      {tab === "orders" && (
        <div className="section">
          {activeOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Package size={28} /></div>
              <p>No active orders right now. You're all caught up!</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {KANBAN_COLS.map((colStatus) => {
                const cfg          = STATUS_CONFIG[colStatus];
                const Icon         = cfg.icon;
                const colOrders    = orders.filter((o) => o.status === colStatus && isActive(o));
                return (
                  <div key={colStatus}>
                    {/* Column header */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8,
                      marginBottom: 12, padding: "10px 14px",
                      background: "var(--surface)", border: "1.5px solid var(--border)",
                      borderRadius: "var(--r-sm)", borderTop: `3px solid ${cfg.color}`,
                    }}>
                      <Icon size={16} style={{ color: cfg.color }} weight="fill" />
                      <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>{cfg.label}</span>
                      <span style={{
                        marginLeft: "auto", background: cfg.color + "20", color: cfg.color,
                        borderRadius: "var(--r-full)", padding: "2px 8px",
                        fontSize: "0.6875rem", fontWeight: 700,
                      }}>
                        {colOrders.length}
                      </span>
                    </div>

                    {/* Drop zone */}
                    <div
                      ref={(el) => { colRefs.current[colStatus] = el; }}
                      onDragOver={(e) => handleColumnDragOver(e, colStatus)}
                      onDrop={(e) => handleDrop(e, colStatus)}
                      style={{
                        display: "flex", flexDirection: "column", gap: 10, minHeight: 100,
                        borderRadius: "var(--r-sm)",
                        padding: draggedId ? 4 : 0,
                        background: dropTarget?.status === colStatus ? "var(--primary-light)" : "transparent",
                        outline: dropTarget?.status === colStatus ? "2px dashed var(--primary)" : "none",
                        outlineOffset: 2,
                        transition: "background 0.15s",
                      }}
                    >
                      {colOrders.length === 0 ? (
                        <div style={{
                          padding: 24, textAlign: "center", color: "var(--text-muted)",
                          fontSize: "0.8125rem", border: "1.5px dashed var(--border)",
                          borderRadius: "var(--r-sm)", background: "var(--surface)",
                        }}>
                          No orders
                        </div>
                      ) : (
                        <>
                          {dropTarget?.status === colStatus && dropTarget.index === 0 && (
                            <div style={{ height: 4, background: "var(--primary)", borderRadius: 2, margin: "0 4px" }} />
                          )}
                          {colOrders.map((o, idx) => (
                            <div key={o.id}>
                              <div
                                className="panel-order-card"
                                draggable
                                onDragStart={(e) => handleDragStart(e, o)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => handleCardDragOver(e, colStatus, idx)}
                                style={{
                                  borderTop: `3px solid ${cfg.color}`,
                                  cursor: "grab",
                                  opacity: draggedId === o.id ? 0.4 : 1,
                                  transition: "opacity 0.15s",
                                }}
                              >
                                <div className="panel-order-header">
                                  <span className="panel-order-id">#{o.id}</span>
                                  <span className={`badge ${cfg.badge}`}>{colStatus}</span>
                                </div>
                                <div className="panel-order-body">
                                  <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: 6 }}>
                                    {o.customer_name}
                                  </div>
                                  <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: 10 }}>
                                    {new Date(o.order_date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                  </div>
                                  <div style={{ fontWeight: 700, fontSize: "1.0625rem", color: "var(--primary-dark)" }}>
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
                                    {["Order Placed","Preparing","Out for Delivery","Delivered","Cancelled"].map((s) => (
                                      <option key={s}>{s}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              {dropTarget?.status === colStatus && dropTarget.index === idx + 1 && (
                                <div style={{ height: 4, background: "var(--primary)", borderRadius: 2, margin: 4 }} />
                              )}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MENU MANAGEMENT ──────────────────────────────────────────────── */}
      {tab === "menu" && (
        <div className="section">
          <div className="section-header">
            <h2>
              Menu Items
              <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-muted)", marginLeft: 6 }}>
                ({items.length} items)
              </span>
            </h2>
            <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowForm(true); }}>
              <Plus size={15} weight="bold" /> Add Item
            </button>
          </div>

          {/* ── Add / Edit form ───────────────────────────────────────── */}
          {showForm && (
            <div className="form-card">
              <h3>{editItem ? "Edit Menu Item" : "New Menu Item"}</h3>

              {formError && (
                <div style={{
                  background: "var(--danger-light)", color: "var(--danger)",
                  padding: "8px 12px", borderRadius: "var(--r-sm)",
                  marginBottom: 12, fontSize: "0.8125rem",
                }}>
                  {formError}
                </div>
              )}

              {/* Row 1: name */}
              <div className="form-group">
                <label>Item Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="e.g. Chicken Momo"
                />
              </div>

              {/* Row 2: cascading category → section */}
              <div className="form-row">
                <div className="form-group">
                  <label>Main Category</label>
                  <select
                    value={form.main_category}
                    onChange={(e) =>
                      setForm({ ...form, main_category: e.target.value, section: "" })
                    }
                    required
                  >
                    <option value="">Select main category…</option>
                    {mainCategories.map((mc) => (
                      <option key={mc.id} value={mc.id}>{mc.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Menu Section</label>
                  <select
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                    required
                    disabled={!form.main_category}
                  >
                    <option value="">
                      {form.main_category ? "Select section…" : "Select main category first"}
                    </option>
                    {filteredSections.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: price + availability */}
              <div className="form-row">
                <div className="form-group">
                  <label>Price (Rs)</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Availability</label>
                  <select
                    value={form.is_available}
                    onChange={(e) => setForm({ ...form, is_available: e.target.value === "true" })}
                  >
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="Describe this dish…"
                />
              </div>

              {/* Photo */}
              <div className="form-group">
                <label>Photo</label>
                {editItem?.image && !imageFile && (
                  <div style={{ marginBottom: 8 }}>
                    <img
                      src={editItem.image} alt={editItem.name}
                      style={{ width: 120, height: 80, objectFit: "cover",
                        borderRadius: "var(--r-sm)", border: "1.5px solid var(--border)" }}
                    />
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
                      Current image
                    </div>
                  </div>
                )}
                {imageFile && (
                  <div style={{ marginBottom: 8 }}>
                    <img
                      src={URL.createObjectURL(imageFile)} alt="Preview"
                      style={{ width: 120, height: 80, objectFit: "cover",
                        borderRadius: "var(--r-sm)", border: "1.5px solid var(--primary)" }}
                    />
                    <div style={{ fontSize: "0.75rem", color: "var(--primary)", marginTop: 4 }}>
                      New image
                    </div>
                  </div>
                )}
                <input
                  type="file" accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0] || null)}
                />
              </div>

              <div className="form-actions">
                <button className="btn btn-primary" onClick={handleSubmit}>
                  {editItem ? "Update" : "Create"}
                </button>
                <button className="btn btn-outline" onClick={resetForm}>Cancel</button>
              </div>
            </div>
          )}

          {/* ── Items table ────────────────────────────────────────────── */}
          <div style={{
            background: "var(--surface)", border: "1.5px solid var(--border)",
            borderRadius: "var(--r)", overflow: "hidden",
          }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category › Section</th>
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
                    </td>
                    <td style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                      {item.main_category_name && (
                        <span style={{ fontWeight: 600, color: "var(--txt)" }}>
                          {item.main_category_name}
                        </span>
                      )}
                      {item.section_name && (
                        <> › {item.section_name}</>
                      )}
                    </td>
                    <td style={{ fontWeight: 700, color: "var(--primary-dark)" }}>
                      Rs {item.price}
                    </td>
                    <td>
                      {item.is_available
                        ? <span className="badge badge-success"><CheckCircle size={12} weight="fill" /> Available</span>
                        : <span className="badge badge-danger"><XCircle size={12} weight="fill" /> Unavailable</span>}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
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
