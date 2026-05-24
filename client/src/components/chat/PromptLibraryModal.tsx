import { motion, AnimatePresence } from "framer-motion";
import { X, Search } from "lucide-react";
import { promptLibrary } from "@/lib/chatData";
import { useState } from "react";

interface PromptLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string) => void;
}

const categories = ["All", "Writing", "Study", "Business", "Coding", "Productivity", "Marketing"];

export default function PromptLibraryModal({ isOpen, onClose, onSelectPrompt }: PromptLibraryModalProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = promptLibrary.filter((p) => {
    const matchCategory = activeCategory === "All" || p.category === activeCategory;
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg glass-heavy border border-border rounded-2xl float-shadow overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">📚 Prompt Library</h3>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search prompts..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto scrollbar-thin pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      activeCategory === cat
                        ? "gradient-btn text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-[320px] overflow-y-auto scrollbar-thin">
                {filtered.map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => { onSelectPrompt(prompt.prompt); onClose(); }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted text-left transition-all group"
                  >
                    <span className="text-xl">{prompt.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{prompt.title}</p>
                      <p className="text-xs text-muted-foreground">{prompt.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
