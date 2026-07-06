import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getAdminOrders, adminUpdateOrder, getDashboard } from "../api/orders";
import {
  getMenuManage, createMenuItem, updateMenuItem, deleteMenuItem,
  getMenuCategories, getRecipes, createRecipe, deleteRecipe,
  getCategories, createCategory, updateCategory, deleteCategory,
} from "../api/menu";
import {
  getInventory, createInventoryItem, updateInventoryItem,
  deleteInventoryItem, restockInventoryItem, getInventoryStats,
} from "../api/inventory";
import { adminGetUsers, adminToggleUserActive, adminGetPayments } from "../api/accounts";
import {
  CheckCircle, XCircle, WarningCircle, Plus, PencilSimple,
  Trash, ClipboardText, ForkKnife, Package, Users,
  CurrencyDollar, UserSwitch, Tag, ArrowClockwise, Warning,
} from "@phosphor-icons/react";

const STATUS_COLORS = {
  "Order Placed":     "#f59e0b",
  Preparing:          "#3b82f6",
  "Out for Delivery": "#f25f3a",
  Delivered:          "#22c55e",
  Cancelled:          "#ef4444",
};
const PAYMENT_COLORS = { Pending: "#f59e0b", Paid: "#22c55e" };

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") || "orders");
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [invStats, setInvStats] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);

  // Menu form
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [editMenuItem, setEditMenuItem] = useState(null);
  const [menuForm, setMenuForm] = useState({ name: "", category: "", price: "", description: "", is_available: true });
  const [imageFile, setImageFile] = useState(null);

  // Category form
  const [showCatForm, setShowCatForm] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [catName, setCatName] = useState("");

  // Inventory form
  const [showInvForm, setShowInvForm] = useState(false);
  const [editInv, setEditInv] = useState(null);
  const [invForm, setInvForm] = useState({ name: "", quantity: "", unit: "", low_stock_limit: "" });

  // Restock modal
  const [restockItem, setRestockItem] = useState(null);
  const [restockQty, setRestockQty] = useState("");
  const [restockLoading, setRestockLoading] = useState(false);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      getAdminOrders(), getMenuManage(), getInventory(), getDashboard(),
      getMenuCategories(), adminGetUsers(), adminGetPayments(),
      getCategories(), getInventoryStats(),
    ])
      .then(([o, m, i, d, c, u, p, cats, stats]) => {
        setOrders(o.data); setMenuItems(m.data); setInventory(i.data);
        setDashboard(d.data); setCategories(c.data);
        setUsers(u.data); setPayments(p.data);
        setAllCategories(cats.data); setInvStats(stats.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t) setTab(t);
  }, [searchParams]);

  const switchTab = (t) => { setTab(t); setSearchParams({}); };

  // ── Menu handlers ────────────────────────────────────────────────
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
  const handleDeleteItem = async (id) => {
    if (confirm("Delete this menu item?")) { await deleteMenuItem(id); fetchAll(); }
  };

  // ── Category handlers ────────────────────────────────────────────
  const resetCatForm = () => { setShowCatForm(false); setEditCat(null); setCatName(""); };
  const handleEditCat = (cat) => { setEditCat(cat); setCatName(cat.name); setShowCatForm(true); };
  const handleCatSubmit = async () => {
    if (!catName.trim()) return;
    if (editCat) { await updateCategory(editCat.id, catName.trim()); }
    else { await createCategory(catName.trim()); }
    resetCatForm(); fetchAll();
  };
  const handleDeleteCat = async (id) => {
    if (confirm("Delete this category? Menu items in it will also be deleted.")) {
      await deleteCategory(id); fetchAll();
    }
  };

  // ── Order handlers ────────────────────────────────────────────────
  const handleOrderStatus = async (id, status) => {
    await adminUpdateOrder(id, { status }); fetchAll();
  };
  const handlePaymentStatus = async (id, payment_status) => {
    await adminUpdateOrder(id, { payment_status }); fetchAll();
  };

  // ── Inventory handlers ────────────────────────────────────────────
  const resetInvForm = () => {
    setInvForm({ name: "", quantity: "", unit: "", low_stock_limit: "" });
    setEditInv(null); setShowInvForm(false);
  };
  const handleEditInv = (item) => {
    setInvForm({ name: item.name, quantity: item.quantity, unit: item.unit, low_stock_limit: item.low_stock_limit });
    setEditInv(item); setShowInvForm(true);
  };
  const handleInvSubmit = async () => {
    const data = { ...invForm, quantity: Number(invForm.quantity), low_stock_limit: Number(invForm.low_stock_limit) };
    if (editInv) { await updateInventoryItem(editInv.id, data); }
    else { await createInventoryItem(data); }
    resetInvForm(); fetchAll();
  };
  const handleDeleteInventory = async (id) => {
    if (confirm("Delete this inventory item?")) { await deleteInventoryItem(id); fetchAll(); }
  };
  const handleRestock = async () => {
    if (!restockItem || !restockQty || Number(restockQty) <= 0) return;
    setRestockLoading(true);
    try {
      await restockInventoryItem(restockItem.id, Number(restockQty));
      setRestockItem(null); setRestockQty(""); fetchAll();
    } finally {
      setRestockLoading(false);
    }
  };

  const handleToggleUser = async (userId, currentActive) => {
    await adminToggleUserActive(userId, !currentActive); fetchAll();
  };

  if (loading) {
    return <div className="page-loader"><div className="loader-spinner" />Loading admin panel...</div>;
  }

  const lowStockItems = inventory.filter((i) => Number(i.quantity) <= Number(i.low_stock_limit));

  const TABS = [
    { key: "orders",     label: "Orders",     icon: ClipboardText,  count: orders.length },
    { key: "menu",       label: "Menu",        icon: ForkKnife,      count: menuItems.length },
    { key: "categories", label: "Categories",  icon: Tag,            count: allCategories.length },
    { key: "inventory",  label: "Inventory",   icon: Package,        count: inventory.length },
    { key: "users",      label: "Users",       icon: Users,          count: users.length },
    { key: "payments",   label: "Payments",    icon: CurrencyDollar, count: payments.length },
  ];

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Admin Panel</h1>
        <p>Manage orders, menu, categories, inventory, users, and payments</p>
      </div>

      {/* KPI Cards */}
      {dashboard && (
        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 24 }}>
          {[
            { label: "Customers",    value: dashboard.total_customers, icon: Users,          cls: "info" },
            { label: "Total Orders", value: dashboard.total_orders,    icon: ClipboardText,  cls: "" },
            { label: "Revenue",      value: `Rs ${(dashboard.total_revenue||0).toLocaleString()}`, icon: CurrencyDollar, cls: "success" },
            { label: "Low Stock",    value: dashboard.low_stock_items, icon: Package,        cls: "danger" },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div className="stat-card" key={card.label}>
                <div className="stat-card-header">
                  <div>
                    <div className="stat-label">{card.label}</div>
                    <div className="stat-value" style={{ fontSize: "1.5rem" }}>{card.value}</div>
                  </div>
                  <div className={`stat-icon-wrap ${card.cls}`}><Icon size={20} weight="duotone" /></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Low-stock alert banner */}
      {lowStockItems.length > 0 && (
        <div style={{
          background: "var(--danger-l)", border: "1.5px solid var(--danger-b)",
          borderRadius: "var(--r-sm)", padding: "12px 16px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        }}>
          <Warning size={18} weight="fill" style={{ color: "var(--danger)", flexShrink: 0 }} />
          <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--danger)" }}>
            Low stock alert:
          </span>
          <span style={{ fontSize: "0.875rem", color: "var(--danger)", flex: 1 }}>
            {lowStockItems.map((i) => i.name).join(", ")}
          </span>
          <button className="btn btn-xs btn-danger" onClick={() => switchTab("inventory")}>
            View Inventory
          </button>
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
            }}>{count}</span>
          </button>
        ))}
      </div>

      {/* ── ORDERS TAB ─────────────────────────────────────────────── */}
      {tab === "orders" && (
        <div className="section">
          <div className="section-header">
            <h2>All Orders</h2>
            <span className="text-muted fs-sm">{orders.length} total</span>
          </div>
          <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
            <div className="table-responsive">
              <table className="table">
                <thead><tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Status</th><th>Payment</th><th>Date</th></tr></thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td><strong>#{o.id}</strong></td>
                      <td>{o.customer_name}</td>
                      <td style={{ fontWeight: 600, color: "var(--text)" }}>Rs {o.total_amount}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLORS[o.status]||"#6b7280", display: "inline-block", flexShrink: 0 }} />
                          <select value={o.status} onChange={(e) => handleOrderStatus(o.id, e.target.value)} className="form-select-sm">
                            {["Order Placed","Preparing","Out for Delivery","Delivered","Cancelled"].map((s) => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: PAYMENT_COLORS[o.payment_status]||"#6b7280", display: "inline-block", flexShrink: 0 }} />
                          <select value={o.payment_status} onChange={(e) => handlePaymentStatus(o.id, e.target.value)} className="form-select-sm">
                            <option>Pending</option><option>Paid</option>
                          </select>
                        </div>
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>
                        {new Date(o.order_date).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MENU TAB ───────────────────────────────────────────────── */}
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
                  <input value={menuForm.name} onChange={(e) => setMenuForm({...menuForm,name:e.target.value})} placeholder="e.g. Chicken Momo" required />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={menuForm.category} onChange={(e) => setMenuForm({...menuForm,category:e.target.value})} required>
                    <option value="">Select category...</option>
                    {allCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price (Rs)</label>
                  <input type="number" step="0.01" min="0" value={menuForm.price} onChange={(e) => setMenuForm({...menuForm,price:e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Availability</label>
                  <select value={menuForm.is_available} onChange={(e) => setMenuForm({...menuForm,is_available:e.target.value==="true"})}>
                    <option value="true">Available</option><option value="false">Unavailable</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={menuForm.description} onChange={(e) => setMenuForm({...menuForm,description:e.target.value})} rows={2} />
              </div>
              <div className="form-group">
                <label>Photo</label>
                {editMenuItem?.image && !imageFile && (
                  <div style={{ marginBottom: 8 }}>
                    <img src={editMenuItem.image} alt={editMenuItem.name} style={{ width:120,height:80,objectFit:"cover",borderRadius:"var(--r-sm)",border:"1.5px solid var(--border)" }} />
                    <div style={{ fontSize:"0.75rem",color:"var(--text-muted)",marginTop:4 }}>Current image</div>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0]||null)} />
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={handleMenuSubmit}>{editMenuItem?"Update Item":"Create Item"}</button>
                <button className="btn btn-outline" onClick={resetMenuForm}>Cancel</button>
              </div>
            </div>
          )}
          <div style={{ background:"var(--surface)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",overflow:"hidden" }}>
            <div className="table-responsive">
              <table className="table">
                <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {menuItems.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.name}</strong></td>
                      <td><span className="badge badge-secondary">{item.category_name||item.category}</span></td>
                      <td style={{ fontWeight:600,color:"var(--text)" }}>Rs {item.price}</td>
                      <td>
                        {item.is_available
                          ? <span className="badge badge-success"><CheckCircle size={12} weight="fill"/> Available</span>
                          : <span className="badge badge-danger"><XCircle size={12} weight="fill"/> Unavailable</span>}
                      </td>
                      <td>
                        <div style={{ display:"flex",gap:6 }}>
                          <button className="btn btn-xs btn-outline" onClick={() => handleEditMenu(item)}><PencilSimple size={13}/> Edit</button>
                          <button className="btn btn-xs btn-danger" onClick={() => handleDeleteItem(item.id)}><Trash size={13}/> Delete</button>
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

      {/* ── CATEGORIES TAB ─────────────────────────────────────────── */}
      {tab === "categories" && (
        <div className="section">
          <div className="section-header">
            <h2>Menu Categories</h2>
            <button className="btn btn-primary btn-sm" onClick={() => { resetCatForm(); setShowCatForm(true); }}>
              <Plus size={15} weight="bold"/> Add Category
            </button>
          </div>
          {showCatForm && (
            <div className="form-card">
              <h3>{editCat ? "Edit Category" : "New Category"}</h3>
              <div className="form-group">
                <label>Category Name</label>
                <input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="e.g. Biryani" required autoFocus />
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={handleCatSubmit}>{editCat?"Update":"Create"}</button>
                <button className="btn btn-outline" onClick={resetCatForm}>Cancel</button>
              </div>
            </div>
          )}
          <div style={{ background:"var(--surface)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",overflow:"hidden" }}>
            <div className="table-responsive">
              <table className="table">
                <thead><tr><th>Category Name</th><th>Items</th><th>Actions</th></tr></thead>
                <tbody>
                  {allCategories.map((cat) => {
                    const itemCount = menuItems.filter((m) => m.category === cat.id || m.category_name === cat.name).length;
                    return (
                      <tr key={cat.id}>
                        <td><strong>{cat.name}</strong></td>
                        <td><span className="badge badge-secondary">{itemCount} item{itemCount!==1?"s":""}</span></td>
                        <td>
                          <div style={{ display:"flex",gap:6 }}>
                            <button className="btn btn-xs btn-outline" onClick={() => handleEditCat(cat)}><PencilSimple size={13}/> Edit</button>
                            <button className="btn btn-xs btn-danger" onClick={() => handleDeleteCat(cat.id)}><Trash size={13}/> Delete</button>
                          </div>
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

      {/* ── INVENTORY TAB ──────────────────────────────────────────── */}
      {tab === "inventory" && (
        <div className="section">
          <div className="section-header">
            <h2>Inventory</h2>
            <div style={{ display:"flex",gap:10,alignItems:"center" }}>
              {lowStockItems.length > 0 && (
                <span className="badge badge-danger"><WarningCircle size={12} weight="fill"/> {lowStockItems.length} low stock</span>
              )}
              <button className="btn btn-primary btn-sm" onClick={() => { resetInvForm(); setShowInvForm(true); }}>
                <Plus size={15} weight="bold"/> Add Item
              </button>
            </div>
          </div>

          {/* Restock modal */}
          {restockItem && (
            <div style={{
              position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:9000,
              display:"flex",alignItems:"center",justifyContent:"center",
            }}>
              <div style={{ background:"var(--surface)",borderRadius:"var(--r)",padding:28,width:360,boxShadow:"var(--sh-lg)" }}>
                <h3 style={{ marginBottom:16,fontFamily:"var(--fh)" }}>Restock: {restockItem.name}</h3>
                <p style={{ fontSize:"0.875rem",color:"var(--txt-2)",marginBottom:14 }}>
                  Current stock: <strong>{restockItem.quantity} {restockItem.unit}</strong>
                </p>
                <div className="form-group">
                  <label>Quantity to Add ({restockItem.unit})</label>
                  <input
                    type="number" min="0.01" step="0.01"
                    value={restockQty}
                    onChange={(e) => setRestockQty(e.target.value)}
                    placeholder="e.g. 10"
                    autoFocus
                  />
                </div>
                <div className="form-actions">
                  <button className="btn btn-success" onClick={handleRestock} disabled={restockLoading}>
                    {restockLoading ? "Restocking…" : <><ArrowClockwise size={14}/> Restock</>}
                  </button>
                  <button className="btn btn-outline" onClick={() => { setRestockItem(null); setRestockQty(""); }}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {showInvForm && (
            <div className="form-card">
              <h3>{editInv ? "Edit Inventory Item" : "Add Inventory Item"}</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Item Name</label>
                  <input value={invForm.name} onChange={(e) => setInvForm({...invForm,name:e.target.value})} required placeholder="e.g. Tomato" />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <input value={invForm.unit} onChange={(e) => setInvForm({...invForm,unit:e.target.value})} required placeholder="kg, ltr, pcs" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity</label>
                  <input type="number" min="0" step="0.01" value={invForm.quantity} onChange={(e) => setInvForm({...invForm,quantity:e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Low Stock Limit</label>
                  <input type="number" min="1" value={invForm.low_stock_limit} onChange={(e) => setInvForm({...invForm,low_stock_limit:e.target.value})} required />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={handleInvSubmit}>{editInv?"Update":"Create"}</button>
                <button className="btn btn-outline" onClick={resetInvForm}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ background:"var(--surface)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",overflow:"hidden" }}>
            <div className="table-responsive">
              <table className="table">
                <thead><tr><th>Item</th><th>Quantity</th><th>Unit</th><th>Low Stock Limit</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {inventory.map((item) => {
                    const isLow = Number(item.quantity) <= Number(item.low_stock_limit);
                    return (
                      <tr key={item.id}>
                        <td><strong>{item.name}</strong></td>
                        <td style={{ fontWeight:600,color:isLow?"var(--danger)":"var(--text)" }}>{item.quantity}</td>
                        <td style={{ color:"var(--text-muted)" }}>{item.unit}</td>
                        <td style={{ color:"var(--text-muted)" }}>{item.low_stock_limit}</td>
                        <td>
                          {isLow
                            ? <span className="badge badge-danger"><WarningCircle size={12} weight="fill"/> Low Stock</span>
                            : <span className="badge badge-success"><CheckCircle size={12} weight="fill"/> In Stock</span>}
                        </td>
                        <td>
                          <div style={{ display:"flex",gap:6 }}>
                            <button className="btn btn-xs btn-success" onClick={() => { setRestockItem(item); setRestockQty(""); }} title="Add stock">
                              <ArrowClockwise size={13}/> Restock
                            </button>
                            <button className="btn btn-xs btn-outline" onClick={() => handleEditInv(item)}><PencilSimple size={13}/> Edit</button>
                            <button className="btn btn-xs btn-danger" onClick={() => handleDeleteInventory(item.id)}><Trash size={13}/></button>
                          </div>
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

      {/* ── USERS TAB ──────────────────────────────────────────────── */}
      {tab === "users" && (
        <div className="section">
          <div className="section-header">
            <h2>All Users</h2>
            <span className="text-muted fs-sm">{users.length} registered</span>
          </div>
          <div style={{ background:"var(--surface)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",overflow:"hidden" }}>
            <div className="table-responsive">
              <table className="table">
                <thead><tr><th>Username</th><th>Email</th><th>Name</th><th>Phone</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td><strong>{u.username}</strong></td>
                      <td style={{ color:"var(--text-muted)" }}>{u.email}</td>
                      <td>{u.customer?.name||"—"}</td>
                      <td style={{ color:"var(--text-muted)" }}>{u.customer?.phone||"—"}</td>
                      <td>{u.is_admin ? <span className="badge badge-primary">Admin</span> : <span className="badge badge-secondary">Customer</span>}</td>
                      <td>{u.is_active===false ? <span className="badge badge-danger">Disabled</span> : <span className="badge badge-success">Active</span>}</td>
                      <td>
                        <button className="btn btn-xs btn-outline" onClick={() => handleToggleUser(u.id, u.is_active)}>
                          <UserSwitch size={13}/> {u.is_active===false?"Enable":"Disable"}
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

      {/* ── PAYMENTS TAB ───────────────────────────────────────────── */}
      {tab === "payments" && (
        <div className="section">
          <div className="section-header">
            <h2>Payment Transactions</h2>
            <span className="text-muted fs-sm">{payments.filter((p)=>p.payment_status==="Paid").length} paid</span>
          </div>
          <div style={{ background:"var(--surface)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",overflow:"hidden" }}>
            <div className="table-responsive">
              <table className="table">
                <thead><tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td><strong>#{p.id}</strong></td>
                      <td>{p.customer__name}</td>
                      <td style={{ fontWeight:600 }}>Rs {p.total_amount}</td>
                      <td style={{ color:"var(--text-muted)" }}>{p.payment_method}</td>
                      <td>
                        {p.payment_status==="Paid"
                          ? <span className="badge badge-success">Paid</span>
                          : <span className="badge badge-warning">Pending</span>}
                      </td>
                      <td style={{ color:"var(--text-muted)",fontSize:"0.8125rem" }}>
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
