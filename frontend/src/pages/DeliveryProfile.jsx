import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { updateProfile, changePassword } from "../api/accounts";
import { getMe } from "../api/auth";
import {
  User, Envelope, Phone, Lock, CheckCircle,
  WarningCircle, PencilSimple, ShieldCheck, Truck,
} from "@phosphor-icons/react";

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`alert alert-${toast.type} toast`} style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {toast.type === "success"
        ? <CheckCircle size={16} weight="fill" />
        : <WarningCircle size={16} weight="fill" />}
      {toast.msg}
    </div>
  );
}

export default function DeliveryProfile() {
  const { user } = useAuth();
  const delivery = user?.delivery_profile;

  // ── Profile form state ──────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    name: delivery?.name || "",
    email: user?.email || "",
    phone: delivery?.phone || "",
    vehicle_number: delivery?.vehicle_number || "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Update local form state if user context updates asynchronously
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.delivery_profile?.name || "",
        email: user.email || "",
        phone: user.delivery_profile?.phone || "",
        vehicle_number: user.delivery_profile?.vehicle_number || "",
      });
    }
  }, [user]);

  // ── Password form state ─────────────────────────────────────────
  const [pwdForm, setPwdForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");

  // ── Shared toast ────────────────────────────────────────────────
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Handlers ────────────────────────────────────────────────────
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileLoading(true);
    try {
      await updateProfile(profileForm);
      // Refresh user in auth context by re-fetching /accounts/me/
      const res = await getMe();
      const stored = localStorage.getItem("access_token");
      if (stored) {
        // Manually update user in context without re-login
        window.dispatchEvent(new CustomEvent("auth:refresh", { detail: res.data }));
      }
      showToast("Profile updated successfully!");
    } catch (err) {
      const data = err.response?.data;
      const msg = data
        ? Object.values(data).flat().join(" ")
        : "Failed to update profile.";
      setProfileError(msg);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdError("");
    if (pwdForm.new_password !== pwdForm.confirm_password) {
      setPwdError("New passwords do not match.");
      return;
    }
    setPwdLoading(true);
    try {
      await changePassword(pwdForm.current_password, pwdForm.new_password);
      setPwdForm({ current_password: "", new_password: "", confirm_password: "" });
      showToast("Password changed successfully!");
    } catch (err) {
      const data = err.response?.data;
      const msg = data
        ? Object.values(data).flat().join(" ")
        : "Failed to change password.";
      setPwdError(msg);
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <Toast toast={toast} />

      {/* Page header */}
      <div className="page-header" style={{ marginBottom: 28 }}>
        <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "linear-gradient(135deg,var(--p),var(--p-dark))",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontFamily: "var(--fh)", fontWeight: 800, fontSize: "1rem",
          }}>
            {user?.username?.slice(0, 2).toUpperCase()}
          </div>
          My Profile
        </h1>
        <p>Manage your delivery driver information and account security</p>
      </div>

      {/* ── Profile info card ─────────────────────────────────── */}
      <div className="form-card" style={{ marginBottom: 20 }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <PencilSimple size={16} weight="duotone" style={{ color: "var(--p)" }} />
          Personal Information
        </h3>

        {profileError && (
          <div className="alert alert-error" style={{ marginBottom: 14 }}>{profileError}</div>
        )}

        <form onSubmit={handleProfileSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>
                <User size={13} style={{ marginRight: 5, verticalAlign: "middle", color: "var(--p)" }} />
                Full Name
              </label>
              <input
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="Your full name"
                required
              />
            </div>
            <div className="form-group">
              <label>
                <Phone size={13} style={{ marginRight: 5, verticalAlign: "middle", color: "var(--p)" }} />
                Phone Number
              </label>
              <input
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="98XXXXXXXX"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                <Envelope size={13} style={{ marginRight: 5, verticalAlign: "middle", color: "var(--p)" }} />
                Email Address
              </label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="form-group">
              <label>
                <Truck size={13} style={{ marginRight: 5, verticalAlign: "middle", color: "var(--p)" }} />
                Vehicle Number
              </label>
              <input
                value={profileForm.vehicle_number}
                onChange={(e) => setProfileForm({ ...profileForm, vehicle_number: e.target.value })}
                placeholder="e.g. BA 1 PA 1234"
              />
            </div>
          </div>

          {/* Read-only username */}
          <div className="form-group">
            <label style={{ color: "var(--txt-m)" }}>Username</label>
            <input
              value={user?.username || ""}
              disabled
              style={{ background: "var(--s2)", color: "var(--txt-m)", cursor: "not-allowed" }}
            />
            <div className="form-hint">Username cannot be changed.</div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={profileLoading}
            >
              {profileLoading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Password card ─────────────────────────────────────── */}
      <div className="form-card">
        <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ShieldCheck size={16} weight="duotone" style={{ color: "var(--p)" }} />
          Change Password
        </h3>

        {pwdError && (
          <div className="alert alert-error" style={{ marginBottom: 14 }}>{pwdError}</div>
        )}

        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group">
            <label>
              <Lock size={13} style={{ marginRight: 5, verticalAlign: "middle", color: "var(--p)" }} />
              Current Password
            </label>
            <input
              type="password"
              value={pwdForm.current_password}
              onChange={(e) => setPwdForm({ ...pwdForm, current_password: e.target.value })}
              placeholder="Enter current password"
              required
              autoComplete="current-password"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={pwdForm.new_password}
                onChange={(e) => setPwdForm({ ...pwdForm, new_password: e.target.value })}
                placeholder="Min 6 characters"
                minLength={6}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={pwdForm.confirm_password}
                onChange={(e) => setPwdForm({ ...pwdForm, confirm_password: e.target.value })}
                placeholder="Repeat new password"
                minLength={6}
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={pwdLoading}
            >
              {pwdLoading ? "Changing…" : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}