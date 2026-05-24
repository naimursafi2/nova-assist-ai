import { Menu, Crown, Globe } from "lucide-react";

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
  research: { icon: "🔬", label: "Research" },
  code: { icon: "💻", label: "Code" },
};

const planMessageLimits: Record<string, number> = { guest: 5, basic: 50, advanced: 200, pro: 9999 };

export default function ChatHeader({
  title,
  sidebarOpen,
  onToggleSidebar,
  webSearch,
  activeMode,
  detectedLanguage,
  currentPlan = "basic",
  messageCount = 0,
}: ChatHeaderProps) {
  const mode = modeLabels[activeMode] || modeLabels.chat;
  const limit = planMessageLimits[currentPlan] || 5;

  return (
    <header className="h-14 flex items-center justify-between gap-3 px-4 border-b border-border glass">
      <div className="flex items-center gap-2 min-w-0">
        {!sidebarOpen && (
          <button onClick={onToggleSidebar} className="p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0" title="Open sidebar">
            <Menu className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
        <span className="text-sm flex-shrink-0">{mode.icon}</span>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-foreground truncate max-w-[170px] sm:max-w-[320px]">
            {title || "New Chat"}
          </h1>
          <p className="text-[10px] text-muted-foreground">{mode.label}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 text-xs text-muted-foreground">
        {detectedLanguage && (
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-1 text-accent">
            <span>{detectedLanguage.flag}</span>
            <span>{detectedLanguage.isBanglish ? "Banglish" : detectedLanguage.name}</span>
          </span>
        )}
        {webSearch && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-primary">
            <Globe className="h-3 w-3" />
            Web
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
          <Crown className="h-3 w-3 text-warning" />
          {currentPlan}
        </span>
        {currentPlan !== "pro" && (
          <span className="hidden sm:inline-flex rounded-full bg-muted px-2 py-1">
            {messageCount}/{limit === 9999 ? "∞" : limit}
          </span>
        )}
      </div>
    </header>
  );
}
