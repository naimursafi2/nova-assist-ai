import { motion, AnimatePresence } from "framer-motion";
import {
  X, Moon, Sun, Globe, Mic, Brain, Bell, Zap, User, Palette, MessageSquare,
  Languages, Shield, Database, Download, Trash2, ChevronRight, Volume2,
} from "lucide-react";
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

function SettingCard({ icon: Icon, title, description, children }: {
  icon: React.ElementType; title: string; description: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50 hover:border-border transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-[11px] text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-4 mb-2 px-1">{title}</h4>;
}

export default function SettingsModal({
  isOpen, onClose, darkMode, onToggleTheme,
  webSearch, onToggleWebSearch, selectedModel, onSelectModel,
  voiceEnabled, onToggleVoice, memoryEnabled, onToggleMemory,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [responseLength, setResponseLength] = useState<"concise" | "balanced" | "detailed">("balanced");
  const [tone, setTone] = useState<"friendly" | "professional">("friendly");

  const tabs = [
    { id: "general", label: "General", icon: Palette },
    { id: "ai", label: "AI", icon: Zap },
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "model", label: "Model", icon: Brain },
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
            className="w-full max-w-lg glass-heavy border border-border rounded-2xl float-shadow overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">⚙️ Settings</h3>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border px-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
                    activeTab === tab.id
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-4 max-h-[450px] overflow-y-auto scrollbar-thin space-y-1">
              {activeTab === "general" && (
                <>
                  <SectionHeader title="Appearance" />
                  <SettingCard icon={darkMode ? Moon : Sun} title="Theme" description={darkMode ? "Dark mode" : "Light mode"}>
                    <Toggle enabled={darkMode} onChange={onToggleTheme} />
                  </SettingCard>

                  <SectionHeader title="Notifications" />
                  <SettingCard icon={Bell} title="Sound Alerts" description="Play sounds for messages">
                    <Toggle enabled={true} onChange={() => {}} />
                  </SettingCard>
                  <SettingCard icon={Volume2} title="Response Sounds" description="Sound when AI responds">
                    <Toggle enabled={false} onChange={() => {}} />
                  </SettingCard>

                  <SectionHeader title="Language" />
                  <SettingCard icon={Languages} title="Response Language" description="Auto-detect or choose">
                    <select className="text-xs bg-muted rounded-lg px-2 py-1.5 border-none outline-none text-foreground">
                      <option value="auto">Auto-detect</option>
                      <option value="en">English</option>
                      <option value="bn">Bangla</option>
                      <option value="hi">Hindi</option>
                      <option value="ar">Arabic</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="zh">Chinese</option>
                    </select>
                  </SettingCard>
                </>
              )}

              {activeTab === "ai" && (
                <>
                  <SectionHeader title="AI Behavior" />
                  <SettingCard icon={Globe} title="Web Search" description="Use live web results">
                    <Toggle enabled={webSearch} onChange={onToggleWebSearch} />
                  </SettingCard>
                  <SettingCard icon={Brain} title="Smart Memory" description="Remember preferences">
                    <Toggle enabled={memoryEnabled} onChange={onToggleMemory} />
                  </SettingCard>
                  <SettingCard icon={Mic} title="Voice Mode" description="Voice input & output">
                    <Toggle enabled={voiceEnabled} onChange={onToggleVoice} />
                  </SettingCard>

                  <SectionHeader title="Response Style" />
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                    <p className="text-sm font-medium text-foreground mb-2">Tone</p>
                    <div className="flex gap-2">
                      {(["friendly", "professional"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTone(t)}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            tone === t ? "gradient-btn text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {t === "friendly" ? "😊 Friendly" : "👔 Professional"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                    <p className="text-sm font-medium text-foreground mb-2">Response Length</p>
                    <div className="flex gap-2">
                      {(["concise", "balanced", "detailed"] as const).map((l) => (
                        <button
                          key={l}
                          onClick={() => setResponseLength(l)}
                          className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                            responseLength === l ? "gradient-btn text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {l === "concise" ? "📝 Short" : l === "balanced" ? "⚖️ Balanced" : "📖 Detailed"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <SectionHeader title="Sources" />
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-2">
                    <p className="text-sm font-medium text-foreground">Preferred Sources</p>
                    <p className="text-[11px] text-muted-foreground">Choose which sources AI uses for answers</p>
                    <div className="flex flex-wrap gap-1.5">
                      {["Web Search", "AI Knowledge", "News", "Documents", "Trusted Sources"].map((src) => (
                        <button
                          key={src}
                          className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                        >
                          ✓ {src}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === "chat" && (
                <>
                  <SectionHeader title="Chat History" />
                  <SettingCard icon={Database} title="Save History" description="Keep chat history locally">
                    <Toggle enabled={true} onChange={() => {}} />
                  </SettingCard>

                  <SectionHeader title="Actions" />
                  <button className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50 hover:border-border transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Download className="w-4 h-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-foreground">Export All Chats</p>
                        <p className="text-[11px] text-muted-foreground">Download as JSON or Markdown</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </button>

                  <button className="w-full flex items-center justify-between p-3 rounded-xl bg-destructive/5 border border-destructive/10 hover:border-destructive/30 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-destructive">Clear All Chats</p>
                        <p className="text-[11px] text-muted-foreground">This action cannot be undone</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                  </button>

                  <SectionHeader title="Privacy" />
                  <SettingCard icon={Shield} title="Data Privacy" description="Don't train AI on my chats">
                    <Toggle enabled={true} onChange={() => {}} />
                  </SettingCard>
                </>
              )}

              {activeTab === "model" && (
                <div className="space-y-2">
                  <SectionHeader title="AI Model" />
                  {aiModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => onSelectModel(model.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                        selectedModel === model.id
                          ? "glass border-primary/30 glow"
                          : "bg-muted/30 border border-border/50 hover:border-border"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        selectedModel === model.id ? "bg-primary/20" : "bg-muted"
                      }`}>
                        <Zap className={`w-4 h-4 ${selectedModel === model.id ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
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
                        <p className="text-[11px] text-muted-foreground">{model.description}</p>
                      </div>
                      {selectedModel === model.id && (
                        <div className="w-2.5 h-2.5 rounded-full gradient-btn" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
