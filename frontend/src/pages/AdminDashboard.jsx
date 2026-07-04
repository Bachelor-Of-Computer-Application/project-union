import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getAdminOrders, adminUpdateOrder, getDashboard } from "../api/orders";
import { getMenuManage, createMenuItem, updateMenuItem, deleteMenuItem, getMenuCategories } from "../api/menu";
import { getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem } from "../api/inventory";
import { adminGetUsers, adminToggleUserActive, adminGetPayments } from "../api/accounts";
import {
  CheckCircle, XCircle, WarningCircle, Plus, PencilSimple,
  Trash, ClipboardText, ForkKnife, Package, Users,
  CurrencyDollar, UserSwitch,
} from "@phosphor-icons/react";

const STATUS_BADGE = {
  "Order Placed":     "badge-warning",
  Preparing:          "badge-info",
  "Out for Delivery": "badge-primary",
  Delivered:          "badge-success",
  Cancelled:          "badge-danger",
};

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") || "orders");
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [editMenuItem, setEditMenuItem] = useState(null);
  const [menuForm, setMenuForm] = useState({ name: "", category: "", price: "", description: "", is_available: true });
  const [imageFile, setImageFile] = useState(null);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([getAdminOrders(), getMenuManage(), getInventory(), getDashboard(), getMenuCategories(), adminGetUsers(), adminGetPayments()])
      .then(([o, m, i, d, c, u, p]) => {
        setOrders(o.data); setMenuItems(m.data); setInventory(i.data);
        setDashboard(d.data); setCategories(c.data);
        setUsers(u.data); setPayments(p.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleToggleUser = async (userId, currentActive) => {
    await adminToggleUserActive(userId, !currentActive);
    fetchAll();
  };

  const switchTab = (t) => { setTab(t); setSearchParams({}); };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t) setTab(t);
  }, [searchParams]);

  const resetMenuForm = () => {
    setMenuForm({ name: "", category: "", price: "", description: "", is_available: true });
    setEditMenuItem(null); setShowMenuForm(false); setImageFile(null);
  };

  const handleEditMenu = (item) => {
    setMenuForm({ name: item.name, category: item.category, price: item.price, description: item.description || "", is_available: item.is_available });
    setEditMenuItem(item); setShowMenuForm(true);
  };

  const handleMenuSubmit = async () => {
    const fd = new FormData();
    Object.entries(menuForm).forEach(([k, v]) => fd.append(k, v));
    if (imageFile) fd.append("image", imageFile);
    if (editMenuItem) { await updateMenuItem(editMenuItem.id, fd); }
    else { await createMenuItem(fd); }
    resetMenuForm(); fetchAll();
  };

  const handleOrderStatus = async (id, status) => {
    await adminUpdateOrder(id, { status }); fetchAll();
  };

  const handlePaymentStatus = async (id, payment_status) => {
    await adminUpdateOrder(id, { payment_status }); fetchAll();
  };

  const handleDeleteItem = async (id) => {
    if (confirm("Delete this menu item?")) { await deleteMenuItem(id); fetchAll(); }
  };

  const handleDeleteInventory = async (id) => {
    if (confirm("Delete this inventory item?")) { await deleteInventoryItem(id); fetchAll(); }
  };

  if (loading) {
    return <div className="page-loader"><div className="loader-spinner" />Loading admin panel...</div>;
  }

  const TABS = [
    { key: "orders",    label: "Orders",    icon: ClipboardText, count: orders.length },
    { key: "menu",      label: "Menu",      icon: ForkKnife,     count: menuItems.length },
    { key: "inventory", label: "Inventory", icon: Package,       count: inventory.length },
    { key: "users",     label: "Users",     icon: Users,         count: users.length },
    { key: "payments",  label: "Payments",  icon: CurrencyDollar,count: payments.length },
  ];

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Admin Panel</h1>
        <p>Manage orders, menu items, and inventory</p>
      </div>

      {dashboard && (
        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: "24px" }}>
          {[
            { label: "Customers",   value: dashboard.total_customers,             icon: Users,          cls: "info" },
            { label: "Total Orders",value: dashboard.total_orders,                icon: ClipboardText,  cls: "" },
            { label: "Revenue",     value: `Rs ${(dashboard.total_revenue || 0).toLocaleString()}`, icon: CurrencyDollar, cls: "success" },
            { label: "Low Stock",   value: dashboard.low_stock_items,             icon: Package,        cls: "danger" },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div className="stat-card" key={card.label}>
                <div className="stat-card-header">
                  <div>
                    <div className="stat-label">{card.label}</div>
                    <div className="stat-value" style={{ fontSize: "1.5rem" }}>{card.value}</div>
                  </div>
                  <div className={`stat-icon-wrap ${card.cls}`}>
                    <Icon size={20} weight="duotone" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(({ key, label, icon: Icon, count }) => (
          <button key={key} className={`tab ${tab === key ? "active" : ""}`} onClick={() => switchTab(key)}>
            <Icon size={15} weight={tab === key ? "fill" : "regular"} />
            {label}
            <span style={{
              background: tab === key ? "var(--primary-light)" : "var(--surface-3)",
              color: tab === key ? "var(--primary)" : "var(--text-muted)",
              borderRadius: "var(--r-full)", padding: "1px 7px", fontSize: "0.6875rem", fontWeight: 700,
            }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ORDERS */}
      {tab === "orders" && (
        <div className="section">
          <div className="section-header">
            <h2>All Orders</h2>
            <span className="text-muted" style={{ fontSize: "0.875rem" }}>{orders.length} total</span>
          </div>
          <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Order Status</th>
                    <th>Payment</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td><strong>#{o.id}</strong></td>
                      <td>{o.customer_name}</td>
                      <td style={{ fontWeight: 600, color: "var(--text)" }}>Rs {o.total_amount}</td>
                      <td>
                        <select
                          value={o.status}
                          onChange={(e) => handleOrderStatus(o.id, e.target.value)}
                          className="form-select-sm"
                        >
                          {["Order Placed", "Preparing", "Out for Delivery", "Delivered", "Cancelled"].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          value={o.payment_status}
                          onChange={(e) => handlePaymentStatus(o.id, e.target.value)}
                          className="form-select-sm"
                        >
                          <option>Pending</option>
                          <option>Paid</option>
                        </select>
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>
                        {new Date(o.order_date).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MENU */}
      {tab === "menu" && (
        <div className="section">
          <div className="section-header">
            <h2>Menu Items</h2>
            <button className="btn btn-primary btn-sm" onClick={() => { resetMenuForm(); setShowMenuForm(true); }}>
              <Plus size={15} weight="bold" /> Add Item
            </button>
          </div>

          {showMenuForm && (
            <div className="form-card">
              <h3>{editMenuItem ? "Edit Menu Item" : "Add New Menu Item"}</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Item Name</label>
                  <input value={menuForm.name} onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })} required placeholder="e.g. Chicken Momo" />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={menuForm.category} onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })} required>
                    <option value="">Select category...</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price (Rs)</label>
                  <input type="number" step="0.01" min="0" value={menuForm.price} onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })} required placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>Availability</label>
                  <select value={menuForm.is_available} onChange={(e) => setMenuForm({ ...menuForm, is_available: e.target.value === "true" })}>
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={menuForm.description} onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })} rows={2} placeholder="Briefly describe this item..." />
              </div>
              <div className="form-group">
                <label>Photo</label>
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0] || null)} />
                <div className="form-hint">JPG or PNG, max 5MB. Recommended: 800×600px.</div>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={handleMenuSubmit}>
                  {editMenuItem ? "Update Item" : "Create Item"}
                </button>
                <button className="btn btn-outline" onClick={resetMenuForm}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {menuItems.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.name}</strong></td>
                      <td>
                        <span className="badge badge-secondary">{item.category_name || item.category}</span>
                      </td>
                      <td style={{ fontWeight: 600, color: "var(--text)" }}>Rs {item.price}</td>
                      <td>
                        {item.is_available
                          ? <span className="badge badge-success"><CheckCircle size={12} weight="fill" /> Available</span>
                          : <span className="badge badge-danger"><XCircle size={12} weight="fill" /> Unavailable</span>}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button className="btn btn-xs btn-outline" onClick={() => handleEditMenu(item)}>
                            <PencilSimple size={13} /> Edit
                          </button>
                          <button className="btn btn-xs btn-danger" onClick={() => handleDeleteItem(item.id)}>
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
        </div>
      )}

      {/* INVENTORY */}
      {tab === "inventory" && (
        <div className="section">
          <div className="section-header">
            <h2>Inventory</h2>
            <span className="text-muted" style={{ fontSize: "0.875rem" }}>
              {inventory.filter((i) => i.quantity <= i.low_stock_limit).length} items low on stock
            </span>
          </div>
          <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                    <th>Low Stock Limit</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => {
                    const isLow = item.quantity <= item.low_stock_limit;
                    return (
                      <tr key={item.id}>
                        <td><strong>{item.name}</strong></td>
                        <td style={{ fontWeight: 600, color: isLow ? "var(--danger)" : "var(--text)" }}>
                          {item.quantity}
                        </td>
                        <td style={{ color: "var(--text-muted)" }}>{item.unit}</td>
                        <td style={{ color: "var(--text-muted)" }}>{item.low_stock_limit}</td>
                        <td>
                          {isLow
                            ? <span className="badge badge-danger"><WarningCircle size={12} weight="fill" /> Low Stock</span>
                            : <span className="badge badge-success"><CheckCircle size={12} weight="fill" /> In Stock</span>}
                        </td>
                        <td>
                          <button className="btn btn-xs btn-danger" onClick={() => handleDeleteInventory(item.id)}>
                            <Trash size={13} /> Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* USERS */}
      {tab === "users" && (
        <div className="section">
          <div className="section-header">
            <h2>All Users</h2>
            <span className="text-muted" style={{ fontSize: "0.875rem" }}>{users.length} registered</span>
          </div>
          <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td><strong>{u.username}</strong></td>
                      <td style={{ color: "var(--text-muted)" }}>{u.email}</td>
                      <td>{u.customer?.name || "—"}</td>
                      <td style={{ color: "var(--text-muted)" }}>{u.customer?.phone || "—"}</td>
                      <td>
                        {u.is_admin
                          ? <span className="badge badge-primary">Admin</span>
                          : <span className="badge badge-secondary">Customer</span>}
                      </td>
                      <td>
                        {u.is_active === false
                          ? <span className="badge badge-danger">Disabled</span>
                          : <span className="badge badge-success">Active</span>}
                      </td>
                      <td>
                        <button
                          className="btn btn-xs btn-outline"
                          onClick={() => handleToggleUser(u.id, u.is_active)}
                        >
                          <UserSwitch size={13} /> {u.is_active === false ? "Enable" : "Disable"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENTS */}
      {tab === "payments" && (
        <div className="section">
          <div className="section-header">
            <h2>Payment Transactions</h2>
            <span className="text-muted" style={{ fontSize: "0.875rem" }}>
              {payments.filter((p) => p.payment_status === "Paid").length} paid
            </span>
          </div>
          <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td><strong>#{p.id}</strong></td>
                      <td>{p.customer__name}</td>
                      <td style={{ fontWeight: 600 }}>Rs {p.total_amount}</td>
                      <td style={{ color: "var(--text-muted)" }}>{p.payment_method}</td>
                      <td>
                        {p.payment_status === "Paid"
                          ? <span className="badge badge-success">Paid</span>
                          : <span className="badge badge-warning">Pending</span>}
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>
                        {new Date(p.order_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
