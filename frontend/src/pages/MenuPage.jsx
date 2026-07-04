import { useEffect, useState } from "react";
import { addToCart } from "../api/orders";
import { getMenuCategories } from "../api/menu";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Star, MagnifyingGlass, ShoppingCart, ForkKnife,
  SlidersHorizontal, X,
} from "@phosphor-icons/react";

export default function MenuPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [toast, setToast] = useState(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

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
    try {
      await addToCart(item.id);
      showToast(`${item.name} added to cart!`);
    } catch {
      showToast("Could not add item. Please try again.", "error");
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
        <div className={`alert alert-${toast.type} toast`}>{toast.msg}</div>
      )}

      {/* Page header */}
      <div className="menu-page-header">
        <div>
          <h1>Menu</h1>
          <p style={{ color: "var(--txt-m)", fontSize: "0.9rem", marginTop: 4 }}>
            {totalItems} dishes across {categories.length} categories
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span className="badge badge-orange">
            <ForkKnife size={12} weight="fill" /> Fresh Menu
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="menu-toolbar">
        <div className="menu-search-bar">
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

        <button className="btn btn-secondary btn-sm">
          <SlidersHorizontal size={15} /> Filter
        </button>
      </div>

      {/* ERP two-panel layout */}
      <div className="menu-layout">
        {/* Category sidebar */}
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
                  <ForkKnife size={16} weight="duotone" style={{ color: "var(--p)" }} />
                  {cat.name}
                  <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--txt-m)", marginLeft: 4 }}>
                    ({cat.items.length})
                  </span>
                </h2>
                <div className="menu-grid">
                  {cat.items.map((item) => (
                    <div
                      key={item.id}
                      className="menu-card"
                      style={!item.is_available ? { opacity: 0.6 } : undefined}
                    >
                      {item.image ? (
                        <img
                          className="menu-card-image"
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                        />
                      ) : (
                        <div className="menu-card-image-placeholder">
                          <ForkKnife size={32} style={{ opacity: 0.25 }} />
                          <span style={{ fontSize: "0.75rem" }}>No photo yet</span>
                        </div>
                      )}

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
                          disabled={!item.is_available}
                          style={{ width: "100%", marginTop: 14 }}
                        >
                          {item.is_available ? (
                            <><ShoppingCart size={15} weight="bold" /> Add to Cart</>
                          ) : (
                            "Currently Unavailable"
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
