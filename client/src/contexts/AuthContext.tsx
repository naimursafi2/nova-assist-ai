import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from "firebase/auth";
import { ref, get, set, update } from "firebase/database";
import { auth, db, googleProvider } from "@/lib/firebase";

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  profileImage: string;
  plan: string;
  trialStartDate: string;
  trialEndDate: string;
  dailyUsage: number;
  messageCount: number;
  lastUsageReset: string;
  createdAt: string;
  lastLoginAt: string;
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  loggingIn: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  incrementUsage: () => Promise<boolean>;
  updatePlan: (plan: string) => Promise<void>;
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
type AuthUser = Pick<FirebaseUser, "uid" | "displayName" | "email" | "photoURL"> & { isLocal?: boolean };
const LOCAL_USER_KEY = "nova-local-user";
const LOCAL_PROFILE_KEY = "nova-local-profile";

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);

  const createLocalProfile = (name = "Local User") => {
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 30);
    const localUser: AuthUser = {
      uid: "local-user",
      displayName: name,
      email: "local@nova.app",
      photoURL: "",
      isLocal: true,
    };
    const storedProfile = localStorage.getItem(LOCAL_PROFILE_KEY);
    const localProfile: UserProfile = storedProfile
      ? JSON.parse(storedProfile)
      : {
          userId: localUser.uid,
          name,
          email: localUser.email || "",
          profileImage: "",
          plan: "basic",
          trialStartDate: now.toISOString(),
          trialEndDate: trialEnd.toISOString(),
          dailyUsage: 0,
          messageCount: 0,
          lastUsageReset: now.toISOString().split("T")[0],
          createdAt: now.toISOString(),
          lastLoginAt: now.toISOString(),
        };
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUser));
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(localProfile));
    setUser(localUser);
    setProfile(localProfile);
    return { user: localUser, profile: localProfile };
  };

  const loadOrCreateProfile = async (fbUser: FirebaseUser) => {
    const userRef = ref(db, `users/${fbUser.uid}`);
    const snapshot = await get(userRef);
    const now = new Date();

    if (snapshot.exists()) {
      const data = snapshot.val() as UserProfile;
      const today = now.toISOString().split("T")[0];
      const updates: Partial<UserProfile> = { lastLoginAt: now.toISOString() };
      if (data.lastUsageReset !== today) {
        updates.dailyUsage = 0;
        updates.lastUsageReset = today;
      }
      await update(userRef, updates);
      setProfile({ ...data, ...updates });
    } else {
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 30);

      const newProfile: UserProfile = {
        userId: fbUser.uid,
        name: fbUser.displayName || "User",
        email: fbUser.email || "",
        profileImage: fbUser.photoURL || "",
        plan: "basic",
        trialStartDate: now.toISOString(),
        trialEndDate: trialEnd.toISOString(),
        dailyUsage: 0,
        messageCount: 0,
        lastUsageReset: now.toISOString().split("T")[0],
        createdAt: now.toISOString(),
        lastLoginAt: now.toISOString(),
      };
      await set(userRef, newProfile);
      setProfile(newProfile);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        await loadOrCreateProfile(fbUser).catch(() => {
          createLocalProfile(fbUser.displayName || "Local User");
        });
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
  }, []);

  const loginWithGoogle = async () => {
    setLoggingIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      createLocalProfile();
      setLoggingIn(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem(LOCAL_USER_KEY);
    localStorage.removeItem(LOCAL_PROFILE_KEY);
    await signOut(auth).catch(() => undefined);
    createLocalProfile();
  };

  const incrementUsage = async (): Promise<boolean> => {
    const currentUser = user || createLocalProfile().user;
    const currentProfile = profile || createLocalProfile().profile;
    const limit = planMessageLimits[currentProfile.plan] || 5;
    if (currentProfile.dailyUsage >= limit) return false;

    const updated = {
      ...currentProfile,
      dailyUsage: currentProfile.dailyUsage + 1,
      messageCount: currentProfile.messageCount + 1,
    };
    if (currentUser.isLocal) {
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));
    } else {
      await update(ref(db, `users/${currentUser.uid}`), {
        dailyUsage: updated.dailyUsage,
        messageCount: updated.messageCount,
      }).catch(() => undefined);
    }
    setProfile(updated);
    setUser(currentUser);
    return true;
  };

  const updatePlan = async (plan: string) => {
    const currentUser = user || createLocalProfile().user;
    const currentProfile = profile || createLocalProfile().profile;
    const updated = { ...currentProfile, plan };
    if (currentUser.isLocal) {
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));
    } else {
      await update(ref(db, `users/${currentUser.uid}`), { plan }).catch(() => undefined);
    }
    setUser(currentUser);
    setProfile(updated);
  };

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
        loginWithGoogle,
        logout,
        incrementUsage,
        updatePlan,
        trialDaysRemaining,
        isTrialActive,
        planLimits: { messages: planMessageLimits[profile?.plan || "guest"] },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
