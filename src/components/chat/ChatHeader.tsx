import { Menu, Share2, Download, Trash2, Globe, MoreVertical, Crown } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ModelSelector from "./ModelSelector";
import LanguageSelector from "./LanguageSelector";

interface ChatHeaderProps {
  title: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  selectedModel: string;
  onSelectModel: (id: string) => void;
  webSearch: boolean;
  onToggleWebSearch: () => void;
  activeMode: string;
  selectedLanguage: string;
  onSelectLanguage: (code: string) => void;
  detectedLanguage?: { name: string; flag: string; isBanglish?: boolean } | null;
  currentPlan?: string;
  messageCount?: number;
}

const modeLabels: Record<string, { icon: string; label: string }> = {
  chat: { icon: "💬", label: "Chat" },
  writing: { icon: "✍️", label: "Writing" },
  study: { icon: "📚", label: "Study" },
  research: { icon: "🔬", label: "Research" },
  code: { icon: "💻", label: "Code" },
  business: { icon: "💼", label: "Business" },
  document: { icon: "📄", label: "Document" },
  slides: { icon: "📊", label: "Slides" },
  ideas: { icon: "💡", label: "Ideas" },
  content: { icon: "📝", label: "Content" },
};

const planMessageLimits: Record<string, number> = { guest: 5, basic: 50, advanced: 200, pro: 9999 };

export default function ChatHeader({
  title, sidebarOpen, onToggleSidebar,
  selectedModel, onSelectModel,
  webSearch, onToggleWebSearch,
  activeMode,
  selectedLanguage, onSelectLanguage,
  detectedLanguage,
  currentPlan = "advanced",
  messageCount = 0,
}: ChatHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const mode = modeLabels[activeMode] || modeLabels.chat;
  const limit = planMessageLimits[currentPlan] || 5;

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-border glass">
      <div className="flex items-center gap-2 min-w-0">
        {!sidebarOpen && (
          <button onClick={onToggleSidebar} className="p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0">
            <Menu className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm">{mode.icon}</span>
          <h1 className="text-sm font-semibold text-foreground truncate max-w-[100px] sm:max-w-[200px]">
            {title || "New Chat"}
          </h1>
        </div>

        {/* Detected language indicator */}
        {detectedLanguage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-medium"
          >
            <span>{detectedLanguage.flag}</span>
            <span className="hidden sm:inline">
              {detectedLanguage.isBanglish ? "Banglish → বাংলা" : detectedLanguage.name}
            </span>
          </motion.div>
        )}

        {/* Message counter */}
        {currentPlan !== "pro" && (
          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
            <span>{messageCount}/{limit === 9999 ? "∞" : limit}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <LanguageSelector selectedLanguage={selectedLanguage} onSelectLanguage={onSelectLanguage} />

        <button
          onClick={onToggleWebSearch}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
            webSearch ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
          }`}
          title="Toggle web search"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{webSearch ? "Web" : "Off"}</span>
        </button>

        <ModelSelector selectedModel={selectedModel} onSelectModel={onSelectModel} />

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl glass-heavy border border-border float-shadow py-1"
                >
                  <button onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors text-foreground">
                    <Share2 className="w-3 h-3" /> Share Chat
                  </button>
                  <button onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors text-foreground">
                    <Download className="w-3 h-3" /> Export Chat
                  </button>
                  <button onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors text-destructive">
                    <Trash2 className="w-3 h-3" /> Clear Chat
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
