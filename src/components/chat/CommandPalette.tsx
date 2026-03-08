import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MessageSquare, BookOpen, Brain, Settings, Image,
  Globe, Mic, Upload, Zap, FileText, PenLine, Code, BarChart3,
  Languages, Sparkles, X,
} from "lucide-react";
import { aiModes, quickTools, promptLibrary } from "@/lib/chatData";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string, payload?: string) => void;
}

interface CommandItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  category: string;
  action: string;
  payload?: string;
}

export default function CommandPalette({ isOpen, onClose, onAction }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    // Quick actions
    { id: "new-chat", icon: <MessageSquare className="w-4 h-4" />, label: "New Chat", description: "Start a fresh conversation", category: "Actions", action: "new-chat" },
    { id: "prompt-library", icon: <BookOpen className="w-4 h-4" />, label: "Prompt Library", description: "Browse prompt templates", category: "Actions", action: "prompt-library" },
    { id: "memory", icon: <Brain className="w-4 h-4" />, label: "Smart Memory", description: "View stored memories", category: "Actions", action: "memory" },
    { id: "settings", icon: <Settings className="w-4 h-4" />, label: "Settings", description: "App preferences", category: "Actions", action: "settings" },
    { id: "upload-file", icon: <Upload className="w-4 h-4" />, label: "Upload File", description: "Attach a document", category: "Actions", action: "upload-file" },
    { id: "upload-image", icon: <Image className="w-4 h-4" />, label: "Upload Image", description: "Analyze an image with AI", category: "Actions", action: "upload-image" },
    { id: "web-search", icon: <Globe className="w-4 h-4" />, label: "Toggle Web Search", description: "Search the web for answers", category: "Actions", action: "toggle-web-search" },
    { id: "voice", icon: <Mic className="w-4 h-4" />, label: "Voice Mode", description: "Speak to Nova AI", category: "Actions", action: "voice" },
    { id: "language", icon: <Languages className="w-4 h-4" />, label: "Change Language", description: "Switch response language", category: "Actions", action: "language" },
    // AI Modes
    ...aiModes.map((m) => ({
      id: `mode-${m.id}`,
      icon: <span className="text-sm">{m.icon}</span>,
      label: m.label,
      description: m.description,
      category: "AI Modes",
      action: "switch-mode",
      payload: m.id,
    })),
    // Quick Tools
    ...quickTools.map((t) => ({
      id: `tool-${t.id}`,
      icon: <span className="text-sm">{t.icon}</span>,
      label: t.title,
      description: t.description,
      category: "Quick Tools",
      action: "quick-tool",
      payload: t.action,
    })),
    // Prompts (first 6)
    ...promptLibrary.slice(0, 6).map((p) => ({
      id: `prompt-${p.id}`,
      icon: <span className="text-sm">{p.icon}</span>,
      label: p.title,
      description: p.category,
      category: "Prompts",
      action: "use-prompt",
      payload: p.prompt,
    })),
  ];

  const filtered = query
    ? commands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.description.toLowerCase().includes(query.toLowerCase()) ||
          c.category.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  const categories = [...new Set(filtered.map((c) => c.category))];

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        const cmd = filtered[selectedIndex];
        onAction(cmd.action, cmd.payload);
        onClose();
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [filtered, selectedIndex, onAction, onClose]
  );

  // Global keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onAction("open-palette");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose, onAction]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] p-4 bg-background/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg glass-heavy border border-border rounded-2xl float-shadow overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search commands, modes, tools..."
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
              <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground font-mono">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[360px] overflow-y-auto scrollbar-thin py-2">
              {categories.map((cat) => {
                const items = filtered.filter((c) => c.category === cat);
                return (
                  <div key={cat}>
                    <p className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      {cat}
                    </p>
                    {items.map((cmd) => {
                      const globalIdx = filtered.indexOf(cmd);
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => {
                            onAction(cmd.action, cmd.payload);
                            onClose();
                          }}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                            globalIdx === selectedIndex
                              ? "bg-primary/10 text-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <span className={globalIdx === selectedIndex ? "text-primary" : "text-muted-foreground"}>
                            {cmd.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{cmd.label}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{cmd.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <Sparkles className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No results found</p>
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-muted font-mono">↑↓</kbd> Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-muted font-mono">↵</kbd> Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-muted font-mono">esc</kbd> Close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
