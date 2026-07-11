import { useEffect, useState, useMemo } from "react";
import { addToCart } from "../api/orders";
import { getMenuFull } from "../api/menu";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Star, MagnifyingGlass, ShoppingCart, ForkKnife,
  X, Clock, CheckCircle,
} from "@phosphor-icons/react";

// ── emoji map ──────────────────────────────────────────────────────────────
const MAIN_CAT_EMOJI = {
  Food:      "🍽️",
  Drinks:    "🥤",
  Snacks:    "🍟",
  Desserts:  "🍰",
  Beverages: "☕",
  Others:    "🛒",
};

const SECTION_EMOJI = {
  Momo:          "🥟",
  Pizza:         "🍕",
  Burger:        "🍔",
  Chowmein:      "🍜",
  Biryani:       "🍛",
  "Hot Wings":   "🍗",
  Noodles:       "🍜",
  "Soft Drinks": "🥤",
  Juice:         "🍹",
  Coffee:        "☕",
  Lassi:         "🥛",
  Fries:         "🍟",
  Sandwich:      "🥪",
  Sausage:       "🌭",
  "Spring Roll": "🌯",
  Tea:           "🫖",
  "Hot Chocolate":"🍫",
  Milkshake:     "🥤",
  "Ice Cream":   "🍦",
  Cake:          "🎂",
};

function mainEmoji(name = "") {
  return MAIN_CAT_EMOJI[name] ?? "🍽️";
}
function secEmoji(name = "") {
  return SECTION_EMOJI[name] ?? "🍴";
}

// ── component ──────────────────────────────────────────────────────────────

