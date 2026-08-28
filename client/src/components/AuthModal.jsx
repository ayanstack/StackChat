import React, { useState } from "react";
import { X, LogIn, UserPlus, Layers, Loader, Eye, EyeOff, AlertCircle, KeyRound, CheckCircle2, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { authApi } from "../services/api.js";

export default function AuthModal({ onClose }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "register" | "forgot"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setSuccessMsg("");
    try {
      setSubmitting(true);
      if (mode === "login") {
        await login(email, password);
        onClose();
      } else if (mode === "register") {
        await register(name, email, password);
        onClose();
      } else if (mode === "forgot") {
        const res = await authApi.forgotPassword(email);
        setSuccessMsg(res.message || "If that email exists, a password reset link has been sent.");
      }
    } catch (err) {
      setLocalError(err.message || (mode === "login" ? "Login failed" : mode === "register" ? "Registration failed" : "Request failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(9, 10, 15, 0.75)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="card-elevated"
        style={{
          width: "100%",
          maxWidth: 400,
          padding: "32px 28px",
          position: "relative",
          borderRadius: "var(--radius-xl)",
          animation: "messageAppear 0.2s ease-out",
        }}
      >
        <button
          className="btn-icon"
          style={{ position: "absolute", top: 14, right: 14 }}
          onClick={onClose}
        >
          <X size={16} />
        </button>

        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            className="brand-glyph"
            style={{
              width: 40,
              height: 40,
              margin: "0 auto 12px",
              borderRadius: "var(--radius-lg)",
            }}
          >
            {mode === "forgot" ? <KeyRound size={20} /> : <Layers size={20} />}
          </div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
            {mode === "login"
              ? "Sign in to StackChat"
              : mode === "register"
              ? "Create your workspace"
              : "Reset your password"}
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>
            {mode === "login"
              ? "Enter your credentials to access your chats"
              : mode === "register"
              ? "Start chatting with intelligent capabilities"
              : "Enter your registered email to receive a password reset link"}
          </p>
        </div>

        {/* Mode Switcher Tabs (Only in login/register) */}
        {mode !== "forgot" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              padding: 3,
              background: "var(--bg-surface)",
              borderRadius: "var(--radius-md)",
              marginBottom: 20,
              border: "1px solid var(--border-hairline)",
            }}
          >
            <button
              type="button"
              onClick={() => { setMode("login"); setLocalError(""); setSuccessMsg(""); }}
              style={{
                padding: "6px 0",
                background: mode === "login" ? "var(--bg-surface-elevated)" : "transparent",
                color: mode === "login" ? "var(--text-primary)" : "var(--text-muted)",
                fontWeight: mode === "login" ? 600 : 500,
                fontSize: "0.8rem",
                border: "none",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setLocalError(""); setSuccessMsg(""); }}
              style={{
                padding: "6px 0",
                background: mode === "register" ? "var(--bg-surface-elevated)" : "transparent",
                color: mode === "register" ? "var(--text-primary)" : "var(--text-muted)",
                fontWeight: mode === "register" ? 600 : 500,
                fontSize: "0.8rem",
                border: "none",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Create Account
            </button>
          </div>
        ) : null}

        {localError && (
          <div
            style={{
              padding: "9px 12px",
              borderRadius: "var(--radius-md)",
              background: "rgba(244, 63, 94, 0.1)",
              border: "1px solid rgba(244, 63, 94, 0.25)",
              color: "var(--accent-rose)",
              fontSize: "0.8rem",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{localError}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: "9px 12px",
              borderRadius: "var(--radius-md)",
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              color: "var(--accent-emerald)",
              fontSize: "0.8rem",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "register" && (
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Full Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
              />
            </div>
          )}

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Email Address</label>
            <input
              type="email"
              className="input-field"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {mode !== "forgot" && (
            <div className="input-group" style={{ marginBottom: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label className="input-label">Password</label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => { setMode("forgot"); setLocalError(""); setSuccessMsg(""); }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      padding: 0,
                      marginBottom: 4,
                      transition: "color 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.target.style.color = "var(--text-primary)")}
                    onMouseLeave={(e) => (e.target.style.color = "var(--text-muted)")}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="input-field"
                  placeholder={mode === "register" ? "At least 8 characters" : "••••••••"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  style={{ paddingRight: 36 }}
                />
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 4,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 28,
                    height: 28,
                  }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ height: 38, marginTop: 6 }}
          >
            {submitting ? (
              <Loader size={14} className="spin" />
            ) : mode === "login" ? (
              <><LogIn size={14} /> Sign In</>
            ) : mode === "register" ? (
              <><UserPlus size={14} /> Get Started</>
            ) : (
              <><KeyRound size={14} /> Send Reset Link</>
            )}
          </button>

          {mode === "forgot" && (
            <button
              type="button"
              onClick={() => { setMode("login"); setLocalError(""); setSuccessMsg(""); }}
              className="btn btn-ghost"
              style={{ height: 34, fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}
            >
              <ArrowLeft size={13} /> Back to Sign In
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
