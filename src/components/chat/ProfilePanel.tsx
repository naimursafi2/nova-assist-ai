import { motion, AnimatePresence } from "framer-motion";
import { X, User, Crown, BarChart3, Mail, Edit2, LogOut, CreditCard, Camera, Calendar, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const planLabel: Record<string, string> = { guest: "Guest", basic: "Basic", advanced: "Advanced", pro: "Pro" };

export default function ProfilePanel({ isOpen, onClose, onUpgrade }: ProfilePanelProps) {
  const { user, profile, logout, trialDaysRemaining, isTrialActive, planLimits } = useAuth();

  const messageCount = profile?.messageCount || 0;
  const dailyUsage = profile?.dailyUsage || 0;
  const limit = planLimits.messages;
  const usagePercent = Math.min((dailyUsage / limit) * 100, 100);
  const currentPlan = profile?.plan || "guest";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm glass-heavy border border-border rounded-2xl float-shadow overflow-hidden"
          >
            {/* Header */}
            <div className="relative p-6 pb-4 text-center">
              <button onClick={onClose} className="absolute right-3 top-3 p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Avatar */}
              <div className="relative inline-block mb-3">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-primary" />
                ) : (
                  <div className="w-20 h-20 rounded-full gradient-btn flex items-center justify-center">
                    <User className="w-10 h-10 text-primary-foreground" />
                  </div>
                )}
              </div>

              <h3 className="text-lg font-bold text-foreground">{profile?.name || user?.displayName || "Guest"}</h3>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                <Mail className="w-3 h-3" /> {profile?.email || user?.email || "Not signed in"}
              </p>

              {/* Plan badge */}
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                <Crown className="w-3.5 h-3.5" />
                {planLabel[currentPlan]} Plan
              </div>
            </div>

            {/* Trial Status */}
            {isTrialActive && (
              <div className="px-6 pb-3">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-accent/10 border border-accent/20">
                  <Calendar className="w-4 h-4 text-accent" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-foreground">Free Trial Active</p>
                    <p className="text-[10px] text-muted-foreground">{trialDaysRemaining} days remaining</p>
                  </div>
                  <Shield className="w-4 h-4 text-accent" />
                </div>
              </div>
            )}

            {/* Daily Usage */}
            <div className="px-6 pb-4">
              <div className="p-3 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" /> Daily Usage
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {dailyUsage} / {limit === 9999 ? "∞" : limit}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${usagePercent}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={`h-full rounded-full ${usagePercent > 80 ? "bg-destructive" : "gradient-btn"}`}
                  />
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="px-6 pb-4 grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <p className="text-lg font-bold text-foreground">{messageCount}</p>
                <p className="text-[10px] text-muted-foreground">Total Msgs</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <p className="text-lg font-bold text-foreground">{dailyUsage}</p>
                <p className="text-[10px] text-muted-foreground">Today</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <p className="text-lg font-bold text-foreground">{trialDaysRemaining}</p>
                <p className="text-[10px] text-muted-foreground">Trial Days</p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 space-y-1.5">
              <button
                onClick={onUpgrade}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm text-foreground"
              >
                <CreditCard className="w-4 h-4 text-muted-foreground" /> Manage Subscription
              </button>
              <button
                onClick={async () => { await logout(); onClose(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm text-destructive"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
