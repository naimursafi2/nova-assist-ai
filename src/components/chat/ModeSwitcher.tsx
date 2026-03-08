import { motion, AnimatePresence } from "framer-motion";
import { aiModes, AIMode } from "@/lib/chatData";

interface ModeSwitcherProps {
  activeMode: string;
  onSelectMode: (mode: string) => void;
  compact?: boolean;
}

export default function ModeSwitcher({ activeMode, onSelectMode, compact }: ModeSwitcherProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin pb-1">
        {aiModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onSelectMode(mode.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeMode === mode.id
                ? "gradient-btn text-primary-foreground glow"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <span>{mode.icon}</span>
            <span className="hidden sm:inline">{mode.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {aiModes.map((mode, i) => (
        <motion.button
          key={mode.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onSelectMode(mode.id)}
          className={`relative p-3 rounded-xl text-left transition-all group overflow-hidden ${
            activeMode === mode.id
              ? "glass border-primary/30 glow"
              : "glass border-border hover:border-primary/20"
          }`}
        >
          {activeMode === mode.id && (
            <div className="absolute inset-0 gradient-btn opacity-10" />
          )}
          <div className="relative">
            <span className="text-xl mb-1 block">{mode.icon}</span>
            <p className="text-xs font-semibold text-foreground">{mode.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{mode.description}</p>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
