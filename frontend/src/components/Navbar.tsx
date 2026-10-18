"use client";

import React, { useState } from "react";
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
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

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
    "Prajwal";

  const displayEmail =
    studentEmail ||
    studentProfile?.email ||
    authUser?.email ||
    "prajwal.seed@mirrormind.ai";

  const navItems = [
    { label: "Home", href: "/", icon: "🏠" },
    { label: "Profile", href: "/profile", icon: "👤" },
    { label: "Projects & Internships", href: "/profile#projects", icon: "📁" },
    { label: "ML / DL", href: "/ml-visualizer", icon: "🧠" },
    { label: "Portfolio", href: "/portfolio", icon: "✨" },
    { label: "Voice Studio", href: "/voice-chat", icon: "🎙️" },
  ];

  return (
    <header style={{ width: "100%", marginBottom: "20px" }}>
      {/* Floating Dark Charcoal Navbar Banner */}
      <div className="navbar-banner-dark">
        {/* Left: Brand Identity / Student Persona */}
        <Link href="/" className="nav-brand-container">
          <div className="nav-brand-avatar">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="nav-brand-info">
            <h2>{displayName}</h2>
            <p>Student Digital Twin &amp; AI Voice Co-Pilot</p>
          </div>
        </Link>

        {/* Center: Desktop Pill Navigation */}
        <nav className="nav-pills-row" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : item.href.startsWith("/profile#")
                ? pathname === "/profile"
                : pathname === item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`nav-pill-item ${isActive ? "active" : "inactive"}`}
              >
                <span style={{ fontSize: "0.85rem" }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Controls & User Actions */}
        <div className="nav-controls-right">
          {/* Theme Toggle (Sun/Moon) */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="nav-icon-btn"
            title="Toggle theme appearance"
            aria-label="Toggle theme appearance"
          >
            <span>{isDarkMode ? "🌙" : "☀️"}</span>
          </button>

          {/* Notifications Bell */}
          <button
            className="nav-icon-btn"
            title="System notifications"
            aria-label="System notifications"
          >
            <span>🔔</span>
            <span className="nav-notification-dot" />
          </button>

          {/* User Profile Pill & Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="nav-user-pill"
              aria-expanded={userDropdownOpen}
              aria-label="User account menu"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={26}
                  height={26}
                  className="nav-user-avatar"
                  unoptimized={avatarUrl.startsWith("http")}
                />
              ) : (
                <div className="nav-user-avatar">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span>{displayName.split(" ")[0]}</span>
              <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>▼</span>
            </button>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 8px)",
                  background: "#202120",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  borderRadius: "16px",
                  padding: "12px 14px",
                  minWidth: "220px",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
                  zIndex: 100,
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ paddingBottom: "8px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#FFFFFF" }}>{displayName}</div>
                  <div style={{ fontSize: "0.74rem", color: "#9CA3AF" }}>{displayEmail}</div>
                </div>

                {/* Status Badges */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.74rem", color: "#D1D5DB" }}>
                    <span>MongoDB Atlas:</span>
                    <span style={{ color: dbConnected ? "#10B981" : "#F59E0B", fontWeight: 600 }}>
                      {dbConnected ? "Connected" : "Syncing"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.74rem", color: "#D1D5DB" }}>
                    <span>PyTorch Neural Net:</span>
                    <span style={{ color: mlLoaded ? "#60A5FA" : "#F59E0B", fontWeight: 600 }}>
                      {mlLoaded ? "Active (384-D)" : "Loading"}
                    </span>
                  </div>
                </div>

                {/* Profile Link */}
                <Link
                  href="/profile"
                  onClick={() => setUserDropdownOpen(false)}
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "var(--accent)",
                    textDecoration: "none",
                    padding: "6px 0",
                    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  📋 Career Dossier Studio
                </Link>

                {/* Logout Button */}
                {onLogout && (
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onLogout();
                    }}
                    style={{
                      background: "rgba(239, 68, 68, 0.15)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      borderRadius: "8px",
                      color: "#FCA5A5",
                      padding: "6px 12px",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    Sign Out
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle (< 768px) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="nav-icon-btn"
            style={{ display: "none" }}
            id="mobile-menu-toggle"
            title="Open navigation menu"
            aria-label="Open navigation menu"
          >
            <span>{mobileMenuOpen ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            marginTop: "10px",
            background: "var(--charcoal)",
            borderRadius: "16px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                borderRadius: "10px",
                color: pathname === item.href ? "var(--charcoal)" : "#FFFFFF",
                background: pathname === item.href ? "var(--accent)" : "transparent",
                fontWeight: pathname === item.href ? 700 : 500,
                textDecoration: "none",
                fontSize: "0.85rem",
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};
