import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { getAdminOrders, adminUpdateOrder, getDashboard } from "../api/orders";
import {
  getMenuManage,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getMenuCategories,
  adminGetMainCategories,
  adminCreateMainCategory,
  adminUpdateMainCategory,
  adminDeleteMainCategory,
} from "../api/menu";
import {
  adminGetUsers,
  adminToggleUserActive,
  adminGetPayments,
  adminGetDeliveryMen,
  adminCreateDeliveryMan,
  adminUpdateDeliveryMan,
  adminDeleteDeliveryMan,
} from "../api/accounts";
import {
  CheckCircle, XCircle, Plus, PencilSimple,
  Trash, ClipboardText, ForkKnife, Users,
  CurrencyDollar, UserSwitch, Tag, Truck,
  Package, Fire, ArrowRight, MapPin, ArrowsClockwise,
} from "@phosphor-icons/react";

const STATUS_COLORS = {
  "Order Placed":     "#f59e0b",
  Preparing:          "#3b82f6",
  Ready:              "#8b5cf6",
  "Out for Delivery": "#f25f3a",
  Delivered:          "#22c55e",
  Cancelled:          "#ef4444",
};
const PAYMENT_COLORS = { Pending: "#f59e0b", Paid: "#22c55e" };

// Tracking steps for the live view
const TRACK_STEPS = ["Order Placed", "Preparing", "Ready", "Out for Delivery", "Delivered"];
const TRACK_ICONS = { "Order Placed": Package, Preparing: Fire, Ready: CheckCircle, "Out for Delivery": Truck, Delivered: CheckCircle };

