"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "firebase/auth";

import { MongoUser } from "@/context/AuthContext";
import { StudentProfile } from "@/types/student";

export interface NavbarProps {
  authUser?: User | null;
  mongoUser?: MongoUser | null;
  studentProfile?: StudentProfile | null;
  studentName?: string;
  studentEmail?: string;
  currentView?: "auth" | "onboarding" | "dashboard";
  onNavigate?: (view: "onboarding" | "dashboard") => void;
  onLogout?: () => void;
  dbConnected?: boolean;
  backendOnline?: boolean;
  mlLoaded?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  authUser = null,
  mongoUser = null,
  studentProfile = null,
  studentName,
  studentEmail,
  currentView = "dashboard",
  onNavigate,
  onLogout,
  dbConnected = true,
  backendOnline = true,
  mlLoaded = true,
}) => {
  const pathname = usePathname();

  // Determine avatar to show: studentProfile avatar, authUser photo, or fallback
  const avatarUrl =
    studentProfile?.avatar_url ||
    authUser?.photoURL ||
    mongoUser?.photo_url;

  const displayName =
    studentName ||
    studentProfile?.name ||
    authUser?.displayName ||
    mongoUser?.name ||
    "Student";

  const navItems = [
    { label: "Dashboard", href: "/", icon: "📊" },
    { label: "Career Dossier", href: "/profile", icon: "📋" },
    { label: "Knowledge Vault", href: "/knowledge-vault", icon: "📚" },
    { label: "ML Visualizer", href: "/ml-visualizer", icon: "🧠" },
    { label: "Public Portfolio", href: "/portfolio", icon: "✨" },
    { label: "Voice Studio", href: "/voice-chat", icon: "🎙️" },
  ];

  return (
    <header className="navbar-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "20px", borderBottom: "1px solid var(--border-subtle)", gap: "16px", flexWrap: "wrap" }}>
      {/* Brand Identity */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
        <div className="brand-icon" style={{ width: "38px", height: "38px", borderRadius: "10px", background: "var(--charcoal)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", fontWeight: 800, fontSize: "1.1rem", border: "1px solid rgba(0,0,0,0.1)" }}>
          M
        </div>
        <div className="brand-text">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h1 style={{ fontSize: "1.15rem", margin: 0, fontWeight: 700, color: "var(--text-primary)" }}>MirrorMind v2</h1>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: "12px", background: "var(--accent)", color: "var(--charcoal)" }}>
              AI 2.0
            </span>
          </div>
          <p style={{ fontSize: "0.76rem", margin: 0, color: "var(--text-secondary)" }}>
            Autonomous Career Intelligence &amp; Neural Radar
          </p>
        </div>
      </Link>

      {/* Editorial Pill Navigation */}
      <nav className="editorial-nav-pills" style={{ display: "inline-flex", background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-pill)", padding: "4px", gap: "2px", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "var(--radius-pill)",
                fontSize: "0.82rem",
                fontWeight: isActive ? 600 : 500,
                textDecoration: "none",
                color: isActive ? "#FFFFFF" : "var(--text-secondary)",
                background: isActive ? "var(--charcoal)" : "transparent",
                transition: "all 0.18s ease",
                boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.18)" : "none",
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* System Status Badges & User Area */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        {/* MongoDB Status */}
        <div
          className={`status-badge ${dbConnected ? "connected" : "connecting"}`}
          title="MongoDB Atlas Connection Status"
          style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", padding: "4px 10px", borderRadius: "999px", fontSize: "0.76rem" }}
        >
          <span className="pulse-dot" style={{ background: dbConnected ? "#10b981" : "#f59e0b", width: "6px", height: "6px" }}></span>
          <span>{dbConnected ? "Atlas" : "Syncing"}</span>
        </div>

        {/* PyTorch ML Status */}
        <div
          className={`status-badge ${mlLoaded ? "connected" : "connecting"}`}
          title="PyTorch CareerMLP Status"
          style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", padding: "4px 10px", borderRadius: "999px", fontSize: "0.76rem" }}
        >
          <span className="pulse-dot" style={{ background: mlLoaded ? "#6366f1" : "#f59e0b", width: "6px", height: "6px" }}></span>
          <span>{mlLoaded ? "PyTorch" : "ML"}</span>
        </div>



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

            {/* Profile Link */}
            {studentProfile && (
              <Link
                href="/profile"
                className="secondary-button"
                style={{
                  padding: "5px 12px",
                  fontSize: "0.78rem",
                  marginLeft: "4px",
                  textDecoration: "none",
                  borderRadius: "var(--radius-pill)",
                }}
              >
                ✏️ Profile Dossier
              </Link>
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
