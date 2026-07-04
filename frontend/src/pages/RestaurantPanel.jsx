import { useEffect, useState, useRef } from "react";
import { getMenuManage, createMenuItem, updateMenuItem, deleteMenuItem, getMenuCategories, getRecipes, createRecipe, deleteRecipe } from "../api/menu";
import { getAdminOrders, adminUpdateOrder } from "../api/orders";
import { getInventory } from "../api/inventory";
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
  const [formError, setFormError] = useState("");
  const [inventoryItems, setInventoryItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [newRecipe, setNewRecipe] = useState({ inventory_item: "", quantity_required: "" });
  const [draggedId, setDraggedId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null); // { status, index }
  const colRefs = useRef({});

  const handleDragStart = (e, order) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ id: order.id, from: order.status }));
    e.dataTransfer.effectAllowed = "move";
    setDraggedId(order.id);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDropTarget(null);
  };

  const getDropIndex = (e, cardEl, currentIndex, total) => {
    const rect = cardEl.getBoundingClientRect();
    const y = e.clientY - rect.top;
    if (y < rect.height / 2) return currentIndex;
    return currentIndex + 1;
  };

  const handleCardDragOver = (e, status, index, total) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const idx = getDropIndex(e, e.currentTarget, index, total);
    setDropTarget({ status, index: idx });
  };

  const handleColumnDragOver = (e, status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const count = orders.filter((o) => o.status === status && !["Delivered", "Cancelled"].includes(o.status)).length;
    setDropTarget({ status, index: count });
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    setDraggedId(null);
    const activeFilter = (o) => !["Delivered", "Cancelled"].includes(o.status);
    const target = dropTarget || {
      status: targetStatus,
      index: orders.filter((o) => o.status === targetStatus && activeFilter(o)).length,
    };
    setDropTarget(null);
    try {
      const { id, from } = JSON.parse(e.dataTransfer.getData("text/plain"));
      let item = orders.find((o) => o.id === id);
      if (!item) return;
      item = { ...item, status: target.status };
      let targetArr = orders.filter((o) => o.id !== id && o.status === target.status && activeFilter(o));
      const insertAt = Math.min(target.index, targetArr.length);
      targetArr.splice(insertAt, 0, item);
      const rest = orders.filter((o) => (o.id !== id && (o.status !== target.status || !activeFilter(o))));
      setOrders([...rest, ...targetArr]);
      if (from !== target.status) {
        adminUpdateOrder(id, { status: target.status }).catch(() => fetchAll());
      }
    } catch {}
  };

  const fetchAll = () => {
    setLoading(true);
    Promise.all([getMenuManage(), getAdminOrders(), getMenuCategories(), getInventory(), getRecipes()])
      .then(([m, o, c, inv, r]) => { setItems(m.data); setOrders(o.data); setCategories(c.data); setInventoryItems(inv.data); setRecipes(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => {
    setForm({ name: "", category: "", price: "", description: "", is_available: true });
    setEditItem(null); setShowForm(false); setImageFile(null); setFormError("");
  };

  const handleEdit = (item) => {
    setForm({ name: item.name, category: item.category, price: item.price, description: item.description || "", is_available: item.is_available });
    setEditItem(item); setShowForm(true);
  };

  const handleSubmit = async () => {
    setFormError("");
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (imageFile) fd.append("image", imageFile);
    try {
      if (editItem) { await updateMenuItem(editItem.id, fd); }
      else { await createMenuItem(fd); }
      resetForm(); fetchAll();
    } catch (err) {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      setFormError(msg || "Something went wrong");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this item?")) { await deleteMenuItem(id); fetchAll(); }
  };

  const handleAddRecipe = async () => {
    if (!newRecipe.inventory_item || !newRecipe.quantity_required || !editItem) return;
    await createRecipe({ menu_item: editItem.id, inventory_item: Number(newRecipe.inventory_item), quantity_required: Number(newRecipe.quantity_required) });
    setNewRecipe({ inventory_item: "", quantity_required: "" });
    const r = await getRecipes();
    setRecipes(r.data);
  };

  const handleRemoveRecipe = async (recipeId) => {
    await deleteRecipe(recipeId);
    const r = await getRecipes();
    setRecipes(r.data);
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

                    <div
                      onDragOver={(e) => handleColumnDragOver(e, status)}
                      onDrop={(e) => handleDrop(e, status)}
                      ref={(el) => { colRefs.current[status] = el; }}
                      style={{
                        display: "flex", flexDirection: "column", gap: "10px", minHeight: "100px",
                        transition: "background 0.15s", borderRadius: "var(--r-sm)",
                        padding: draggedId ? "4px" : 0,
                        background: dropTarget?.status === status ? "var(--primary-light)" : "transparent",
                        outline: dropTarget?.status === status ? `2px dashed var(--primary)` : "none",
                        outlineOffset: "2px",
                      }}
                    >
                      {statusOrders.length === 0 ? (
                        dropTarget?.status === status && dropTarget.index === 0 ? (
                          <div style={{ height: "4px", background: "var(--primary)", borderRadius: "2px", margin: "0 4px" }} />
                        ) : (
                          <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)",
                            fontSize: "0.8125rem", border: "1.5px dashed var(--border)", borderRadius: "var(--r-sm)",
                            background: "var(--surface)" }}>
                            No orders
                          </div>
                        )
                      ) : (
                        <>
                          {dropTarget?.status === status && dropTarget.index === 0 && (
                            <div style={{ height: "4px", background: "var(--primary)", borderRadius: "2px", margin: "0 4px" }} />
                          )}
                          {statusOrders.map((o, idx) => (
                            <div key={o.id}>
                              <div
                                className="panel-order-card"
                                draggable
                                onDragStart={(e) => handleDragStart(e, o)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => handleCardDragOver(e, status, idx, statusOrders.length)}
                                style={{
                                  borderTop: `3px solid ${cfg.color}`,
                                  cursor: "grab",
                                  opacity: draggedId === o.id ? 0.4 : 1,
                                  transition: "opacity 0.15s",
                                }}
                              >
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
                              {dropTarget?.status === status && dropTarget.index === idx + 1 && (
                                <div style={{ height: "4px", background: "var(--primary)", borderRadius: "2px", margin: "4px" }} />
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
              {formError && (
                <div style={{ background: "var(--danger-light)", color: "var(--danger)", padding: "8px 12px",
                  borderRadius: "var(--r-sm)", marginBottom: "12px", fontSize: "0.8125rem" }}>
                  {formError}
                </div>
              )}
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
                {editItem?.image && !imageFile && (
                  <div style={{ marginBottom: "8px" }}>
                    <img src={editItem.image} alt={editItem.name}
                      style={{ width: "120px", height: "80px", objectFit: "cover", borderRadius: "var(--r-sm)",
                        border: "1.5px solid var(--border)" }} />
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>Current image</div>
                  </div>
                )}
                {imageFile && (
                  <div style={{ marginBottom: "8px" }}>
                    <img src={URL.createObjectURL(imageFile)} alt="Preview"
                      style={{ width: "120px", height: "80px", objectFit: "cover", borderRadius: "var(--r-sm)",
                        border: "1.5px solid var(--primary)" }} />
                    <div style={{ fontSize: "0.75rem", color: "var(--primary)", marginTop: "4px" }}>New image</div>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0] || null)} />
              </div>
              {editItem && (
                <div className="form-group" style={{ borderTop: "1.5px solid var(--border)", paddingTop: "16px", marginTop: "8px" }}>
                  <label style={{ fontWeight: 700, fontSize: "0.875rem" }}>Recipe Ingredients</label>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "10px" }}>
                    Link this menu item to inventory items so stock is auto-deducted when orders are prepared.
                  </div>
                  {recipes.filter((r) => r.menu_item === editItem.id).map((r) => (
                    <div key={r.id} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <span style={{ flex: 1, fontSize: "0.8125rem" }}>{r.inventory_name} — x{r.quantity_required}</span>
                      <button className="btn btn-xs btn-danger" onClick={() => handleRemoveRecipe(r.id)}>
                        <Trash size={11} />
                      </button>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "6px" }}>
                    <select
                      value={newRecipe.inventory_item}
                      onChange={(e) => setNewRecipe({ ...newRecipe, inventory_item: e.target.value })}
                      style={{ flex: 1, padding: "6px 8px", fontSize: "0.8125rem", borderRadius: "var(--r-sm)", border: "1.5px solid var(--border)", background: "var(--surface)" }}
                    >
                      <option value="">Select ingredient...</option>
                      {inventoryItems.map((inv) => (
                        <option key={inv.id} value={inv.id}>{inv.name} ({inv.quantity} {inv.unit})</option>
                      ))}
                    </select>
                    <input
                      type="number" min="0.01" step="0.01" placeholder="Qty"
                      value={newRecipe.quantity_required}
                      onChange={(e) => setNewRecipe({ ...newRecipe, quantity_required: e.target.value })}
                      style={{ width: "60px", padding: "6px 8px", fontSize: "0.8125rem", borderRadius: "var(--r-sm)", border: "1.5px solid var(--border)", background: "var(--surface)" }}
                    />
                    <button className="btn btn-xs btn-primary" onClick={handleAddRecipe}>
                      <Plus size={12} /> Add
                    </button>
                  </div>
                </div>
              )}
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
                  <th>Recipe</th>
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
                    <td style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {recipes.filter((r) => r.menu_item === item.id).length > 0 ? (
                        <span>{recipes.filter((r) => r.menu_item === item.id).length} ingredients</span>
                      ) : (
                        <span style={{ opacity: 0.5 }}>—</span>
                      )}
                    </td>
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
