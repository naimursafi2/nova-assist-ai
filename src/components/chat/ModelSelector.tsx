import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { aiModels } from "@/lib/chatData";
import { ChevronDown, Zap } from "lucide-react";

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (id: string) => void;
}

export default function ModelSelector({ selectedModel, onSelectModel }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const model = aiModels.find((m) => m.id === selectedModel);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors text-xs"
      >
        <Zap className="w-3 h-3 text-primary" />
        <span className="font-medium text-foreground hidden sm:inline">{model?.name || "Nova Smart"}</span>
        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl glass-heavy border border-border float-shadow py-1"
            >
              {aiModels.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { onSelectModel(m.id); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                    selectedModel === m.id ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Zap className={`w-3 h-3 ${selectedModel === m.id ? "text-primary" : ""}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium">{m.name}</span>
                      {m.badge && (
                        <span className={`px-1 py-0.5 rounded text-[8px] font-semibold ${
                          m.badge === "Pro" ? "gradient-btn text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}>{m.badge}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{m.description}</span>
                  </div>
                  {selectedModel === m.id && <div className="w-1.5 h-1.5 rounded-full gradient-btn" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
