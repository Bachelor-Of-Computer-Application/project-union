import { useEffect, useState } from "react";
import { addToCart } from "../api/orders";
import { getMenuCategories } from "../api/menu";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Star, MagnifyingGlass, ShoppingCart, ForkKnife,
  X, Clock, CheckCircle,
} from "@phosphor-icons/react";

const CATEGORY_EMOJIS = {
  "Biryani": "🍛", "Pizza": "🍕", "Burger": "🍔", "Noodles": "🍜",
  "Chicken": "🍗", "Drinks": "🥤", "Beverages": "🥤", "Snacks": "🍟",
  "Desserts": "🍮", "Rice": "🍚", "Bread": "🫓", "Salad": "🥗",
  "Soup": "🍲", "Seafood": "🦐", "Vegetarian": "🥦", "Mutton": "🍖",
  "Buff": "🥩", "Momos": "🥟", "Sandwich": "🥪",
};

function getCatEmoji(name = "") {
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJIS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return emoji;
  }
  return "🍽️";
}

export default function MenuPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [toast, setToast] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Populate search from URL query param (set by TopBar search)
  useEffect(() => {
    const q = searchParams.get("search");
    if (q) {
      setSearch(q);
      // Clear the query param after picking it up so the URL stays clean
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  useEffect(() => {
    getMenuCategories()
      .then((res) => setCategories(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

  const filteredCategories = categories
    .filter((cat) => activeCategory === "all" || cat.id === activeCategory)
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          (item.description || "").toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  const totalItems = categories.reduce((sum, c) => sum + c.items.length, 0);

  if (loading) {
    return (
      <div className="page-loader">
        <div className="loader-spinner" />
        Loading menu...
      </div>
    );
  }

  return (
    <div className="menu-page">
      {toast && (
        <div className={`alert alert-${toast.type} toast`} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {toast.type === "success" ? <CheckCircle size={16} weight="fill" /> : null}
          {toast.msg}
        </div>
      )}

      {/* Hero Banner */}
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
            <div className="menu-hero-stat">
              <strong>{totalItems}</strong>
              <span>Dishes</span>
            </div>
            <div className="menu-hero-stat">
              <strong>{categories.length}</strong>
              <span>Categories</span>
            </div>
            <div className="menu-hero-stat">
              <strong>Free</strong>
              <span>Delivery</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search + toolbar */}
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

      {/* Horizontal category pills */}
      <div className="menu-cats-scroll-wrap">
        <div className="menu-cats-scroll">
          <button
            className={`menu-cat-pill${activeCategory === "all" ? " active" : ""}`}
            onClick={() => setActiveCategory("all")}
          >
            🍽️ All Items
            <span className="menu-cat-pill-count">{totalItems}</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`menu-cat-pill${activeCategory === cat.id ? " active" : ""}`}
              onClick={() => setActiveCategory(activeCategory === cat.id ? "all" : cat.id)}
            >
              {getCatEmoji(cat.name)} {cat.name}
              <span className="menu-cat-pill-count">{cat.items.length}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ERP two-panel layout for wider screens */}
      <div className="menu-layout">
        {/* Category sidebar (desktop) */}
        <div className="menu-cat-panel">
          <div className="menu-cat-panel-header">Categories</div>
          <button
            className={`menu-cat-item${activeCategory === "all" ? " active" : ""}`}
            onClick={() => setActiveCategory("all")}
          >
            All Items
            <span className="menu-cat-count">{totalItems}</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`menu-cat-item${activeCategory === cat.id ? " active" : ""}`}
              onClick={() => setActiveCategory(activeCategory === cat.id ? "all" : cat.id)}
            >
              <span style={{ marginRight: 6 }}>{getCatEmoji(cat.name)}</span>
              {cat.name}
              <span className="menu-cat-count">{cat.items.length}</span>
            </button>
          ))}
        </div>

        {/* Items grid */}
        <div className="menu-grid-area">
          {filteredCategories.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><ForkKnife size={28} /></div>
              <p>No items found{search ? ` for "${search}"` : ""}.</p>
              {search && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setSearch("")}
                  style={{ marginTop: 12 }}
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            filteredCategories.map((cat) => (
              <section key={cat.id} className="menu-category" id={`cat-${cat.id}`}>
                <h2 className="category-title">
                  <span style={{ fontSize: "1.1rem" }}>{getCatEmoji(cat.name)}</span>
                  {cat.name}
                  <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--txt-m)", marginLeft: 4 }}>
                    ({cat.items.length})
                  </span>
                </h2>
                <div className="menu-grid">
                  {cat.items.map((item) => {
                    const isPopular = item.rating >= 4.2;
                    const isNew = !item.rating || item.rating === 0;
                    const isAdding = addingId === item.id;

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
                            <span className="badge badge-secondary" style={{ marginBottom: 6, fontSize: "0.6875rem" }}>
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
                                <div className="loader-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
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
