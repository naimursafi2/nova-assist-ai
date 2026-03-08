import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Pin, Trash2, PenLine, Settings, User,
  MessageSquare, ChevronLeft, Sun, Moon, MoreHorizontal,
  Brain, BookOpen, FolderOpen, Star, Crown, LogIn, Download, Share2,
} from "lucide-react";
import { Chat, chatFolders } from "@/lib/chatData";

interface ChatSidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, title: string) => void;
  onPinChat: (id: string) => void;
  onStarChat: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenMemory: () => void;
  onOpenPromptLibrary: () => void;
  onOpenProfile: () => void;
  currentPlan: string;
  onUpgrade: () => void;
  isLoggedIn: boolean;
  onLogin: () => void;
}

export default function ChatSidebar({
  chats, activeChatId, onSelectChat, onNewChat, onDeleteChat,
  onRenameChat, onPinChat, onStarChat, isOpen, onToggle, darkMode, onToggleTheme,
  onOpenSettings, onOpenMemory, onOpenPromptLibrary, onOpenProfile, currentPlan, onUpgrade, isLoggedIn, onLogin,
}: ChatSidebarProps) {
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [activeFolder, setActiveFolder] = useState("All");

  const filtered = chats.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchFolder = activeFolder === "All" || c.folder === activeFolder;
    return matchSearch && matchFolder;
  });
  const pinned = filtered.filter((c) => c.pinned);
  const recent = filtered.filter((c) => !c.pinned);

  const startRename = (chat: Chat) => {
    setRenaming(chat.id);
    setRenameValue(chat.title);
    setMenuOpen(null);
  };

  const submitRename = (id: string) => {
    if (renameValue.trim()) onRenameChat(id, renameValue.trim());
    setRenaming(null);
  };

  const planLabel: Record<string, string> = { guest: "Guest", basic: "Basic", advanced: "Advanced", pro: "Pro" };
  const planColor: Record<string, string> = { guest: "text-muted-foreground", basic: "text-primary", advanced: "text-accent", pro: "text-warning" };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="h-screen flex flex-col bg-sidebar-bg border-r border-border overflow-hidden flex-shrink-0"
        >
          {/* Header */}
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-btn flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground">A</span>
              </div>
              <div>
                <h2 className="text-sm font-bold font-display gradient-text">Aura AI</h2>
                <p className={`text-[9px] font-semibold ${planColor[currentPlan]}`}>{planLabel[currentPlan]} Plan</p>
              </div>
            </div>
            <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* New Chat */}
          <div className="px-3 pb-2">
            <button
              onClick={onNewChat}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl gradient-btn text-primary-foreground text-sm font-medium transition-all hover:opacity-90 glow"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>

          {/* Search */}
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chats..."
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-muted border-none outline-none text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>

          {/* Folder Tabs */}
          <div className="px-3 pb-2 flex gap-1 overflow-x-auto scrollbar-thin">
            {chatFolders.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFolder(f)}
                className={`px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-all ${
                  activeFolder === f
                    ? "gradient-btn text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="px-3 pb-2 flex gap-1">
            <button
              onClick={onOpenPromptLibrary}
              className="flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-muted text-xs text-muted-foreground transition-colors"
            >
              <BookOpen className="w-3 h-3" /> Prompts
            </button>
            <button
              onClick={onOpenMemory}
              className="flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-muted text-xs text-muted-foreground transition-colors"
            >
              <Brain className="w-3 h-3" /> Memory
            </button>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto scrollbar-thin px-2 space-y-1">
            {pinned.length > 0 && (
              <>
                <p className="px-2 pt-2 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Pinned</p>
                {pinned.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    active={activeChatId === chat.id}
                    menuOpen={menuOpen === chat.id}
                    renaming={renaming === chat.id}
                    renameValue={renameValue}
                    onSelect={() => onSelectChat(chat.id)}
                    onMenuToggle={() => setMenuOpen(menuOpen === chat.id ? null : chat.id)}
                    onPin={() => { onPinChat(chat.id); setMenuOpen(null); }}
                    onStar={() => { onStarChat(chat.id); setMenuOpen(null); }}
                    onDelete={() => { onDeleteChat(chat.id); setMenuOpen(null); }}
                    onStartRename={() => startRename(chat)}
                    onRenameChange={setRenameValue}
                    onRenameSubmit={() => submitRename(chat.id)}
                  />
                ))}
              </>
            )}
            {recent.length > 0 && (
              <>
                <p className="px-2 pt-3 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Recent</p>
                {recent.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    active={activeChatId === chat.id}
                    menuOpen={menuOpen === chat.id}
                    renaming={renaming === chat.id}
                    renameValue={renameValue}
                    onSelect={() => onSelectChat(chat.id)}
                    onMenuToggle={() => setMenuOpen(menuOpen === chat.id ? null : chat.id)}
                    onPin={() => { onPinChat(chat.id); setMenuOpen(null); }}
                    onStar={() => { onStarChat(chat.id); setMenuOpen(null); }}
                    onDelete={() => { onDeleteChat(chat.id); setMenuOpen(null); }}
                    onStartRename={() => startRename(chat)}
                    onRenameChange={setRenameValue}
                    onRenameSubmit={() => submitRename(chat.id)}
                  />
                ))}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-border space-y-1">
            {/* Upgrade button */}
            {currentPlan !== "pro" && (
              <button
                onClick={onUpgrade}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg gradient-btn text-primary-foreground text-xs font-semibold transition-all hover:opacity-90 mb-1"
              >
                <Crown className="w-4 h-4" />
                Upgrade to {currentPlan === "guest" ? "Basic" : currentPlan === "basic" ? "Advanced" : "Pro"}
              </button>
            )}
            <button
              onClick={onToggleTheme}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-sm text-muted-foreground transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
            <button
              onClick={onOpenSettings}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-sm text-muted-foreground transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
            {isLoggedIn ? (
              <button
                onClick={onOpenProfile}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-7 h-7 rounded-full gradient-btn flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-medium text-foreground truncate">John Doe</p>
                  <p className={`text-[10px] font-semibold ${planColor[currentPlan]}`}>{planLabel[currentPlan]} Plan</p>
                </div>
              </button>
            ) : (
              <button
                onClick={onLogin}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium transition-colors hover:bg-primary/20"
              >
                <LogIn className="w-4 h-4" />
                Sign In for More Features
              </button>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function ChatItem({
  chat, active, menuOpen, renaming, renameValue,
  onSelect, onMenuToggle, onPin, onStar, onDelete, onStartRename,
  onRenameChange, onRenameSubmit,
}: {
  chat: Chat;
  active: boolean;
  menuOpen: boolean;
  renaming: boolean;
  renameValue: string;
  onSelect: () => void;
  onMenuToggle: () => void;
  onPin: () => void;
  onStar: () => void;
  onDelete: () => void;
  onStartRename: () => void;
  onRenameChange: (v: string) => void;
  onRenameSubmit: () => void;
}) {
  return (
    <div className="relative">
      <button
        onClick={onSelect}
        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-sm transition-all group ${
          active
            ? "bg-primary/10 text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
        {renaming ? (
          <input
            value={renameValue}
            onChange={(e) => onRenameChange(e.target.value)}
            onBlur={onRenameSubmit}
            onKeyDown={(e) => e.key === "Enter" && onRenameSubmit()}
            autoFocus
            className="flex-1 bg-transparent outline-none text-sm"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 truncate text-xs">{chat.title}</span>
        )}
        {chat.starred && <Star className="w-3 h-3 text-warning flex-shrink-0 fill-current" />}
        {chat.pinned && <Pin className="w-3 h-3 text-primary flex-shrink-0" />}
        <button
          onClick={(e) => { e.stopPropagation(); onMenuToggle(); }}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted-foreground/10 transition-opacity"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </button>
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute right-1 top-full z-50 mt-1 w-40 rounded-lg glass-heavy border border-border float-shadow py-1"
          >
            <button onClick={onStartRename} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors text-foreground">
              <PenLine className="w-3 h-3" /> Rename
            </button>
            <button onClick={onPin} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors text-foreground">
              <Pin className="w-3 h-3" /> {chat.pinned ? "Unpin" : "Pin"}
            </button>
            <button onClick={onStar} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors text-foreground">
              <Star className="w-3 h-3" /> {chat.starred ? "Unstar" : "Star"}
            </button>
            <button onClick={() => {}} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors text-foreground">
              <Share2 className="w-3 h-3" /> Share
            </button>
            <button onClick={() => {}} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors text-foreground">
              <Download className="w-3 h-3" /> Export
            </button>
            <button onClick={onDelete} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors text-destructive">
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
