import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MirrorMind v2 | Autonomous AI Career Copilot & Neural Skill Engine",
  description: "AI-powered engineering career intelligence platform with PyTorch CareerMLP, 5-Pillar Skill Radar, Grounded RAG, and Autonomous Voice Copilot.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          <div className="app-shell-backdrop">
            <div className="app-shell">{children}</div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
