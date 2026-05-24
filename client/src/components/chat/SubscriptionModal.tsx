import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Crown, Sparkles, Star } from "lucide-react";
import { subscriptionPlans } from "@/lib/chatData";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  onSelectPlan: (planId: string, coupon?: string) => void | Promise<void>;
  loadingPlan?: string | null;
  errorMessage?: string | null;
}

const planIcons: Record<string, React.ReactNode> = {
  basic: <Star className="w-5 h-5" />,
  advanced: <Sparkles className="w-5 h-5" />,
  pro: <Crown className="w-5 h-5" />,
};

export default function SubscriptionModal({
  isOpen,
  onClose,
  currentPlan,
  onSelectPlan,
  loadingPlan,
  errorMessage,
}: SubscriptionModalProps) {
  const [coupon, setCoupon] = useState("");
  const plans = subscriptionPlans.filter((plan) => plan.id !== "guest");

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
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-3xl glass-heavy border border-border rounded-2xl float-shadow overflow-hidden max-h-[90vh] overflow-y-auto scrollbar-thin"
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground">Upgrade Nova Assist</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Secure checkout is handled by Stripe.</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="px-5 pt-5">
              <label className="text-xs font-semibold text-muted-foreground" htmlFor="coupon">
                Coupon code
              </label>
              <input
                id="coupon"
                value={coupon}
                onChange={(event) => setCoupon(event.target.value)}
                placeholder="Optional"
                className="mt-2 w-full rounded-xl border border-border bg-background/60 px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
              {errorMessage && <p className="mt-2 text-xs text-destructive">{errorMessage}</p>}
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className={`relative rounded-2xl border p-5 transition-all ${
                    currentPlan === plan.id
                      ? "border-primary/50 glow bg-primary/5"
                      : plan.popular
                      ? "border-accent/30 bg-accent/5"
                      : "border-border glass"
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold gradient-btn text-primary-foreground whitespace-nowrap">
                      {plan.badge}
                    </span>
                  )}

                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-3 text-primary-foreground`}>
                    {planIcons[plan.id]}
                  </div>

                  <h4 className="text-sm font-bold text-foreground">{plan.name}</h4>
                  <div className="flex items-baseline gap-0.5 mt-1">
                    <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                    {plan.period && <span className="text-xs text-muted-foreground">{plan.period}</span>}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{plan.description}</p>

                  <ul className="mt-4 space-y-2">
                    {plan.features.slice(0, 4).map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-[11px]">
                        <Check className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => onSelectPlan(plan.id, coupon)}
                    disabled={currentPlan === plan.id || loadingPlan === plan.id}
                    className={`w-full mt-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      currentPlan === plan.id
                        ? "bg-muted text-muted-foreground cursor-default"
                        : plan.popular
                        ? "gradient-btn text-primary-foreground hover:opacity-90 glow"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    } disabled:opacity-60`}
                  >
                    {currentPlan === plan.id ? "Current Plan" : loadingPlan === plan.id ? "Opening checkout..." : "Upgrade"}
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
