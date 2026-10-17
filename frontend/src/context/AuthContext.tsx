"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export interface MongoUser {
  _id: string;
  firebase_uid: string;
  email: string;
  name: string;
  photo_url?: string;
  role: string;
  initial_auth_provider: string;
  providers: string[];
  email_verified: boolean;
  created_at: string;
  last_login: string;
}

interface AuthContextType {
  user: User | null;
  mongoUser: MongoUser | null;
  loading: boolean;
  syncing: boolean;
  error: string | null;
  clearError: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<string>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
  refetchMongoUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  mongoUser: null,
  loading: true,
  syncing: false,
  error: null,
  clearError: () => {},
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  sendPasswordReset: async () => "",
  logout: async () => {},
  getIdToken: async () => null,
  refetchMongoUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [mongoUser, setMongoUser] = useState<MongoUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Sync Firebase user with FastAPI -> MongoDB Atlas
  const syncWithBackend = useCallback(async (currentUser: User) => {
    setSyncing(true);
    try {
      // Gather all active providers (e.g. ['google.com', 'password'])
      const providers = currentUser.providerData.map((p) => p.providerId);
      const primaryProvider = providers[0] || "google.com";

      const payload = {
        firebase_uid: currentUser.uid,
        email: currentUser.email || "",
        name: currentUser.displayName || (currentUser.email ? currentUser.email.split("@")[0] : "Student"),
        photo_url: currentUser.photoURL || undefined,
        auth_provider: primaryProvider === "password" ? "email_password" : "google",
        providers: providers.length > 0 ? providers : [primaryProvider],
        email_verified: currentUser.emailVerified,
      };

      const res = await fetch(`${apiUrl}/api/auth/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setMongoUser(data.user);
      } else {
        console.warn("Backend user sync failed:", await res.text());
      }
    } catch (err: unknown) {
      console.error("Failed to sync user with backend:", err);
    } finally {
      setSyncing(false);
    }
  }, [apiUrl]);

  const refetchMongoUser = async () => {
    if (user) {
      await syncWithBackend(user);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          await syncWithBackend(currentUser);
        } else {
          setMongoUser(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Firebase auth state error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [syncWithBackend]);

  const clearError = () => setError(null);

  // 1. Google Sign In
  const signInWithGoogle = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      console.error("Error signing in with Google:", err);
      if (err instanceof Error) {
        // Handle common Firebase popup cancel without loud error
        if (err.message.includes("auth/popup-closed-by-user") || err.message.includes("cancelled-popup-request")) {
          setError("Sign-in popup was closed before completing.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to sign in with Google.");
      }
    }
  };

  // 2. Email & Password Sign In
  const signInWithEmail = async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: unknown) {
      console.error("Error signing in with email:", err);
      if (err instanceof Error) {
        if (err.message.includes("auth/operation-not-allowed")) {
          setError("Email/Password sign-in is not enabled in your Firebase Console. Go to Firebase Console > Authentication > Sign-in method and enable 'Email/Password'.");
        } else if (err.message.includes("auth/invalid-credential") || err.message.includes("auth/wrong-password")) {
          setError("Invalid email or password. If you originally signed up with Google, use 'Forgot Password?' to set a password for this account.");
        } else if (err.message.includes("auth/user-not-found")) {
          setError("No account found with this email. Please sign up or sign in with Google.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to sign in with email.");
      }
      throw err;
    }
  };

  // 3. Email & Password Sign Up
  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    setError(null);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (displayName && userCred.user) {
        await updateProfile(userCred.user, { displayName: displayName.trim() });
        setUser({ ...userCred.user, displayName: displayName.trim() });
      }
    } catch (err: unknown) {
      console.error("Error signing up with email:", err);
      if (err instanceof Error) {
        if (err.message.includes("auth/operation-not-allowed")) {
          setError("Email/Password sign-in is not enabled in your Firebase Console. Go to Firebase Console > Authentication > Sign-in method and enable 'Email/Password'.");
        } else if (err.message.includes("auth/email-already-in-use")) {
          setError("This email is already in use. If you signed in with Google, use 'Forgot Password?' to add password access.");
        } else if (err.message.includes("auth/weak-password")) {
          setError("Password should be at least 6 characters.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to create account.");
      }
      throw err;
    }
  };

  // 4. Send Password Reset (Enables Google users to set a password & link methods)
  const sendPasswordReset = async (email: string): Promise<string> => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return `Password reset link sent to ${email.trim()}! Check your inbox to set your password. Once set, you can sign in with either Google or your new password.`;
    } catch (err: unknown) {
      console.error("Error sending password reset email:", err);
      if (err instanceof Error) {
        setError(err.message);
        throw err;
      }
      throw new Error("Failed to send password reset email.");
    }
  };

  // 5. Sign Out
  const logout = async () => {
    setError(null);
    try {
      await firebaseSignOut(auth);
      setMongoUser(null);
    } catch (err: unknown) {
      console.error("Error signing out:", err);
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    if (!user) return null;
    return await user.getIdToken();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        mongoUser,
        loading,
        syncing,
        error,
        clearError,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendPasswordReset,
        logout,
        getIdToken,
        refetchMongoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
