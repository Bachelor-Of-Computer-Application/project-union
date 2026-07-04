import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCart, checkout } from "../api/orders";
import { getAddresses, createAddress } from "../api/accounts";
import { CurrencyDollar } from "@phosphor-icons/react";

export default function CheckoutPage() {
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({ label: "Home", full_address: "", city: "" });
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getCart(), getAddresses()])
      .then(([cartRes, addrRes]) => {
        setCart(cartRes.data);
        setAddresses(addrRes.data);
        if (addrRes.data.length > 0) setSelectedAddress(addrRes.data[0].id);
      })
      .catch(() => navigate("/cart"))
      .finally(() => setLoading(false));
  }, []);

  const handleAddAddress = async () => {
    try {
      const res = await createAddress(newAddr);
      setAddresses([...addresses, res.data]);
      setSelectedAddress(res.data.id);
      setShowNewAddress(false);
      setNewAddr({ label: "Home", full_address: "", city: "" });
    } catch {
      setError("Failed to add address");
    }
  };

  const handleSubmit = async () => {
    if (!selectedAddress) {
      setError("Please select a delivery address");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await checkout(selectedAddress, notes);
      navigate(`/orders/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-loader">Loading...</div>;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="empty-page">
        <h2>Your cart is empty</h2>
        <button className="btn btn-primary" onClick={() => navigate("/menu")}>Browse Menu</button>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="checkout-section">
        <h2>Order Summary</h2>
        {cart.items.map((item) => (
          <div key={item.id} className="checkout-item">
            <span>{item.item_name} × {item.quantity}</span>
            <span>Rs {item.total_price}</span>
          </div>
        ))}
        <div className="checkout-total">
          <strong>Total: Rs {cart.total_price}</strong>
        </div>
      </div>

      <div className="checkout-section">
        <h2>Delivery Address</h2>
        {addresses.length > 0 ? (
          <div className="address-list">
            {addresses.map((addr) => (
              <label key={addr.id} className={`address-radio ${selectedAddress === addr.id ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="address"
                  value={addr.id}
                  checked={selectedAddress === addr.id}
                  onChange={() => setSelectedAddress(addr.id)}
                />
                <div>
                  <strong>{addr.label}</strong>
                  <p>{addr.full_address}, {addr.city}</p>
                </div>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-muted">No addresses saved</p>
        )}

        <button className="btn btn-sm btn-outline" onClick={() => setShowNewAddress(!showNewAddress)}>
          {showNewAddress ? "Cancel" : "+ Add New Address"}
        </button>

        {showNewAddress && (
          <div className="new-address-form">
            <div className="form-group">
              <label>Label</label>
              <select value={newAddr.label} onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}>
                <option>Home</option>
                <option>Work</option>
                <option>Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Full Address</label>
              <textarea value={newAddr.full_address} onChange={(e) => setNewAddr({ ...newAddr, full_address: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>City</label>
              <input value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} required />
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleAddAddress}>Save Address</button>
          </div>
        )}
      </div>

      <div className="checkout-section">
        <h2>Order Notes (Optional)</h2>
        <textarea
          className="form-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special instructions..."
          rows={3}
        />
      </div>

      <div className="checkout-action">
        <p className="payment-note"><CurrencyDollar size={16} className="inline-icon" weight="fill" /> Payment: Cash on Delivery</p>
        <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Placing Order..." : "Place Order"}
        </button>
      </div>
    </div>
  );
}
