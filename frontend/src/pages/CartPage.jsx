import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getCart, updateCartItem, removeCartItem } from "../api/orders";
import { X, Minus, Plus, ShoppingCart, ArrowRight, ForkKnife, Truck, Clock } from "@phosphor-icons/react";

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCart = () => {
    getCart()
      .then((res) => setCart(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCart(); }, []);

  const handleQuantity = async (item, delta) => {
    const newQty = item.quantity + delta;
    if (newQty < 1) {
      await removeCartItem(item.id);
    } else {
      await updateCartItem(item.id, newQty);
    }
    fetchCart();
  };

  const handleRemove = async (itemId) => {
    await removeCartItem(itemId);
    fetchCart();
  };

  if (loading) {
    return (
      <div className="page-loader">
        <div className="loader-spinner" />
        Loading cart...
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="empty-page">
        <div className="empty-icon" style={{ width: 88, height: 88, margin: "0 auto 24px", background: "var(--p-light)" }}>
          <ShoppingCart size={38} style={{ color: "var(--p)", opacity: 0.7 }} />
        </div>
        <h2>Your cart is empty</h2>
        <p>Add some delicious items from our menu to get started</p>
        <Link to="/menu" className="btn btn-primary btn-lg" style={{ marginTop: 4 }}>
          <ForkKnife size={17} /> Browse Menu
        </Link>
      </div>
    );
  }

  const subtotal = cart.total_price;
  const total = subtotal;
  const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="cart-page">
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h1 style={{ margin: 0 }}>Your Cart</h1>
          <p style={{ color: "var(--txt-m)", fontSize: "0.875rem", marginTop: 3 }}>
            {cart.items.length} item{cart.items.length !== 1 ? "s" : ""} · {itemCount} total qty
          </p>
        </div>
        <Link to="/menu" className="btn btn-outline btn-sm">
          <ForkKnife size={14} /> Add more
        </Link>
      </div>

      {/* Free delivery banner */}
      <div className="cart-delivery-bar">
        <Truck size={18} weight="fill" />
        <span>Free delivery on this order — enjoy!</span>
        <span style={{ marginLeft: "auto", fontSize: "0.75rem", opacity: 0.8, fontWeight: 500 }}>
          Estimated: 25–35 min
        </span>
      </div>

      <div className="cart-layout">
        {/* Cart items */}
        <div>
          <div className="cart-items">
            {cart.items.map((item) => (
              <div key={item.id} className="cart-item">
                {/* Item image */}
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.item_name}
                    className="cart-item-img-real"
                  />
                ) : (
                  <div className="cart-item-img-placeholder">
                    <ForkKnife size={22} weight="duotone" />
                  </div>
                )}

                <div className="cart-item-info">
                  <h3>{item.item_name}</h3>
                  <p className="cart-item-price">Rs {item.item_price} each</p>
                </div>

                {/* Quantity controls */}
                <div className="cart-item-controls">
                  <button className="qty-btn" onClick={() => handleQuantity(item, -1)}>
                    <Minus size={13} weight="bold" />
                  </button>
                  <span className="cart-qty">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => handleQuantity(item, 1)}>
                    <Plus size={13} weight="bold" />
                  </button>
                </div>

                <span className="cart-item-total">Rs {item.total_price}</span>

                <button
                  className="cart-remove-btn"
                  onClick={() => handleRemove(item.id)}
                  title="Remove item"
                >
                  <X size={15} weight="bold" />
                </button>
              </div>
            ))}
          </div>

          {/* Delivery estimate */}
          <div className="cart-estimate">
            <Clock size={15} />
            Order now and receive in approximately <strong style={{ color: "var(--txt)", marginLeft: 4 }}>25–35 minutes</strong>
          </div>
        </div>

        {/* Order Summary Panel */}
        <div className="cart-summary">
          <h2>Order Summary</h2>

          {cart.items.map((item) => (
            <div key={item.id} className="cart-summary-row">
              <span style={{ color: "var(--txt-2)" }}>
                {item.item_name}
                <span style={{ color: "var(--txt-m)", fontSize: "0.75rem", marginLeft: 4 }}>
                  ×{item.quantity}
                </span>
              </span>
              <span style={{ fontWeight: 600, color: "var(--txt)" }}>Rs {item.total_price}</span>
            </div>
          ))}

          <div className="cart-summary-row" style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid var(--border)" }}>
            <span>Subtotal</span>
            <span>Rs {subtotal}</span>
          </div>
          <div className="cart-summary-row">
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Truck size={13} weight="fill" style={{ color: "var(--success)" }} />
              Delivery Fee
            </span>
            <span style={{ color: "var(--success)", fontWeight: 700 }}>FREE</span>
          </div>

          <div className="cart-summary-row total">
            <span>Total</span>
            <span>Rs {total}</span>
          </div>

          {/* COD note */}
          <div style={{
            marginTop: "12px", padding: "12px 14px",
            background: "var(--p-light)", borderRadius: "var(--r-sm)",
            fontSize: "0.8125rem", color: "var(--p-dark)", fontWeight: 500,
            display: "flex", alignItems: "center", gap: 8,
            border: "1px solid var(--p-mid)"
          }}>
            <span style={{ fontSize: "1rem" }}>💵</span>
            Payment: Cash on Delivery
          </div>

          <button
            className="btn btn-primary btn-block btn-lg"
            onClick={() => navigate("/checkout")}
            style={{ marginTop: "16px" }}
          >
            Proceed to Checkout <ArrowRight size={16} weight="bold" />
          </button>

          <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--txt-m)", marginTop: 10 }}>
            You can review your address on the next step
          </p>
        </div>
      </div>
    </div>
  );
}