export default function MenuPage() {
  const [tree, setTree]               = useState([]);   // full MainCategory[] tree
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [activeMain, setActiveMain]   = useState(null); // MainCategory id
  const [activeSection, setActiveSection] = useState(null); // MenuSection id
  const [toast, setToast]             = useState(null);
  const [addingId, setAddingId]       = useState(null);
  const { isAuthenticated, user }     = useAuth();
  const navigate                      = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Pick up ?search= from TopBar
  useEffect(() => {
    const q = searchParams.get("search");
    if (q) {
      setSearch(q);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  // Load full tree once
  useEffect(() => {
    getMenuFull()
      .then((res) => {
        setTree(res.data);
        if (res.data.length > 0) setActiveMain(res.data[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // When activeMain changes, default to "all sections" (null)
  useEffect(() => {
    setActiveSection(null);
  }, [activeMain]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const handleAddToCart = async (item) => {
    if (!isAuthenticated) {
      sessionStorage.setItem("cart_intent", JSON.stringify({ menu_item: item.id, quantity: 1 }));
      navigate("/login");
      return;
    }
    setAddingId(item.id);
    try {
      await addToCart(item.id);
      showToast(`${item.name} added to cart!`);
    } catch {
      showToast("Could not add item. Please try again.", "error");
    } finally {
      setAddingId(null);
    }
  };

  // ── derived data ─────────────────────────────────────────────────────────

  // Active MainCategory object
  const activeCat = useMemo(
    () => tree.find((mc) => mc.id === activeMain) ?? null,
    [tree, activeMain]
  );

  // Sections of active MainCategory
  const sections = useMemo(
    () => activeCat?.sections ?? [],
    [activeCat]
  );

  // Items to display — filtered by section + search
  const displayedSections = useMemo(() => {
    if (!activeCat) return [];

    const src = activeSection
      ? sections.filter((s) => s.id === activeSection)
      : sections;

    return src
      .map((sec) => ({
        ...sec,
        items: sec.items.filter((item) => {
          if (!search) return true;
          const q = search.toLowerCase();
          return (
            item.name.toLowerCase().includes(q) ||
            (item.description ?? "").toLowerCase().includes(q)
          );
        }),
      }))
      .filter((sec) => sec.items.length > 0);
  }, [activeCat, sections, activeSection, search]);

  // Totals
  const totalItems = useMemo(
    () => tree.reduce((sum, mc) => sum + mc.sections.reduce((s2, sec) => s2 + sec.items.length, 0), 0),
    [tree]
  );
  const activeCatItemCount = useMemo(
    () => sections.reduce((sum, sec) => sum + sec.items.length, 0),
    [sections]
  );

  // ── render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="page-loader">
        <div className="loader-spinner" />
        Loading menu…
      </div>
    );
  }

  return (
    <div className="menu-page">

      {/* Toast */}
      {toast && (
        <div className={`alert alert-${toast.type} toast`}
          style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {toast.type === "success" && <CheckCircle size={16} weight="fill" />}
          {toast.msg}
        </div>
      )}

      {/* Hero */}
      <div className="menu-hero">
        <div className="menu-hero-inner">
          <div className="menu-hero-text">
            <h1>
              {isAuthenticated
                ? `Hey ${user?.username}, what are you craving? 👋`
                : "Discover Something Delicious"}
            </h1>
            <p>Fresh ingredients, bold flavors — ready in 25–35 minutes</p>
          </div>
          <div className="menu-hero-stats">
            <div className="menu-hero-stat"><strong>{totalItems}</strong><span>Dishes</span></div>
            <div className="menu-hero-stat"><strong>{tree.length}</strong><span>Categories</span></div>
            <div className="menu-hero-stat"><strong>Free</strong><span>Delivery</span></div>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="menu-toolbar">
        <div className="menu-search-bar" style={{ maxWidth: 520, flex: 1 }}>
          <MagnifyingGlass size={15} color="var(--txt-m)" />
          <input
            placeholder="Search dishes, ingredients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--txt-m)", display: "flex" }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8125rem", color: "var(--txt-m)", flexShrink: 0 }}>
          <Clock size={14} />
          25–35 min delivery
        </div>
      </div>

      {/* ── LEVEL 1: MainCategory tabs (horizontal scroll) ─────────────── */}
      <div className="menu-cats-scroll-wrap">
        <div className="menu-cats-scroll">
          {tree.map((mc) => {
            const count = mc.sections.reduce((s, sec) => s + sec.items.length, 0);
            return (
              <button
                key={mc.id}
                className={`menu-cat-pill${activeMain === mc.id ? " active" : ""}`}
                onClick={() => setActiveMain(mc.id)}
              >
                {mainEmoji(mc.name)} {mc.name}
                <span className="menu-cat-pill-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Two-panel layout ───────────────────────────────────────────── */}
      <div className="menu-layout">

        {/* LEVEL 2: MenuSection sidebar (desktop) + pills (mobile) */}
        <div className="menu-cat-panel">
          <div className="menu-cat-panel-header">
            {activeCat ? `${mainEmoji(activeCat.name)} ${activeCat.name}` : "Sections"}
          </div>

          {/* "All" entry */}
          <button
            className={`menu-cat-item${activeSection === null ? " active" : ""}`}
            onClick={() => setActiveSection(null)}
          >
            All {activeCat?.name ?? "Items"}
            <span className="menu-cat-count">{activeCatItemCount}</span>
          </button>

          {sections.map((sec) => (
            <button
              key={sec.id}
              className={`menu-cat-item${activeSection === sec.id ? " active" : ""}`}
              onClick={() => setActiveSection(activeSection === sec.id ? null : sec.id)}
            >
              <span style={{ marginRight: 6 }}>{secEmoji(sec.name)}</span>
              {sec.name}
              <span className="menu-cat-count">{sec.items.length}</span>
            </button>
          ))}
        </div>

        {/* ── LEVEL 3: MenuItem grid ─────────────────────────────────── */}
        <div className="menu-grid-area">

          {/* Section pills — visible on mobile above the grid */}
          {sections.length > 1 && (
            <div className="menu-cats-scroll-wrap" style={{ marginBottom: 16 }}>
              <div className="menu-cats-scroll">
                <button
                  className={`menu-cat-pill${activeSection === null ? " active" : ""}`}
                  onClick={() => setActiveSection(null)}
                  style={{ fontSize: "0.8rem" }}
                >
                  All
                </button>
                {sections.map((sec) => (
                  <button
                    key={sec.id}
                    className={`menu-cat-pill${activeSection === sec.id ? " active" : ""}`}
                    onClick={() => setActiveSection(activeSection === sec.id ? null : sec.id)}
                    style={{ fontSize: "0.8rem" }}
                  >
                    {secEmoji(sec.name)} {sec.name}
                    <span className="menu-cat-pill-count">{sec.items.length}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {displayedSections.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><ForkKnife size={28} /></div>
              <p>No items found{search ? ` for "${search}"` : ""}.</p>
              {search && (
                <button className="btn btn-outline btn-sm"
                  onClick={() => setSearch("")} style={{ marginTop: 12 }}>
                  Clear search
                </button>
              )}
            </div>
          ) : (
            displayedSections.map((sec) => (
              <section key={sec.id} className="menu-category" id={`sec-${sec.id}`}>
                <h2 className="category-title">
                  <span style={{ fontSize: "1.1rem" }}>{secEmoji(sec.name)}</span>
                  {sec.name}
                  <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--txt-m)", marginLeft: 4 }}>
                    ({sec.items.length})
                  </span>
                </h2>

                <div className="menu-grid">
                  {sec.items.map((item) => {
                    const isPopular = item.rating >= 4.2;
                    const isNew     = !item.rating || item.rating === 0;
                    const isAdding  = addingId === item.id;

                    return (
                      <div
                        key={item.id}
                        className="menu-card"
                        style={!item.is_available ? { opacity: 0.62 } : undefined}
                      >
                        <div className="menu-card-img-wrap">
                          {item.image ? (
                            <img
                              className="menu-card-image"
                              src={item.image}
                              alt={item.name}
                              loading="lazy"
                            />
                          ) : (
                            <div className="menu-card-image-placeholder">
                              <ForkKnife size={32} style={{ opacity: 0.2 }} />
                              <span style={{ fontSize: "0.75rem" }}>No photo yet</span>
                            </div>
                          )}
                          {isPopular && item.is_available && (
                            <span className="menu-card-badge">⭐ Popular</span>
                          )}
                          {isNew && item.is_available && (
                            <span className="menu-card-badge new">New</span>
                          )}
                        </div>

                        <div className="menu-card-body">
                          <h3>{item.name}</h3>
                          {!item.is_available && (
                            <span className="badge badge-secondary"
                              style={{ marginBottom: 6, fontSize: "0.6875rem" }}>
                              Unavailable
                            </span>
                          )}
                          {item.description && (
                            <p className="menu-desc">{item.description}</p>
                          )}
                          <div className="menu-card-footer">
                            <span className="menu-price">Rs {item.price}</span>
                            {item.rating > 0 && (
                              <span className="menu-rating">
                                <Star size={12} weight="fill" className="star-icon" />
                                {item.rating}
                              </span>
                            )}
                          </div>
                          <button
                            className={`btn btn-sm ${item.is_available ? "btn-primary" : "btn-secondary"}`}
                            onClick={() => handleAddToCart(item)}
                            disabled={!item.is_available || isAdding}
                            style={{ width: "100%", marginTop: 14 }}
                          >
                            {isAdding ? (
                              <>
                                <div className="loader-spinner"
                                  style={{ width: 14, height: 14, borderWidth: 2 }} />
                                Adding…
                              </>
                            ) : item.is_available ? (
                              <><ShoppingCart size={15} weight="bold" /> Add to Cart</>
                            ) : (
                              "Currently Unavailable"
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
