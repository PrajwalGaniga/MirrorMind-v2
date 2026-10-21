"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { AuthView } from "@/components/AuthView";
import { OnboardingForm } from "@/components/OnboardingForm";
import { DashboardView } from "@/components/DashboardView";
import { StudentProfile, PredictResponse } from "@/types/student";

interface SystemHealth {
  status: string;
  mongodb: boolean;
  gemini: boolean;
  cloudinary: boolean;
  ml_service_loaded: boolean;
}

export default function Home() {
  const {
    user: authUser,
    mongoUser,
    loading: authLoading,
    logout,
  } = useAuth();

  // Student Profile & ML state
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<"onboarding" | "dashboard">("dashboard");

  // Backend / Service Health
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://mirrormind-backend-z9vb.onrender.com";

  // Check system health
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/health`);
      if (res.ok) {
        const data: SystemHealth = await res.json();
        setHealth(data);
        setBackendOnline(true);
      } else {
        setBackendOnline(false);
      }
    } catch {
      setBackendOnline(false);
    }
  }, [apiUrl]);

  // Fetch Student Profile from MongoDB Atlas
  const fetchStudentProfile = useCallback(
    async (email: string) => {
      setProfileLoading(true);
      try {
        const res = await fetch(`${apiUrl}/api/student/profile/${encodeURIComponent(email)}`);
        if (res.ok) {
          const profileData: StudentProfile = await res.json();
          setStudentProfile(profileData);

          // If student already has stored predictions, construct initial PredictResponse
          if (profileData.predictions && profileData.predictions.length > 0) {
            const top = profileData.predictions[0];
            setPrediction({
              profile_text: `Engineering student with skills in ${profileData.skills.join(", ")}. CGPA ${profileData.cgpa}. Completed ${profileData.projects.length} projects and ${profileData.internships.length} internship(s).`,
              top_prediction: profileData.top_prediction || top.role,
              top_label: top.label,
              confidence: top.confidence,
              predictions: profileData.predictions,
              top_insight: profileData.top_insight,
              skill_radar: profileData.skill_radar,
              embedding_dim: 384,
            });
            setCurrentView("dashboard");
          } else {
            // Profile exists but no predictions yet -> trigger prediction
            await runPredictionForStudent(profileData);
            setCurrentView("dashboard");
          }
        } else if (res.status === 404) {
          // No profile in MongoDB -> user needs to onboard!
          setStudentProfile(null);
          setPrediction(null);
          setCurrentView("onboarding");
        }
      } catch (err: unknown) {
        console.error("Failed to fetch student profile:", err);
      } finally {
        setProfileLoading(false);
      }
    },
    [apiUrl]
  );

  // Trigger ML Career Prediction
  const runPredictionForStudent = async (profile: StudentProfile) => {
    try {
      const res = await fetch(`${apiUrl}/api/ml/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: profile.email,
          skills: profile.skills,
          cgpa: profile.cgpa,
          projects_count: profile.projects.length,
          internships_count: profile.internships.length,
        }),
      });

      if (res.ok) {
        const predData: PredictResponse = await res.json();
        setPrediction(predData);

        // Update local studentProfile state with predictions
        setStudentProfile((prev) =>
          prev
            ? {
                ...prev,
                predictions: predData.predictions,
                top_prediction: predData.top_prediction,
                top_insight: predData.top_insight,
                skill_radar: predData.skill_radar,
              }
            : null
        );
      }
    } catch (err: unknown) {
      console.error("Prediction trigger error:", err);
    }
  };

  // Initial Health Check
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // Sync / Load Profile on Auth Change
  useEffect(() => {
    if (authUser?.email) {
      fetchStudentProfile(authUser.email);
    } else {
      setStudentProfile(null);
      setPrediction(null);
      setProfileLoading(false);
    }
  }, [authUser, fetchStudentProfile]);

  // Handle Onboarding Completion
  const handleOnboardingSuccess = (
    savedProfile: StudentProfile,
    predictionResult: PredictResponse
  ) => {
    setStudentProfile(savedProfile);
    setPrediction(predictionResult);
    setCurrentView("dashboard");
  };

  // Loading State
  if (authLoading || (authUser && profileLoading)) {
    return (
      <div className="container" style={{ textAlign: "center", paddingTop: "120px" }}>
        <div className="spinner-glow" style={{ margin: "0 auto 20px" }}></div>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700 }}>MirrorMind v2</h2>
        <p style={{ color: "var(--text-muted)" }}>
          {authLoading ? "Synchronizing Authentication..." : "Loading Student Intelligence Profile..."}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Sticky Header / Navbar */}
      <Navbar
        authUser={authUser}
        mongoUser={mongoUser}
        studentProfile={studentProfile}
        currentView={authUser ? currentView : "auth"}
        onNavigate={(view) => setCurrentView(view)}
        onLogout={logout}
        dbConnected={health?.mongodb ?? true}
        backendOnline={backendOnline}
        mlLoaded={health?.ml_service_loaded ?? true}
      />

      <main className="container">
        {/* Unauthenticated View */}
        {!authUser && <AuthView />}

        {/* Authenticated Flow */}
        {authUser && (
          <>
            {/* If Student Profile does not exist OR user wants to edit profile */}
            {(!studentProfile || currentView === "onboarding") && (
              <OnboardingForm
                initialProfile={studentProfile}
                userEmail={authUser.email || ""}
                userName={authUser.displayName || mongoUser?.name || ""}
                userPhoto={authUser.photoURL || mongoUser?.photo_url}
                apiUrl={apiUrl}
                onSuccess={handleOnboardingSuccess}
                onCancel={studentProfile ? () => setCurrentView("dashboard") : undefined}
              />
            )}

            {/* If Student Profile exists AND user is in dashboard view */}
            {studentProfile && currentView === "dashboard" && (
              <DashboardView
                student={studentProfile}
                prediction={prediction}
                onEditProfile={() => setCurrentView("onboarding")}
                onRefreshPrediction={() => runPredictionForStudent(studentProfile)}
                apiUrl={apiUrl}
              />
            )}
          </>
        )}
      </main>
    </>
  );
}
