import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Crown, Calendar, Mail, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAdminUsers } from "@/lib/api";

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AdminUserRow {
  userId: string;
  name: string;
  email: string;
  plan: string;
  profileImage?: string;
  createdAt: string;
  lastLoginAt: string;
}

export default function AdminDashboard({ isOpen, onClose }: AdminDashboardProps) {
  const { getIdToken } = useAuth();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    getIdToken()
      .then((token) => fetchAdminUsers(token))
      .then((data) => setUsers(data as AdminUserRow[]))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load users"))
      .finally(() => setLoading(false));
  }, [isOpen, getIdToken]);

  const planColor: Record<string, string> = {
    guest: "bg-muted text-muted-foreground",
    basic: "bg-primary/10 text-primary",
    advanced: "bg-accent/10 text-accent",
    pro: "bg-warning/10 text-warning",
  };

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
            className="w-full max-w-2xl max-h-[80vh] glass-heavy border border-border rounded-2xl float-shadow overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Admin Dashboard</h2>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="p-4 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/50 border border-border text-center">
                <Users className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{users.length}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50 border border-border text-center">
                <Crown className="w-5 h-5 text-warning mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{users.filter((u) => u.plan === "pro").length}</p>
                <p className="text-xs text-muted-foreground">Pro Users</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Loading users...</div>
              ) : error ? (
                <div className="text-center py-8 text-destructive text-sm">{error}</div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No users yet.</div>
              ) : (
                <div className="space-y-2">
                  {users.map((u) => (
                    <div key={u.userId} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                      {u.profileImage ? (
                        <img src={u.profileImage} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Users className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {u.email}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${planColor[u.plan] || planColor.guest}`}>
                        {u.plan?.toUpperCase()}
                      </span>
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Last: {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "—"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
