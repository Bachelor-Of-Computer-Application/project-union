import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { XCircle, ArrowLeft } from "@phosphor-icons/react";

export default function PaymentFailurePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const transactionUuid = searchParams.get("transaction_uuid");
    const reason = searchParams.get("reason");
    
    if (reason) {
      setError(reason);
    } else if (transactionUuid) {
      setError("Payment was not completed. Please try again with a different payment method or contact support.");
    } else {
      setError("Payment was cancelled. No transaction ID found.");
    }
  }, [searchParams]);

  return (
    <div style={{ minHeight: "calc(100vh - 140px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{
        backgroundColor: "#fff", borderRadius: "var(--r-lg)", padding: "40px",
        textAlign: "center", maxWidth: "500px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
      }}>
        <div style={{ marginBottom: 20 }}>
          <XCircle size={80} weight="fill" style={{ color: "var(--danger)" }} />
        </div>
        
        <h1 style={{ fontSize: "1.5rem", color: "var(--danger)", marginBottom: 10 }}>Payment Failed</h1>
        
        <p style={{ color: "var(--txt-m)", lineHeight: 1.6, marginBottom: 24 }}>
          {error}
        </p>

        <p style={{ fontSize: "0.875rem", color: "var(--txt-m)", marginBottom: 24, padding: "12px", backgroundColor: "var(--s2)", borderRadius: "var(--r-sm)" }}>
          Your order was created but not yet paid. You can pay it later or retry with a different payment method.
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/orders")}
          >
            <ArrowLeft size={16} weight="bold" style={{ marginRight: 6 }} />
            Back to Orders
          </button>
          <button
            className="btn btn-outline"
            onClick={() => navigate("/checkout")}
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