const NEXT_STATUS = {
  "Order Placed":     "Preparing",
  "Preparing":        "Ready",
  "Ready":            "Out for Delivery",
  "Out for Delivery": "Delivered",
};

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") || "tracking");
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [deliveryMen, setDeliveryMen] = useState([]);

  // Menu form
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [editMenuItem, setEditMenuItem] = useState(null);
  const [menuForm, setMenuForm] = useState({ name: "", category: "", price: "", description: "", is_available: true });
  const [imageFile, setImageFile] = useState(null);

  // Delivery Man form
  const [showDMForm, setShowDMForm] = useState(false);
  const [editDM, setEditDM] = useState(null);
  const [dmForm, setDMForm] = useState({ username: "", email: "", password: "", name: "", phone: "", vehicle_number: "" });
  const [dmError, setDmError] = useState("");

  // Category form
  const [showCatForm, setShowCatForm] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [catName, setCatName] = useState("");

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      getAdminOrders(),
      getMenuManage(),
      getDashboard(),
      getMenuCategories(),
      adminGetUsers(),
      adminGetPayments(),
      adminGetMainCategories(),
      adminGetDeliveryMen(),
    ])
      .then(([o, m, d, c, u, p, cats, dm]) => {
        setOrders(o.data); setMenuItems(m.data);
        setDashboard(d.data); setCategories(c.data);
        setUsers(u.data); setPayments(p.data);
        setAllCategories(cats.data);
        setDeliveryMen(dm.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t) setTab(t);
  }, [searchParams]);

  // Auto-refresh every 30s when on the live tracking tab
  useEffect(() => {
    if (tab !== "tracking") return;
    const interval = setInterval(() => {
      getAdminOrders().then((res) => setOrders(res.data)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [tab]);

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

  if (editCat) {
    await adminUpdateMainCategory(editCat.id, {
      name: catName.trim(),
    });
  } else {
    await adminCreateMainCategory({
      name: catName.trim(),
    });
  }

  resetCatForm();
  fetchAll();
};
  const handleDeleteCat = async (id) => {
  if (confirm("Delete this category?")) {
    await adminDeleteMainCategory(id);
    fetchAll();
  }
};

  // ── Order handlers ────────────────────────────────────────────────
  const handleOrderStatus = async (id, status) => {
    await adminUpdateOrder(id, { status }); fetchAll();
  };
  const handlePaymentStatus = async (id, payment_status) => {
    await adminUpdateOrder(id, { payment_status }); fetchAll();
  };
  const handleAssignDeliveryMan = async (orderId, deliveryManId) => {
    const assigned_to = deliveryManId ? parseInt(deliveryManId, 10) : null;
    await adminUpdateOrder(orderId, { assigned_to }); fetchAll();
  };

  const handleToggleUser = async (userId, currentActive) => {
    await adminToggleUserActive(userId, !currentActive); fetchAll();
  };

  // ── Delivery Man handlers ─────────────────────────────────────────
  const resetDMForm = () => {
    setDMForm({ username: "", email: "", password: "", name: "", phone: "", vehicle_number: "" });
    setEditDM(null); setShowDMForm(false); setDmError("");
  };
  const handleEditDM = (dm) => {
    setDMForm({ username: dm.username, email: dm.email || "", password: "", name: dm.name, phone: dm.phone, vehicle_number: dm.vehicle_number || "" });
    setEditDM(dm); setShowDMForm(true); setDmError("");
  };
  const handleDMSubmit = async (e) => {
    if (e) e.preventDefault();
    setDmError("");
    try {
      if (editDM) {
        await adminUpdateDeliveryMan(editDM.id, {
          name: dmForm.name,
          phone: dmForm.phone,
          vehicle_number: dmForm.vehicle_number,
        });
      } else {
        if (!dmForm.password) {
          setDmError("Password is required for new delivery personnel.");
          return;
        }
        await adminCreateDeliveryMan(dmForm);
      }
      resetDMForm(); fetchAll();
    } catch (err) {
      const data = err.response?.data;
      const msg = data ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(" ") : v}`).join(" | ") : "Failed to save delivery driver.";
      setDmError(msg);
    }
  };
  const handleDeleteDM = async (id) => {
    if (confirm("Are you sure you want to delete this delivery man?")) {
      await adminDeleteDeliveryMan(id); fetchAll();
    }
  };
  const handleToggleDMActive = async (id, currentActive) => {
    await adminUpdateDeliveryMan(id, { is_active: !currentActive }); fetchAll();
  };

  if (loading) {
    return <div className="page-loader"><div className="loader-spinner" />Loading admin panel...</div>;
  }

  const TABS = [
    { key: "tracking",     label: "Live Tracking", icon: ArrowsClockwise, count: orders.filter(o => !["Delivered","Cancelled"].includes(o.status)).length },
    { key: "orders",       label: "Orders",        icon: ClipboardText,   count: orders.length },
    { key: "menu",         label: "Menu",          icon: ForkKnife,       count: menuItems.length },
    { key: "categories",   label: "Categories",    icon: Tag,             count: allCategories.length },
    { key: "users",        label: "Users",         icon: Users,           count: users.length },
    { key: "delivery_men", label: "Delivery Men",  icon: Truck,           count: deliveryMen.length },
    { key: "payments",     label: "Payments",      icon: CurrencyDollar,  count: payments.length },
  ];

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Admin Panel</h1>
        <p>Manage orders, menu, categories, users, and payments</p>
      </div>

      {/* KPI Cards */}
      {dashboard && (
        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 24 }}>
          {[
            { label: "Customers",    value: dashboard.total_customers, icon: Users,          cls: "info" },
            { label: "Total Orders", value: dashboard.total_orders,    icon: ClipboardText,  cls: "" },
            { label: "Revenue",      value: `Rs ${(dashboard.total_revenue||0).toLocaleString()}`, icon: CurrencyDollar, cls: "success" },
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

      {/* ── LIVE TRACKING TAB ──────────────────────────────────────── */}
      {tab === "tracking" && (
        <div className="section">
          <div className="section-header" style={{ marginBottom: 20 }}>
            <h2>Live Order Tracking</h2>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => getAdminOrders().then((res) => setOrders(res.data))}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <ArrowsClockwise size={14} weight="bold" /> Refresh
            </button>
          </div>

          {/* Active order cards — one per non-completed order */}
          {orders.filter(o => !["Delivered", "Cancelled"].includes(o.status)).length === 0 ? (
            <div style={{
              padding: 48, textAlign: "center", color: "var(--text-muted)",
              border: "1.5px dashed var(--border)", borderRadius: "var(--r)",
              background: "var(--surface)",
            }}>
              <CheckCircle size={36} weight="duotone" style={{ color: "var(--success)", marginBottom: 10 }} />
              <p style={{ fontWeight: 600, color: "var(--txt)", margin: 0 }}>All caught up!</p>
              <p style={{ fontSize: "0.875rem", marginTop: 4 }}>No active orders right now.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 20 }}>
              {orders
                .filter(o => !["Delivered", "Cancelled"].includes(o.status))
                .map((o) => {
                  const currentIdx = TRACK_STEPS.indexOf(o.status);
                  const nextSt = NEXT_STATUS[o.status];
                  const progressPct = Math.max(0, Math.round(((currentIdx) / (TRACK_STEPS.length - 1)) * 100));

                  return (
                    <div
                      key={o.id}
                      style={{
                        background: "var(--surface)",
                        border: `1.5px solid var(--border)`,
                        borderLeft: `4px solid ${STATUS_COLORS[o.status] || "#6b7280"}`,
                        borderRadius: "var(--r)",
                        padding: "20px 24px",
                        boxShadow: "var(--sh-sm)",
                      }}
                    >
                      {/* Order header row */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                        <strong style={{ fontSize: "1rem", color: "var(--txt)" }}>Order #{o.id}</strong>
                        <span style={{
                          background: STATUS_COLORS[o.status] + "20",
                          color: STATUS_COLORS[o.status],
                          fontSize: "0.75rem", fontWeight: 700,
                          padding: "3px 10px", borderRadius: "var(--r-full)",
                        }}>
                          {o.status}
                        </span>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>
                          {o.customer_name}
                        </span>
                        <span style={{ marginLeft: "auto", fontWeight: 700, color: "var(--p-dark)", fontFamily: "var(--fh)" }}>
                          Rs {o.total_amount}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {new Date(o.order_date).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ height: 6, background: "var(--s2)", borderRadius: "var(--r-f)", overflow: "hidden" }}>
                          <div style={{
                            height: "100%",
                            width: `${progressPct}%`,
                            background: `linear-gradient(90deg, var(--success), ${STATUS_COLORS[o.status]})`,
                            borderRadius: "var(--r-f)",
                            transition: "width 0.6s ease",
                          }} />
                        </div>
                      </div>

                      {/* Step indicators */}
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 4, marginBottom: 20 }}>
                        {TRACK_STEPS.map((step, i) => {
                          const Icon = TRACK_ICONS[step];
                          const done   = i < currentIdx;
                          const active = i === currentIdx;
                          return (
                            <div
                              key={step}
                              style={{ flex: 1, textAlign: "center", cursor: "default" }}
                            >
                              <div style={{
                                width: 36, height: 36,
                                borderRadius: "50%",
                                margin: "0 auto 6px",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                background: done ? "var(--success)" : active ? STATUS_COLORS[step] : "var(--s2)",
                                color: (done || active) ? "#fff" : "var(--text-muted)",
                                border: active ? `2px solid ${STATUS_COLORS[step]}` : "2px solid transparent",
                                boxShadow: active ? `0 0 0 3px ${STATUS_COLORS[step]}30` : "none",
                                transition: "all 0.3s ease",
                              }}>
                                {done
                                  ? <CheckCircle size={16} weight="fill" />
                                  : <Icon size={16} weight={active ? "fill" : "regular"} />}
                              </div>
                              <div style={{
                                fontSize: "0.6875rem",
                                fontWeight: active ? 700 : 500,
                                color: active ? STATUS_COLORS[step] : done ? "var(--success)" : "var(--text-muted)",
                                lineHeight: 1.3,
                              }}>
                                {step === "Out for Delivery" ? "Out for\nDelivery" : step}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Action row */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", borderTop: "1px solid var(--border-l)", paddingTop: 14 }}>
                        {/* Primary action button — advance to next status */}
                        {nextSt && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleOrderStatus(o.id, nextSt)}
                            style={{ display: "flex", alignItems: "center", gap: 6 }}
                          >
                            {nextSt === "Preparing"        && <Fire size={13} weight="fill" />}
                            {nextSt === "Ready"            && <CheckCircle size={13} weight="fill" />}
                            {nextSt === "Out for Delivery" && <Truck size={13} weight="fill" />}
                            {nextSt === "Delivered"        && <CheckCircle size={13} weight="fill" />}
                            Mark as {nextSt}
                          </button>
                        )}

                        {/* Full status select for any manual override */}
                        <select
                          value={o.status}
                          onChange={(e) => handleOrderStatus(o.id, e.target.value)}
                          className="form-select-sm"
                          style={{ minWidth: 160 }}
                        >
                          {["Order Placed","Preparing","Ready","Out for Delivery","Delivered","Cancelled"].map(s => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>

                        {/* Delivery man assign */}
                        <select
                          value={o.assigned_to || ""}
                          onChange={(e) => handleAssignDeliveryMan(o.id, e.target.value)}
                          className="form-select-sm"
                          style={{ minWidth: 140 }}
                        >
                          <option value="">Assign Driver…</option>
                          {deliveryMen.filter(dm => dm.is_active || o.assigned_to === dm.id).map(dm => (
                            <option key={dm.id} value={dm.id}>{dm.name}</option>
                          ))}
                        </select>

                        {/* Address quick-view */}
                        {o.delivery_address_detail && (
                          <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                            <MapPin size={13} weight="fill" style={{ color: "var(--p)", flexShrink: 0 }} />
                            {o.delivery_address_detail.full_address}, {o.delivery_address_detail.city}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Recently delivered orders (last 5) */}
          {orders.filter(o => o.status === "Delivered").length > 0 && (
            <div style={{ marginTop: 32 }}>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--txt-m)", marginBottom: 12, textTransform: "uppercase", letterSpacing: ".5px" }}>
                Recently Delivered
              </h3>
              <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
                <table className="table">
                  <thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Driver</th><th>Date</th></tr></thead>
                  <tbody>
                    {orders.filter(o => o.status === "Delivered").slice(0, 5).map(o => (
                      <tr key={o.id}>
                        <td><strong>#{o.id}</strong></td>
                        <td>{o.customer_name}</td>
                        <td style={{ fontWeight: 600 }}>Rs {o.total_amount}</td>
                        <td style={{ color: "var(--text-muted)" }}>{o.assigned_to_name || "—"}</td>
                        <td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>
                          {new Date(o.order_date).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

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
                <thead><tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Status</th><th>Payment</th><th>Delivery Man</th><th>Date</th></tr></thead>
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
                            {["Order Placed","Preparing","Ready","Out for Delivery","Delivered","Cancelled"].map((s) => <option key={s}>{s}</option>)}
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
                      <td>
                        <select
                          value={o.assigned_to || ""}
                          onChange={(e) => handleAssignDeliveryMan(o.id, e.target.value)}
                          className="form-select-sm"
                          style={{ maxWidth: 140 }}
                        >
                          <option value="">Unassigned</option>
                          {deliveryMen.map((dm) => {
                            if (!dm.is_active && o.assigned_to !== dm.id) return null;
                            return (
                              <option key={dm.id} value={dm.id}>
                                {dm.name} {!dm.is_active && "(Inactive)"}
                              </option>
                            );
                          })}
                        </select>
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

      {/* ── DELIVERY MEN TAB ────────────────────────────────────────── */}
      {tab === "delivery_men" && (
        <div className="section">
          <div className="section-header">
            <h2>Delivery Personnel</h2>
            <button className="btn btn-primary btn-sm" onClick={() => { resetDMForm(); setShowDMForm(true); }}>
              <Plus size={15} weight="bold"/> Add Delivery Driver
            </button>
          </div>

          {showDMForm && (
            <div className="form-card" style={{ marginBottom: 20 }}>
              <h3>{editDM ? `Edit Driver: ${editDM.username}` : "Add New Delivery Driver"}</h3>
              {dmError && (
                <div className="alert alert-error" style={{ marginBottom: 14 }}>
                  {dmError}
                </div>
              )}
              <form onSubmit={handleDMSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Username</label>
                    <input
                      value={dmForm.username}
                      onChange={(e) => setDMForm({ ...dmForm, username: e.target.value })}
                      placeholder="e.g. driver_hari"
                      disabled={!!editDM}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={dmForm.email}
                      onChange={(e) => setDMForm({ ...dmForm, email: e.target.value })}
                      placeholder="driver@example.com"
                      disabled={!!editDM}
                    />
                  </div>
                </div>

                {!editDM && (
                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      value={dmForm.password}
                      onChange={(e) => setDMForm({ ...dmForm, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                      required
                    />
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      value={dmForm.name}
                      onChange={(e) => setDMForm({ ...dmForm, name: e.target.value })}
                      placeholder="Hari Prasad"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      value={dmForm.phone}
                      onChange={(e) => setDMForm({ ...dmForm, phone: e.target.value })}
                      placeholder="98XXXXXXXX"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Vehicle Number</label>
                  <input
                    value={dmForm.vehicle_number}
                    onChange={(e) => setDMForm({ ...dmForm, vehicle_number: e.target.value })}
                    placeholder="e.g. BA 2 PA 1234"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    {editDM ? "Save Changes" : "Create Driver"}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={resetDMForm}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Driver Name</th>
                    <th>Username</th>
                    <th>Phone</th>
                    <th>Vehicle</th>
                    <th>Active Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveryMen.map((dm) => (
                    <tr key={dm.id}>
                      <td><strong>{dm.name}</strong></td>
                      <td style={{ color: "var(--text-muted)" }}>{dm.username}</td>
                      <td>{dm.phone}</td>
                      <td style={{ color: "var(--text-muted)" }}>{dm.vehicle_number || "—"}</td>
                      <td>
                        {dm.is_active ? (
                          <span className="badge badge-success">Active</span>
                        ) : (
                          <span className="badge badge-danger">Inactive</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-xs btn-outline" onClick={() => handleEditDM(dm)}>
                            <PencilSimple size={13}/> Edit
                          </button>
                          <button className="btn btn-xs btn-outline" onClick={() => handleToggleDMActive(dm.id, dm.is_active)}>
                            <UserSwitch size={13}/> {dm.is_active ? "Deactivate" : "Activate"}
                          </button>
                          <button className="btn btn-xs btn-danger" onClick={() => handleDeleteDM(dm.id)}>
                            <Trash size={13}/> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {deliveryMen.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: 24 }}>
                        No delivery personnel registered yet.
                      </td>
                    </tr>
                  )}
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
