import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { aiModes } from "@/lib/chatData";

const planLevel: Record<string, number> = { guest: 0, basic: 1, advanced: 2, pro: 3 };

interface ModeSwitcherProps {
  activeMode: string;
  onSelectMode: (mode: string) => void;
  compact?: boolean;
  currentPlan?: string;
  onUpgrade?: () => void;
}

export default function ModeSwitcher({ activeMode, onSelectMode, compact, currentPlan = "pro", onUpgrade }: ModeSwitcherProps) {
  const userLevel = planLevel[currentPlan] || 0;

  if (compact) {
    return (
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin pb-1">
        {aiModes.map((mode) => {
          const locked = planLevel[mode.requiredPlan] > userLevel;
          return (
            <button
              key={mode.id}
              onClick={() => locked ? onUpgrade?.() : onSelectMode(mode.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeMode === mode.id
                  ? "gradient-btn text-primary-foreground glow"
                  : locked
                  ? "bg-muted text-muted-foreground opacity-50"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <span>{mode.icon}</span>
              <span className="hidden sm:inline">{mode.label}</span>
              {locked && <Lock className="w-2.5 h-2.5 text-warning" />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
      {aiModes.map((mode, i) => {
        const locked = planLevel[mode.requiredPlan] > userLevel;
        return (
          <motion.button
            key={mode.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => locked ? onUpgrade?.() : onSelectMode(mode.id)}
            className={`relative p-3 rounded-xl text-left transition-all group overflow-hidden ${
              activeMode === mode.id
                ? "glass border-primary/30 glow"
                : locked
                ? "glass border-border opacity-60"
                : "glass border-border hover:border-primary/20"
            }`}
          >
            {activeMode === mode.id && (
              <div className="absolute inset-0 gradient-btn opacity-10" />
            )}
            <div className="relative flex items-start justify-between">
              <div>
                <span className="text-xl mb-1 block">{mode.icon}</span>
                <p className="text-xs font-semibold text-foreground">{mode.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{mode.description}</p>
              </div>
              {locked && <Lock className="w-3 h-3 text-warning flex-shrink-0" />}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
