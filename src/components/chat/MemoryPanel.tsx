import { motion, AnimatePresence } from "framer-motion";
import { X, Brain, Trash2 } from "lucide-react";
import { MemoryItem, defaultMemory } from "@/lib/chatData";
import { useState } from "react";

interface MemoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const typeIcons: Record<string, string> = {
  preference: "⚙️",
  tone: "🎨",
  task: "📋",
  context: "💡",
};

const typeLabels: Record<string, string> = {
  preference: "Preference",
  tone: "Tone",
  task: "Active Task",
  context: "Context",
};

export default function MemoryPanel({ isOpen, onClose }: MemoryPanelProps) {
  const [memories, setMemories] = useState<MemoryItem[]>(defaultMemory);
  const [memoryEnabled, setMemoryEnabled] = useState(true);

  const removeMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

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
            className="w-full max-w-md glass-heavy border border-border rounded-2xl float-shadow overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Smart Memory</h3>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Memory Active</p>
                  <p className="text-xs text-muted-foreground">Aura remembers your preferences</p>
                </div>
                <button
                  onClick={() => setMemoryEnabled(!memoryEnabled)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${
                    memoryEnabled ? "gradient-btn" : "bg-muted"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-primary-foreground transition-transform ${
                      memoryEnabled ? "left-5" : "left-1"
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
                {memories.map((mem) => (
                  <motion.div
                    key={mem.id}
                    layout
                    className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 group"
                  >
                    <span className="text-lg">{typeIcons[mem.type]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        {typeLabels[mem.type]}
                      </p>
                      <p className="text-sm text-foreground mt-0.5">{mem.content}</p>
                    </div>
                    <button
                      onClick={() => removeMemory(mem.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </div>

              {memories.length === 0 && (
                <div className="text-center py-6">
                  <Brain className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No memories stored yet</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
