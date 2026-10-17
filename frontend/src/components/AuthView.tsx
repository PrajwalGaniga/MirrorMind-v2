"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export const AuthView: React.FC = () => {
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendPasswordReset,
    error: authError,
    clearError,
  } = useAuth();

  const [authMode, setAuthMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [emailInput, setEmailInput] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [displayNameInput, setDisplayNameInput] = useState<string>("");
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setNotice(null);
    setFormSubmitting(true);

    try {
      if (authMode === "signin") {
        await signInWithEmail(emailInput, passwordInput);
      } else if (authMode === "signup") {
        await signUpWithEmail(emailInput, passwordInput, displayNameInput);
        setNotice("Account created successfully! Welcome to MirrorMind.");
      } else if (authMode === "forgot") {
        const msg = await sendPasswordReset(emailInput);
        setNotice(msg);
      }
    } catch {
      // Errors handled in AuthContext
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="auth-view-container">
      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-brand-header">
          <div className="auth-icon-large">M</div>
          <h2>Welcome to MirrorMind v2</h2>
          <p>
            AI-Driven Engineering Career Intelligence, Neural Skill Mapping &amp; Placement Readiness
          </p>
        </div>

        {/* Alerts */}
        {notice && <div className="auth-success-alert">✅ {notice}</div>}
        {authError && (
          <div className="auth-alert-error">
            ⚠️ <strong>Authentication Notice:</strong> {authError}
          </div>
        )}

        {/* 1-Click Google Sign-In */}
        <button
          id="google-signin-btn"
          onClick={signInWithGoogle}
          className="google-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="auth-divider">
          <span>or sign in with email</span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {authMode === "signup" && (
            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text"
                value={displayNameInput}
                onChange={(e) => setDisplayNameInput(e.target.value)}
                placeholder="Prajwal Ganiga"
                required
                className="custom-input"
              />
            </div>
          )}

          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="prajwal@mirrormind.ai"
              required
              className="custom-input"
            />
          </div>

          {authMode !== "forgot" && (
            <div className="input-group">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <label>Password</label>
                {authMode === "signin" && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("forgot");
                      clearError();
                    }}
                    className="link-btn"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                required
                className="custom-input"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={formSubmitting}
            className="primary-button"
            style={{ width: "100%", marginTop: "12px" }}
          >
            {formSubmitting
              ? "Connecting..."
              : authMode === "signin"
              ? "Sign In"
              : authMode === "signup"
              ? "Create Free Account"
              : "Send Password Reset Link"}
          </button>
        </form>

        {/* Mode Switcher */}
        <div className="auth-footer-links">
          {authMode === "signin" ? (
            <p>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signup");
                  clearError();
                }}
                className="link-highlight"
              >
                Sign up
              </button>
            </p>
          ) : authMode === "signup" ? (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signin");
                  clearError();
                }}
                className="link-highlight"
              >
                Sign in
              </button>
            </p>
          ) : (
            <p>
              Remembered your password?{" "}
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signin");
                  clearError();
                }}
                className="link-highlight"
              >
                Back to Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
