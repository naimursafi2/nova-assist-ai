import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { aiModes } from "@/lib/chatData";
import ModeSwitcher from "./ModeSwitcher";
import QuickToolsPanel from "./QuickToolsPanel";

interface WelcomeScreenProps {
  onPromptClick: (prompt: string) => void;
  activeMode: string;
  onSelectMode: (mode: string) => void;
}

export default function WelcomeScreen({ onPromptClick, activeMode, onSelectMode }: WelcomeScreenProps) {
  const currentMode = aiModes.find((m) => m.id === activeMode) || aiModes[0];

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-8">
        {/* Floating orbs */}
        <div className="fixed top-20 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-orb pointer-events-none" />
        <div className="fixed bottom-20 right-1/4 w-48 h-48 rounded-full bg-accent/5 blur-3xl animate-orb-delayed pointer-events-none" />

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center relative"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="w-20 h-20 rounded-3xl gradient-btn mx-auto flex items-center justify-center glow mb-5 animate-float"
          >
            <Sparkles className="w-10 h-10 text-primary-foreground" />
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-bold font-display mb-2">
            <span className="gradient-text">Good {getGreeting()}</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
            I'm Nova AI — your intelligent workspace assistant. Pick a mode, use a tool, or just start chatting.
          </p>
        </motion.div>

        {/* Mode Switcher */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">🎯 AI Modes</h3>
          <ModeSwitcher activeMode={activeMode} onSelectMode={onSelectMode} />
        </motion.div>

        {/* Suggested Prompts for current mode */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {currentMode.icon} {currentMode.label} — Try these
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {currentMode.prompts.map((prompt, i) => (
              <motion.button
                key={prompt.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.07 }}
                onClick={() => onPromptClick(prompt.title + ": " + prompt.description)}
                className="glass border border-border rounded-xl p-3.5 text-left hover:border-primary/20 transition-all group hover:glow"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{prompt.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{prompt.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{prompt.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Quick Tools */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">⚡ Quick Tools</h3>
          <QuickToolsPanel onSelectTool={onPromptClick} />
        </motion.div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
