import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCart, checkout, initiatePayment } from "../api/orders";
import { getAddresses, createAddress } from "../api/accounts";
import { CurrencyDollar, MapPin, Check, ShoppingCart, Truck, ClipboardText, CreditCard } from "@phosphor-icons/react";

const STEPS = [
  { label: "Review Cart",    icon: ShoppingCart },
  { label: "Delivery",       icon: MapPin },
  { label: "Payment",        icon: CreditCard },
];

const PAYMENT_METHODS = [
  { id: "COD", name: "Cash on Delivery", description: "Pay when your order arrives" },
  { id: "eSewa", name: "eSewa", description: "Secure online payment" },
];

export default function CheckoutPage() {
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("COD");
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
    if (!newAddr.full_address || !newAddr.city) {
      setError("Please fill in all address fields");
      return;
    }
    try {
      const res = await createAddress(newAddr);
      setAddresses([...addresses, res.data]);
      setSelectedAddress(res.data.id);
      setShowNewAddress(false);
      setNewAddr({ label: "Home", full_address: "", city: "" });
      setError("");
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
      // Step 1: Create order with selected payment method
      const res = await checkout(selectedAddress, notes, selectedPayment);
      const orderId = res.data.id;

      // Step 2: If eSewa, initiate payment; otherwise redirect to order
      if (selectedPayment === "eSewa") {
        try {
          const paymentRes = await initiatePayment(orderId, "eSewa");
          const { payment_form_url, form_data } = paymentRes.data;

          // Create a form and submit to eSewa
          const form = document.createElement("form");
          form.method = "POST";
          form.action = payment_form_url;

          Object.entries(form_data).forEach(([key, value]) => {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = key;
            input.value = value;
            form.appendChild(input);
          });

          document.body.appendChild(form);
          form.submit();
        } catch (paymentErr) {
          setError(paymentErr.response?.data?.error || "Failed to initiate payment");
          setSubmitting(false);
        }
      } else {
        // COD: Direct redirect to order
        navigate(`/orders/${orderId}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Checkout failed. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="page-loader">
      <div className="loader-spinner" />
      Preparing checkout…
    </div>
  );

  if (!cart || cart.items.length === 0) {
    return (
      <div className="empty-page">
        <h2>Your cart is empty</h2>
        <button className="btn btn-primary" onClick={() => navigate("/menu")}>Browse Menu</button>
      </div>
    );
  }

  const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="checkout-page">
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1>Checkout</h1>
        <p style={{ color: "var(--txt-m)", fontSize: "0.875rem", marginTop: 4 }}>
          Complete your order in seconds
        </p>
      </div>

      {/* Step progress */}
      <div className="checkout-progress" style={{ marginBottom: 28 }}>
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isDone = i < 2;
          const isActive = i === 2;
          return (
            <div key={step.label} className="checkout-step-item" style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && (
                <div className="checkout-step-connector" style={{
                  flex: 1, height: 2, margin: "0 8px",
                  background: isDone ? "var(--success)" : "var(--border)",
                }} />
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <div className={`checkout-step-circle${isDone ? " done" : ""}${isActive ? " active" : ""}`}>
                  {isDone ? <Check size={15} weight="bold" /> : <Icon size={15} weight={isActive ? "fill" : "regular"} />}
                </div>
                <span className={`checkout-step-label${isActive ? " active" : ""}`}
                  style={{ color: isActive ? "var(--p)" : isDone ? "var(--success)" : "var(--txt-m)" }}>
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Two-column layout */}
      <div className="checkout-layout">
        {/* Left: form */}
        <div className="checkout-main">
          {/* Delivery Address */}
          <div className="checkout-section">
            <h2>
              <MapPin size={17} weight="duotone" style={{ color: "var(--p)" }} />
              Delivery Address
            </h2>

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
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <strong>{addr.label}</strong>
                        {selectedAddress === addr.id && (
                          <span className="badge badge-success" style={{ fontSize: "0.6rem" }}>Selected</span>
                        )}
                      </div>
                      <p style={{ margin: 0 }}>{addr.full_address}, {addr.city}</p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div style={{
                padding: "16px", background: "var(--s2)", borderRadius: "var(--r-sm)",
                textAlign: "center", color: "var(--txt-m)", fontSize: "0.875rem", marginBottom: 12
              }}>
                No saved addresses yet. Add one below.
              </div>
            )}

            <button
              className="btn btn-sm btn-outline"
              onClick={() => setShowNewAddress(!showNewAddress)}
              style={{ marginTop: addresses.length > 0 ? 8 : 0 }}
            >
              {showNewAddress ? "✕ Cancel" : "+ Add New Address"}
            </button>

            {showNewAddress && (
              <div className="new-address-form" style={{ marginTop: 14 }}>
                <div className="form-row">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Label</label>
                    <select
                      value={newAddr.label}
                      onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
                    >
                      <option>Home</option>
                      <option>Work</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>City</label>
                    <input
                      value={newAddr.city}
                      onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                      placeholder="e.g. Kathmandu"
                    />
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: 12 }}>
                  <label>Full Address</label>
                  <textarea
                    value={newAddr.full_address}
                    onChange={(e) => setNewAddr({ ...newAddr, full_address: e.target.value })}
                    placeholder="Street, landmark, area…"
                    rows={2}
                  />
                </div>
                <div className="form-actions" style={{ marginTop: 10 }}>
                  <button className="btn btn-primary btn-sm" onClick={handleAddAddress}>
                    <Check size={14} weight="bold" /> Save Address
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Notes */}
          <div className="checkout-section">
            <h2>
              <ClipboardText size={17} weight="duotone" style={{ color: "var(--p)" }} />
              Special Instructions
              <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--txt-m)", marginLeft: 6 }}>(Optional)</span>
            </h2>
            <textarea
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g. No onions, extra spicy, leave at door…"
              rows={3}
              style={{ resize: "vertical" }}
            />
          </div>

          {/* Payment Method */}
          <div className="checkout-section">
            <h2>
              <CreditCard size={17} weight="duotone" style={{ color: "var(--p)" }} />
              Payment Method
            </h2>
            <div style={{ display: "grid", gap: 10 }}>
              {PAYMENT_METHODS.map((method) => (
                <label key={method.id} className={`payment-radio ${selectedPayment === method.id ? "selected" : ""}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "14px", border: "1px solid var(--border)",
                    borderRadius: "var(--r-md)", cursor: "pointer", transition: "all 0.2s",
                    backgroundColor: selectedPayment === method.id ? "var(--s2)" : "transparent",
                    borderColor: selectedPayment === method.id ? "var(--p)" : "var(--border)",
                  }}>
                  <input
                    type="radio"
                    name="payment"
                    value={method.id}
                    checked={selectedPayment === method.id}
                    onChange={() => setSelectedPayment(method.id)}
                    style={{ cursor: "pointer" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: "var(--txt)" }}>{method.name}</div>
                    <div style={{ fontSize: "0.875rem", color: "var(--txt-m)" }}>{method.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

        </div>

        {/* Right: sticky summary */}
        <div className="checkout-aside">
          <div className="checkout-summary-panel">
            <h2>
              Order Summary
              <span style={{ marginLeft: "auto", fontSize: "0.75rem", fontWeight: 500, color: "var(--txt-m)" }}>
                {itemCount} item{itemCount !== 1 ? "s" : ""}
              </span>
            </h2>

            {cart.items.map((item) => (
              <div key={item.id} className="checkout-summary-item">
                <div>
                  <span className="item-name">{item.item_name}</span>
                  <span className="item-qty">×{item.quantity}</span>
                </div>
                <span style={{ fontWeight: 600, color: "var(--txt)", flexShrink: 0, marginLeft: 12 }}>
                  Rs {item.total_price}
                </span>
              </div>
            ))}

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "var(--txt-m)", marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border-l)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Truck size={13} weight="fill" style={{ color: "var(--success)" }} />
                Delivery
              </span>
              <span style={{ fontWeight: 700, color: "var(--success)" }}>FREE</span>
            </div>

            <div className="checkout-summary-total">
              <span>Total</span>
              <span>Rs {cart.total_price}</span>
            </div>

            <div className="checkout-payment-note" style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px", borderRadius: "var(--r-sm)",
              backgroundColor: selectedPayment === "eSewa" ? "#e0e7ff" : "var(--s2)",
              color: selectedPayment === "eSewa" ? "#4c1d95" : "var(--txt-m)", fontSize: "0.875rem", marginTop: 12
            }}>
              {selectedPayment === "eSewa" ? (
                <><CreditCard size={16} weight="fill" /> Secure payment via eSewa</>
              ) : (
                <><CurrencyDollar size={16} weight="fill" /> Cash on Delivery (COD)</>
              )}
            </div>

            <button
              className="btn btn-primary btn-block btn-lg"
              onClick={handleSubmit}
              disabled={submitting}
              style={{ marginTop: 12 }}
            >
              {submitting ? (
                <><div className="loader-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Processing…</>
              ) : selectedPayment === "eSewa" ? (
                "Proceed to Payment"
              ) : (
                "Place Order"
              )}
            </button>

            <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--txt-m)", marginTop: 10 }}>
              By placing the order you agree to our terms
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
