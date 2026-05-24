import { motion } from "framer-motion";
import { ArrowRight, Crown, MessageSquare, Sparkles } from "lucide-react";
import { aiModes } from "@/lib/chatData";
import ModeSwitcher from "./ModeSwitcher";

interface WelcomeScreenProps {
  onPromptClick: (prompt: string) => void;
  activeMode: string;
  onSelectMode: (mode: string) => void;
  onOpenCommandPalette: () => void;
  recentChatsCount: number;
  currentPlan: string;
  onUpgrade: () => void;
}

export default function WelcomeScreen({
  onPromptClick,
  activeMode,
  onSelectMode,
  recentChatsCount,
  currentPlan,
  onUpgrade,
}: WelcomeScreenProps) {
  const currentMode = aiModes.find((mode) => mode.id === activeMode) || aiModes[0];
  const prompts = currentMode.prompts.slice(0, 3);
  const planLabel: Record<string, string> = { guest: "Guest", basic: "Basic", advanced: "Advanced", pro: "Pro" };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-7">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-center"
        >
          <div className="w-14 h-14 rounded-2xl gradient-btn mx-auto flex items-center justify-center glow mb-4">
            <Sparkles className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-display mb-2">
            <span className="gradient-text">Nova Assist AI</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            A focused AI workspace for chat, writing, research, and code.
          </p>

          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass border border-border">
              <Crown className="w-3.5 h-3.5 text-warning" />
              {planLabel[currentPlan]} Plan
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass border border-border">
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
              {recentChatsCount} chats
            </span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <ModeSwitcher activeMode={activeMode} onSelectMode={onSelectMode} currentPlan={currentPlan} onUpgrade={onUpgrade} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Try one prompt
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {prompts.map((prompt, index) => (
              <motion.button
                key={prompt.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 + index * 0.04 }}
                onClick={() => onPromptClick(`${prompt.title}: ${prompt.description}`)}
                className="glass border border-border rounded-xl p-3 text-left hover:border-primary/25 transition-all group"
              >
                <span className="text-lg">{prompt.icon}</span>
                <p className="text-sm font-medium text-foreground mt-2 group-hover:text-primary transition-colors">
                  {prompt.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{prompt.description}</p>
                <ArrowRight className="w-4 h-4 text-muted-foreground mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
