import { motion, AnimatePresence } from "framer-motion";
import { X, User, Crown, BarChart3, Mail, Edit2, LogOut, CreditCard, Camera } from "lucide-react";

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  messageCount: number;
  onUpgrade: () => void;
  onLogout: () => void;
}

const planLabel: Record<string, string> = { guest: "Guest", basic: "Basic", advanced: "Advanced", pro: "Pro" };
const planLimits: Record<string, number> = { guest: 5, basic: 50, advanced: 200, pro: 9999 };

export default function ProfilePanel({
  isOpen, onClose, currentPlan, messageCount, onUpgrade, onLogout,
}: ProfilePanelProps) {
  const limit = planLimits[currentPlan] || 5;
  const usagePercent = Math.min((messageCount / limit) * 100, 100);

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
                <div className="w-20 h-20 rounded-full gradient-btn flex items-center justify-center">
                  <User className="w-10 h-10 text-primary-foreground" />
                </div>
                <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors">
                  <Camera className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>

              <h3 className="text-lg font-bold text-foreground">John Doe</h3>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                <Mail className="w-3 h-3" /> john@example.com
              </p>

              {/* Plan badge */}
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                <Crown className="w-3.5 h-3.5" />
                {planLabel[currentPlan]} Plan
              </div>
            </div>

            {/* Usage Stats */}
            <div className="px-6 pb-4">
              <div className="p-3 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" /> Messages Used
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {messageCount} / {limit === 9999 ? "∞" : limit}
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
                <p className="text-[10px] text-muted-foreground">Messages</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <p className="text-lg font-bold text-foreground">12</p>
                <p className="text-[10px] text-muted-foreground">Chats</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <p className="text-lg font-bold text-foreground">3</p>
                <p className="text-[10px] text-muted-foreground">Days</p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 space-y-1.5">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm text-foreground">
                <Edit2 className="w-4 h-4 text-muted-foreground" /> Edit Profile
              </button>
              <button
                onClick={onUpgrade}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm text-foreground"
              >
                <CreditCard className="w-4 h-4 text-muted-foreground" /> Manage Subscription
              </button>
              <button
                onClick={onLogout}
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
