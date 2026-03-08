import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { ref, get, set } from "firebase/database";
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
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  incrementUsage: () => Promise<boolean>;
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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOrCreateProfile = async (fbUser: User) => {
    const userRef = ref(db, `users/${fbUser.uid}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const data = snapshot.val() as UserProfile;
      // Reset daily usage if needed
      const today = new Date().toISOString().split("T")[0];
      if (data.lastUsageReset !== today) {
        data.dailyUsage = 0;
        data.lastUsageReset = today;
        await set(userRef, data);
      }
      setProfile(data);
    } else {
      const now = new Date();
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
      };
      await set(userRef, newProfile);
      setProfile(newProfile);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        await loadOrCreateProfile(fbUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const incrementUsage = async (): Promise<boolean> => {
    if (!user || !profile) return true; // guest mode, handled by parent
    const limit = planMessageLimits[profile.plan] || 5;
    if (profile.dailyUsage >= limit) return false;

    const updated = {
      ...profile,
      dailyUsage: profile.dailyUsage + 1,
      messageCount: profile.messageCount + 1,
    };
    await set(ref(db, `users/${user.uid}`), updated);
    setProfile(updated);
    return true;
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
        loginWithGoogle,
        logout,
        incrementUsage,
        trialDaysRemaining,
        isTrialActive,
        planLimits: { messages: planMessageLimits[profile?.plan || "guest"] },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
