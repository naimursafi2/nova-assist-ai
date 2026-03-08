import { motion, AnimatePresence } from "framer-motion";
import { X, Moon, Sun, Globe, Mic, Brain, Bell, Zap, ChevronRight } from "lucide-react";
import { aiModels } from "@/lib/chatData";
import { useState } from "react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
  webSearch: boolean;
  onToggleWebSearch: () => void;
  selectedModel: string;
  onSelectModel: (id: string) => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  memoryEnabled: boolean;
  onToggleMemory: () => void;
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${
        enabled ? "gradient-btn" : "bg-muted"
      }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 rounded-full bg-primary-foreground transition-transform ${
          enabled ? "left-5" : "left-1"
        }`}
      />
    </button>
  );
}

export default function SettingsModal({
  isOpen, onClose, darkMode, onToggleTheme,
  webSearch, onToggleWebSearch, selectedModel, onSelectModel,
  voiceEnabled, onToggleVoice, memoryEnabled, onToggleMemory,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", label: "General", icon: "⚙️" },
    { id: "model", label: "Model", icon: "🤖" },
    { id: "features", label: "Features", icon: "✨" },
  ];

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
              <h3 className="text-sm font-semibold text-foreground">⚙️ Settings</h3>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex border-b border-border">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
                    activeTab === tab.id
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto scrollbar-thin">
              {activeTab === "general" && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {darkMode ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-warning" />}
                      <div>
                        <p className="text-sm font-medium text-foreground">Theme</p>
                        <p className="text-xs text-muted-foreground">{darkMode ? "Dark" : "Light"} mode</p>
                      </div>
                    </div>
                    <Toggle enabled={darkMode} onChange={onToggleTheme} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Notifications</p>
                        <p className="text-xs text-muted-foreground">Sound & alerts</p>
                      </div>
                    </div>
                    <Toggle enabled={true} onChange={() => {}} />
                  </div>
                </>
              )}

              {activeTab === "model" && (
                <div className="space-y-2">
                  {aiModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => onSelectModel(model.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                        selectedModel === model.id
                          ? "glass border-primary/30 glow"
                          : "bg-muted/50 hover:bg-muted"
                      }`}
                    >
                      <Zap className={`w-4 h-4 ${selectedModel === model.id ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{model.name}</p>
                          {model.badge && (
                            <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-semibold ${
                              model.badge === "Pro" ? "gradient-btn text-primary-foreground" : "bg-muted text-muted-foreground"
                            }`}>
                              {model.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{model.description}</p>
                      </div>
                      {selectedModel === model.id && (
                        <div className="w-2 h-2 rounded-full gradient-btn" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {activeTab === "features" && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Web Search</p>
                        <p className="text-xs text-muted-foreground">Use live web results</p>
                      </div>
                    </div>
                    <Toggle enabled={webSearch} onChange={onToggleWebSearch} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Voice Mode</p>
                        <p className="text-xs text-muted-foreground">Voice input & output</p>
                      </div>
                    </div>
                    <Toggle enabled={voiceEnabled} onChange={onToggleVoice} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Smart Memory</p>
                        <p className="text-xs text-muted-foreground">Remember preferences</p>
                      </div>
                    </div>
                    <Toggle enabled={memoryEnabled} onChange={onToggleMemory} />
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
