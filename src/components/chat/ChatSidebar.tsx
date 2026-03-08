import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Pin, Trash2, PenLine, Settings, User,
  MessageSquare, ChevronLeft, Sun, Moon, MoreHorizontal,
} from "lucide-react";
import { Chat } from "@/lib/chatData";

interface ChatSidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, title: string) => void;
  onPinChat: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
}

export default function ChatSidebar({
  chats, activeChatId, onSelectChat, onNewChat, onDeleteChat,
  onRenameChat, onPinChat, isOpen, onToggle, darkMode, onToggleTheme,
}: ChatSidebarProps) {
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const filtered = chats.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );
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
            <h2 className="text-sm font-semibold gradient-text">Nova AI</h2>
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
          <div className="p-3 border-t border-border space-y-2">
            <button
              onClick={onToggleTheme}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-sm text-muted-foreground transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-sm text-muted-foreground transition-colors">
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-7 h-7 rounded-full gradient-btn flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">John Doe</p>
                <p className="text-[10px] text-muted-foreground">Free Plan</p>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function ChatItem({
  chat, active, menuOpen, renaming, renameValue,
  onSelect, onMenuToggle, onPin, onDelete, onStartRename,
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
            className="absolute right-1 top-full z-50 mt-1 w-36 rounded-lg glass border border-border shadow-lg py-1"
          >
            <button onClick={onStartRename} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors text-foreground">
              <PenLine className="w-3 h-3" /> Rename
            </button>
            <button onClick={onPin} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors text-foreground">
              <Pin className="w-3 h-3" /> {chat.pinned ? "Unpin" : "Pin"}
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
