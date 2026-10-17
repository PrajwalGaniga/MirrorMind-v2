"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { User } from "firebase/auth";

import { MongoUser } from "@/context/AuthContext";
import { StudentProfile } from "@/types/student";

interface NavbarProps {
  authUser: User | null;
  mongoUser: MongoUser | null;
  studentProfile: StudentProfile | null;
  currentView: "auth" | "onboarding" | "dashboard";
  onNavigate: (view: "onboarding" | "dashboard") => void;
  onLogout: () => void;
  dbConnected: boolean;
  backendOnline: boolean;
  mlLoaded: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  authUser,
  mongoUser,
  studentProfile,
  currentView,
  onNavigate,
  onLogout,
  dbConnected,
  backendOnline,
  mlLoaded,
}) => {
  // Determine avatar to show: studentProfile avatar, authUser photo, or fallback
  const avatarUrl =
    studentProfile?.avatar_url ||
    authUser?.photoURL ||
    mongoUser?.photo_url;

  const displayName =
    studentProfile?.name ||
    authUser?.displayName ||
    mongoUser?.name ||
    "Student";

  return (
    <header className="navbar-header">
      {/* Brand Identity */}
      <div className="brand" onClick={() => onNavigate("dashboard")} style={{ cursor: "pointer" }}>
        <div className="brand-icon">M</div>
        <div className="brand-text">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h1 style={{ fontSize: "1.25rem", margin: 0 }}>MirrorMind v2</h1>
            <span className="version-pill">AI Engine 2.0</span>
          </div>
          <p style={{ fontSize: "0.78rem", margin: 0, color: "var(--text-muted)" }}>
            Deep Career Intelligence &amp; Neural Skill Radar
          </p>
        </div>
      </div>

      {/* Status Badges & User Area */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        {/* MongoDB Status */}
        <div
          className={`status-badge ${dbConnected ? "connected" : "connecting"}`}
          title="MongoDB Atlas Connection Status"
        >
          <span className="pulse-dot"></span>
          <span>{dbConnected ? "MongoDB: Atlas" : "MongoDB: Syncing"}</span>
        </div>

        {/* FastAPI Status */}
        <div
          className={`status-badge ${backendOnline ? "connected" : "error"}`}
          title="FastAPI Backend Status"
        >
          <span className="pulse-dot"></span>
          <span>{backendOnline ? "FastAPI: 8000" : "FastAPI: Offline"}</span>
        </div>

        {/* PyTorch ML Status */}
        <div
          className={`status-badge ${mlLoaded ? "connected" : "connecting"}`}
          title="PyTorch CareerMLP & SentenceTransformer Status"
        >
          <span className="pulse-dot"></span>
          <span>{mlLoaded ? "PyTorch: CareerMLP" : "ML: Loading"}</span>
        </div>

        {/* Voice AI Mentor Navigation Link */}
        <Link
          href="/voice-chat"
          className="secondary-button"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            textDecoration: "none",
            padding: "6px 14px",
            fontSize: "0.82rem",
            fontWeight: 600,
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(6, 182, 212, 0.25))",
            borderColor: "rgba(6, 182, 212, 0.4)",
            color: "#38bdf8",
            borderRadius: "20px",
          }}
          title="Open Real-Time Voice AI Companion"
        >
          <span>🎙️</span>
          <span>Voice AI</span>
        </Link>


        {/* User Pill & Navigation */}
        {authUser && (
          <div className="user-profile-bar">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={32}
                height={32}
                className="user-avatar"
                unoptimized={avatarUrl.startsWith("http")}
              />
            ) : (
              <div className="user-avatar-fallback">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="user-info">
              <span className="user-name">{displayName}</span>
              <span className="user-email">{authUser.email}</span>
            </div>

            {/* View Switcher Button */}
            {studentProfile && (
              <button
                onClick={() =>
                  onNavigate(currentView === "dashboard" ? "onboarding" : "dashboard")
                }
                className="secondary-button"
                style={{
                  padding: "5px 12px",
                  fontSize: "0.78rem",
                  marginLeft: "4px",
                }}
              >
                {currentView === "dashboard" ? "✏️ Edit Profile" : "📊 Dashboard"}
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="logout-btn"
              title="Sign out of MirrorMind"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
