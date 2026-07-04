import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getCart, updateCartItem, removeCartItem } from "../api/orders";
import { X, Minus, Plus, ShoppingCart, ArrowRight, ForkKnife } from "@phosphor-icons/react";

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
        <div className="empty-icon" style={{ width: 80, height: 80, margin: "0 auto 20px" }}>
          <ShoppingCart size={36} style={{ opacity: 0.35, color: "var(--text-muted)" }} />
        </div>
        <h2>Your cart is empty</h2>
        <p>Add some delicious items from our menu to get started</p>
        <Link to="/menu" className="btn btn-primary btn-lg">
          <ForkKnife size={17} /> Browse Menu
        </Link>
      </div>
    );
  }

  const deliveryFee = 0;
  const subtotal = cart.total_price;
  const total = subtotal + deliveryFee;

  return (
    <div className="cart-page">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <h1 style={{ margin: 0 }}>Your Cart</h1>
        <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", fontWeight: 500 }}>
          {cart.items.length} item{cart.items.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="cart-layout">
        {/* Items */}
        <div>
          <div className="cart-items">
            {cart.items.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-img" style={{
                  background: "linear-gradient(135deg, var(--surface-3), var(--primary-light))",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <ForkKnife size={24} style={{ opacity: 0.25, color: "var(--primary)" }} />
                </div>

                <div className="cart-item-info">
                  <h3>{item.item_name}</h3>
                  <p className="cart-item-price">Rs {item.item_price} each</p>
                </div>

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

          <div style={{ marginTop: "16px" }}>
            <Link to="/menu" className="btn btn-outline btn-sm">
              <ForkKnife size={14} /> Add more items
            </Link>
          </div>
        </div>

        {/* Summary Panel */}
        <div className="cart-summary">
          <h2>Order Summary</h2>

          {cart.items.map((item) => (
            <div key={item.id} className="cart-summary-row">
              <span>{item.item_name} × {item.quantity}</span>
              <span>Rs {item.total_price}</span>
            </div>
          ))}

          <div className="cart-summary-row" style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid var(--border)" }}>
            <span>Subtotal</span>
            <span>Rs {subtotal}</span>
          </div>
          <div className="cart-summary-row">
            <span>Delivery Fee</span>
            <span style={{ color: "var(--success)", fontWeight: 600 }}>FREE</span>
          </div>

          <div className="cart-summary-row total">
            <span>Total</span>
            <span>Rs {total}</span>
          </div>

          <div style={{ marginTop: "6px", padding: "12px", background: "var(--primary-light)", borderRadius: "var(--r-sm)", fontSize: "0.8125rem", color: "var(--primary-dark)", fontWeight: 500 }}>
            Payment: Cash on Delivery (COD)
          </div>

          <button
            className="btn btn-primary btn-block btn-lg"
            onClick={() => navigate("/checkout")}
            style={{ marginTop: "16px" }}
          >
            Proceed to Checkout <ArrowRight size={16} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}
