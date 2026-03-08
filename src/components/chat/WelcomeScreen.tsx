import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Upload, Image, Clock, Zap, Command, Crown, LayoutGrid, MessageSquare } from "lucide-react";
import { aiModes } from "@/lib/chatData";
import ModeSwitcher from "./ModeSwitcher";
import QuickToolsPanel from "./QuickToolsPanel";
import ToolsDashboard from "./ToolsDashboard";

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
  onPromptClick, activeMode, onSelectMode, onOpenCommandPalette,
  recentChatsCount, currentPlan, onUpgrade,
}: WelcomeScreenProps) {
  const [activeTab, setActiveTab] = useState<"home" | "tools">("home");
  const currentMode = aiModes.find((m) => m.id === activeMode) || aiModes[0];

  const planLabel: Record<string, string> = { guest: "Guest", basic: "Basic", advanced: "Advanced", pro: "Pro" };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-8">
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
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="w-20 h-20 rounded-3xl gradient-btn mx-auto flex items-center justify-center glow mb-5 animate-float"
          >
            <Sparkles className="w-10 h-10 text-primary-foreground" />
          </motion.div>
          <h1 className="text-3xl sm:text-5xl font-bold font-display mb-3">
            <span className="gradient-text">Good {getGreeting()}</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Nova AI — your intelligent workspace combining Chat, Research, Writing, Slides, and more into one powerful assistant.
          </p>

          {/* Plan badge + Command palette */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={onUpgrade}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass border border-border hover:border-primary/20 transition-all text-xs text-muted-foreground hover:text-foreground"
            >
              <Crown className="w-3.5 h-3.5 text-warning" />
              <span>{planLabel[currentPlan]} Plan</span>
            </button>
            <button
              onClick={onOpenCommandPalette}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl glass border border-border hover:border-primary/20 transition-all text-xs text-muted-foreground hover:text-foreground"
            >
              <Command className="w-3.5 h-3.5" />
              <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">⌘K</kbd>
            </button>
          </div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center justify-center gap-6 sm:gap-8"
        >
          {[
            { icon: <Zap className="w-3.5 h-3.5 text-primary" />, label: `${aiModes.length} AI Modes` },
            { icon: <Clock className="w-3.5 h-3.5 text-accent" />, label: `${recentChatsCount} Chats` },
            { icon: <Image className="w-3.5 h-3.5 text-success" />, label: "Image AI" },
            { icon: <Upload className="w-3.5 h-3.5 text-warning" />, label: "File Upload" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              {stat.icon}
              <span>{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Tab switcher */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 justify-center"
        >
          <button
            onClick={() => setActiveTab("home")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === "home" ? "gradient-btn text-primary-foreground glow" : "glass border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Home
          </button>
          <button
            onClick={() => setActiveTab("tools")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === "tools" ? "gradient-btn text-primary-foreground glow" : "glass border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> AI Tools
          </button>
        </motion.div>

        {activeTab === "home" ? (
          <>
            {/* Mode Switcher */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">🎯 AI Modes</h3>
              <ModeSwitcher activeMode={activeMode} onSelectMode={onSelectMode} currentPlan={currentPlan} onUpgrade={onUpgrade} />
            </motion.div>

            {/* Suggested Prompts */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {currentMode.icon} {currentMode.label} — Try these
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentMode.prompts.map((prompt, i) => (
                  <motion.button
                    key={prompt.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.06 }}
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
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">⚡ Quick Tools</h3>
              <QuickToolsPanel onSelectTool={onPromptClick} currentPlan={currentPlan} onUpgrade={onUpgrade} />
            </motion.div>

            {/* Capabilities cards */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              {[
                { icon: "🌐", title: "Multilingual", desc: "Bangla, English, Banglish, Hindi, Arabic, Spanish & more languages." },
                { icon: "📊", title: "Slide Generator", desc: "Create AI-powered presentations, pitch decks, and lecture slides." },
                { icon: "🔬", title: "Research AI", desc: "Deep research with web citations, analysis, and source tracking." },
              ].map((cap, i) => (
                <motion.div
                  key={cap.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 + i * 0.08 }}
                  className="p-4 rounded-xl glass border border-border"
                >
                  <span className="text-2xl mb-2 block">{cap.icon}</span>
                  <p className="text-sm font-semibold text-foreground mb-1">{cap.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{cap.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <ToolsDashboard currentPlan={currentPlan} onSelectTool={onSelectMode} onUpgrade={onUpgrade} />
          </motion.div>
        )}
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
