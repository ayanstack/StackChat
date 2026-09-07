import React, { useState, useEffect } from "react";
import { X, LogIn, UserPlus, Layers, Loader, Eye, EyeOff, AlertCircle, KeyRound, CheckCircle2, ArrowLeft, ShieldCheck, Lock, Mail, User } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { authApi } from "../services/api.js";

export default function AuthModal({ onClose, initialMode = "login", initialToken = "" }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode); // "login" | "register" | "forgot" | "reset"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetCodeOrToken, setResetCodeOrToken] = useState(initialToken);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialToken) {
      setResetCodeOrToken(initialToken);
      setMode("reset");
    }
  }, [initialToken]);

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
        setSuccessMsg(res.message || "A 6-digit reset code and link have been sent to your email.");
        if (res.data?.devOtp) {
          setResetCodeOrToken(res.data.devOtp);
        }
        setMode("reset");
      } else if (mode === "reset") {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters");
        }
        const res = await authApi.resetPassword({
          token: resetCodeOrToken.trim(),
          newPassword: password,
        });
        setSuccessMsg(res.message || "Password has been reset successfully! Please sign in.");
        setPassword("");
        setConfirmPassword("");
        setResetCodeOrToken("");
        setMode("login");
      }
    } catch (err) {
      setLocalError(
        err.message ||
          (mode === "login"
            ? "Login failed"
            : mode === "register"
            ? "Registration failed"
            : mode === "forgot"
            ? "Failed to send reset code"
            : "Failed to reset password")
      );
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
          maxWidth: 420,
          padding: "30px 26px",
          position: "relative",
          borderRadius: "var(--radius-xl)",
          animation: "messageAppear 0.2s ease-out",
        }}
      >
        <button
          className="btn-icon"
          style={{ position: "absolute", top: 14, right: 14 }}
          onClick={onClose}
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div
            className="brand-glyph"
            style={{
              width: 44,
              height: 44,
              margin: "0 auto 12px",
              borderRadius: "var(--radius-lg)",
            }}
          >
            {mode === "forgot" ? (
              <KeyRound size={22} />
            ) : mode === "reset" ? (
              <ShieldCheck size={22} />
            ) : (
              <Layers size={22} />
            )}
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
            {mode === "login"
              ? "Sign in to StackChat"
              : mode === "register"
              ? "Create your workspace"
              : mode === "forgot"
              ? "Reset your password"
              : "Set new password"}
          </h2>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 4, lineHeight: 1.45 }}>
            {mode === "login"
              ? "Enter your credentials to access your chats"
              : mode === "register"
              ? "Start chatting with intelligent capabilities"
              : mode === "forgot"
              ? "Enter your registered email to receive a 6-digit reset code & link"
              : "Enter your 6-digit code or link token, then choose a new password"}
          </p>
        </div>

        {/* Mode Switcher Tabs (Only in login/register) */}
        {mode === "login" || mode === "register" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              padding: 3,
              background: "var(--bg-surface)",
              borderRadius: "var(--radius-md)",
              marginBottom: 18,
              border: "1px solid var(--border-hairline)",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setLocalError("");
                setSuccessMsg("");
              }}
              style={{
                padding: "7px 0",
                background: mode === "login" ? "var(--bg-surface-elevated)" : "transparent",
                color: mode === "login" ? "var(--text-primary)" : "var(--text-muted)",
                fontWeight: mode === "login" ? 600 : 500,
                fontSize: "0.82rem",
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
              onClick={() => {
                setMode("register");
                setLocalError("");
                setSuccessMsg("");
              }}
              style={{
                padding: "7px 0",
                background: mode === "register" ? "var(--bg-surface-elevated)" : "transparent",
                color: mode === "register" ? "var(--text-primary)" : "var(--text-muted)",
                fontWeight: mode === "register" ? 600 : 500,
                fontSize: "0.82rem",
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

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "register" && (
            <div className="input-group" style={{ marginBottom: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <User size={13} color="var(--accent-primary)" />
                <label className="input-label" style={{ marginBottom: 0 }}>Full Name</label>
              </div>
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

          {mode !== "reset" && (
            <div className="input-group" style={{ marginBottom: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <Mail size={13} color="var(--accent-primary)" />
                <label className="input-label" style={{ marginBottom: 0 }}>Email Address</label>
              </div>
              <input
                type="email"
                className="input-field"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          {/* Reset Code / Token Input (in reset mode) */}
          {mode === "reset" && (
            <div className="input-group" style={{ marginBottom: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <KeyRound size={13} color="var(--accent-primary)" />
                <label className="input-label" style={{ marginBottom: 0 }}>6-Digit Code or Reset Token</label>
              </div>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. 742918"
                value={resetCodeOrToken}
                onChange={(e) => setResetCodeOrToken(e.target.value)}
                required
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  letterSpacing: "0.08em",
                  fontSize: "0.95rem",
                }}
              />
            </div>
          )}

          {/* PROPERLY DEDICATED PASSWORD SECTION (Visible in login, register, and reset) */}
          {mode !== "forgot" && (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-hairline)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Lock size={13} color="var(--accent-primary)" />
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>
                    {mode === "reset" ? "New Password" : "Password"}
                  </span>
                </div>
                {mode === "login" && (
                  <button
                    type="button"
                    id="forgot-password-link"
                    onClick={() => {
                      setMode("forgot");
                      setLocalError("");
                      setSuccessMsg("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--accent-primary)",
                      fontSize: "0.76rem",
                      fontWeight: 500,
                      cursor: "pointer",
                      padding: "0 2px",
                      transition: "color 0.15s ease",
                      textDecoration: "underline",
                      textUnderlineOffset: "2px",
                    }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="input-field"
                  placeholder={mode === "login" ? "••••••••" : "At least 8 characters"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  style={{ paddingRight: 38, background: "var(--bg-surface-elevated)" }}
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
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {mode === "register" && (
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                  <ShieldCheck size={11} color="var(--accent-emerald)" />
                  <span>Must be at least 8 characters long</span>
                </div>
              )}
            </div>
          )}

          {/* Confirm password field in reset mode */}
          {mode === "reset" && (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-hairline)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Lock size={13} color="var(--accent-primary)" />
                <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  Confirm New Password
                </span>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="input-field"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  style={{ paddingRight: 38, background: "var(--bg-surface-elevated)" }}
                />
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: 4,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 28,
                    height: 28,
                  }}
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{
              height: 40,
              marginTop: 4,
              fontSize: "0.86rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: submitting ? 0.85 : 1,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? (
              <>
                <Loader size={16} className="spin" />
                <span>
                  {mode === "login"
                    ? "Signing in..."
                    : mode === "register"
                    ? "Creating account..."
                    : mode === "forgot"
                    ? "Sending reset code..."
                    : "Resetting password..."}
                </span>
              </>
            ) : mode === "login" ? (
              <><LogIn size={15} /> Sign In</>
            ) : mode === "register" ? (
              <><UserPlus size={15} /> Get Started</>
            ) : mode === "forgot" ? (
              <><KeyRound size={15} /> Send Reset Code & Link</>
            ) : (
              <><ShieldCheck size={15} /> Reset Password & Sign In</>
            )}
          </button>

          {(mode === "forgot" || mode === "reset") && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setLocalError("");
                  setSuccessMsg("");
                }}
                className="btn btn-ghost"
                style={{ height: 32, fontSize: "0.8rem", color: "var(--text-muted)" }}
              >
                <ArrowLeft size={13} /> Back to Sign In
              </button>

              {mode === "forgot" ? (
                <button
                  type="button"
                  onClick={() => {
                    setMode("reset");
                    setLocalError("");
                    setSuccessMsg("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--accent-primary)",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    textDecoration: "underline",
                    textUnderlineOffset: "2px",
                  }}
                >
                  Already have a code?
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setLocalError("");
                    setSuccessMsg("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    textDecoration: "underline",
                    textUnderlineOffset: "2px",
                  }}
                >
                  Request new code
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

