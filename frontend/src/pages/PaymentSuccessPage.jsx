import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { verifyPayment } from "../api/orders";
import { CheckCircle, XCircle, Clock } from "@phosphor-icons/react";

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const verifyPaymentStatus = async () => {
      const uuid = searchParams.get("transaction_uuid");
      
      if (!uuid) {
        setStatus("error");
        setError("No transaction ID found. Please contact support.");
        return;
      }

      try {
        const res = await verifyPayment(uuid);
        if (res.data.success) {
          setOrderId(res.data.order.id);
          setStatus("success");
          // Redirect to order detail after 2 seconds
          setTimeout(() => {
            navigate(`/orders/${res.data.order.id}`);
          }, 2000);
        } else {
          setStatus("error");
          setError(res.data.message || "Payment verification failed");
        }
      } catch (err) {
        setStatus("error");
        setError(err.response?.data?.message || "Failed to verify payment. Please check your order status.");
      }
    };

    verifyPaymentStatus();
  }, [searchParams, navigate]);

  return (
    <div style={{ minHeight: "calc(100vh - 140px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{
        backgroundColor: "#fff", borderRadius: "var(--r-lg)", padding: "40px",
        textAlign: "center", maxWidth: "500px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
      }}>
        {status === "verifying" && (
          <>
            <div style={{ marginBottom: 20 }}>
              <Clock size={64} weight="fill" style={{ color: "var(--p)", animation: "spin 1s linear infinite" }} />
            </div>
            <h1 style={{ fontSize: "1.5rem", marginBottom: 10 }}>Verifying Payment…</h1>
            <p style={{ color: "var(--txt-m)", lineHeight: 1.6 }}>
              Please wait while we verify your payment with eSewa.
              <br />
              Do not close this page.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ marginBottom: 20 }}>
              <CheckCircle size={80} weight="fill" style={{ color: "var(--success)" }} />
            </div>
            <h1 style={{ fontSize: "1.5rem", color: "var(--success)", marginBottom: 10 }}>Payment Successful!</h1>
            <p style={{ color: "var(--txt-m)", lineHeight: 1.6, marginBottom: 20 }}>
              Your payment has been verified successfully.
              <br />
              Order ID: <strong>#{orderId}</strong>
            </p>
            <p style={{ fontSize: "0.875rem", color: "var(--txt-m)" }}>
              Redirecting to your order details…
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/orders/${orderId}`)}
              style={{ marginTop: 20 }}
            >
              View Order
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ marginBottom: 20 }}>
              <XCircle size={80} weight="fill" style={{ color: "var(--danger)" }} />
            </div>
            <h1 style={{ fontSize: "1.5rem", color: "var(--danger)", marginBottom: 10 }}>Payment Failed</h1>
            <p style={{ color: "var(--txt-m)", lineHeight: 1.6, marginBottom: 20 }}>
              {error}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                className="btn btn-outline"
                onClick={() => navigate("/checkout")}
              >
                Try Again
              </button>
              <button
                className="btn btn-primary"
                onClick={() => navigate("/orders")}
              >
                View Orders
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
