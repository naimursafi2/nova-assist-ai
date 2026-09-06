import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

const API_URL = import.meta.env.VITE_API_URL || "";

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  profileImage: string;
  plan: string;
  role?: string;
  trialStartDate: string;
  trialEndDate: string;
  dailyUsage: number;
  messageCount: number;
  lastUsageReset: string;
  createdAt: string;
  lastLoginAt: string;
}

export type AuthUser = Pick<FirebaseUser, "uid" | "displayName" | "email" | "photoURL"> & { isLocal?: boolean };

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  loggingIn: boolean;
  syncError: string | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
  refreshProfile: () => Promise<void>;
  bumpLocalUsage: () => void;
  trialDaysRemaining: number;
  isTrialActive: boolean;
  planLimits: { messages: number };
}

const planMessageLimits: Record<string, number> = {
  guest: 5,
  basic: 50,
  advanced: 200,
  pro: 9999,
};

const AuthContext = createContext<AuthContextType | null>(null);
const LOCAL_USER_KEY = "nova-local-user";
const LOCAL_PROFILE_KEY = "nova-local-profile";

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

function freshLocalProfile(uid: string, name: string, email: string): UserProfile {
  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + 30);
  return {
    userId: uid,
    name,
    email,
    profileImage: "",
    plan: "basic",
    role: "user",
    trialStartDate: now.toISOString(),
    trialEndDate: trialEnd.toISOString(),
    dailyUsage: 0,
    messageCount: 0,
    lastUsageReset: now.toISOString().split("T")[0],
    createdAt: now.toISOString(),
    lastLoginAt: now.toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const firebaseUserRef = useRef<FirebaseUser | null>(null);

  const createLocalProfile = useCallback((name = "Local User") => {
    const localUser: AuthUser = { uid: "local-user", displayName: name, email: "local@nova.app", photoURL: "", isLocal: true };
    const stored = localStorage.getItem(LOCAL_PROFILE_KEY);
    const localProfile = stored ? (JSON.parse(stored) as UserProfile) : freshLocalProfile(localUser.uid, name, localUser.email || "");
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUser));
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(localProfile));
    setUser(localUser);
    setProfile(localProfile);
    return { user: localUser, profile: localProfile };
  }, []);

  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (!firebaseUserRef.current) return null;
    try {
      return await firebaseUserRef.current.getIdToken();
    } catch {
      return null;
    }
  }, []);

  const syncProfileFromServer = useCallback(async (fbUser: FirebaseUser) => {
    if (!API_URL) {
      setSyncError("VITE_API_URL is not set. Signed in, but your plan, usage, and chats will only be saved on this device.");
      createLocalProfile(fbUser.displayName || "User");
      return;
    }
    try {
      const token = await fbUser.getIdToken();
      const response = await fetch(`${API_URL}/api/users/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: fbUser.displayName, profileImage: fbUser.photoURL }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Server sync failed (${response.status})`);
      }
      const data = (await response.json()) as UserProfile;
      setProfile(data);
      setSyncError(null);
    } catch (error) {
      setSyncError(
        (error instanceof Error ? error.message : "Could not sync your profile with the server.") +
          " Your plan, usage, and chats will only be saved on this device until this is resolved."
      );
      createLocalProfile(fbUser.displayName || "User");
    }
  }, [createLocalProfile]);

  const refreshProfile = useCallback(async () => {
    if (!API_URL || !firebaseUserRef.current) return;
    try {
      const token = await firebaseUserRef.current.getIdToken();
      const response = await fetch(`${API_URL}/api/users/${firebaseUserRef.current.uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = (await response.json()) as UserProfile;
      setProfile(data);
    } catch {
      /* keep existing profile on transient failure */
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      firebaseUserRef.current = fbUser;
      if (fbUser) {
        setUser({ uid: fbUser.uid, displayName: fbUser.displayName, email: fbUser.email, photoURL: fbUser.photoURL });
        await syncProfileFromServer(fbUser);
      } else {
        const localUser = localStorage.getItem(LOCAL_USER_KEY);
        const localProfile = localStorage.getItem(LOCAL_PROFILE_KEY);
        if (localUser && localProfile) {
          setUser(JSON.parse(localUser));
          setProfile(JSON.parse(localProfile));
        } else {
          createLocalProfile();
        }
      }
      setLoading(false);
      setLoggingIn(false);
    });
    return unsub;
  }, [createLocalProfile, syncProfileFromServer]);

  const loginWithGoogle = async () => {
    setLoggingIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch {
      setLoggingIn(false);
      throw new Error("Google sign-in was cancelled or failed.");
    }
  };

  const logout = async () => {
    localStorage.removeItem(LOCAL_USER_KEY);
    localStorage.removeItem(LOCAL_PROFILE_KEY);
    setSyncError(null);
    await signOut(auth).catch(() => undefined);
    createLocalProfile();
  };

  // Optimistic local bump right after a successful AI reply so the UI feels instant;
  // the server is the authority and increments the real counters on /api/chat.
  const bumpLocalUsage = useCallback(() => {
    setProfile((prev) => (prev ? { ...prev, dailyUsage: prev.dailyUsage + 1, messageCount: prev.messageCount + 1 } : prev));
    if (user?.isLocal) {
      const stored = localStorage.getItem(LOCAL_PROFILE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile;
        parsed.dailyUsage += 1;
        parsed.messageCount += 1;
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(parsed));
      }
    }
  }, [user?.isLocal]);

  const trialEnd = profile ? new Date(profile.trialEndDate) : new Date();
  const now = new Date();
  const trialDaysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const isTrialActive = trialDaysRemaining > 0;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        loggingIn,
        syncError,
        loginWithGoogle,
        logout,
        getIdToken,
        refreshProfile,
        bumpLocalUsage,
        trialDaysRemaining,
        isTrialActive,
        planLimits: { messages: planMessageLimits[profile?.plan || "guest"] },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
