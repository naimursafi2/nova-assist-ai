import { motion } from "framer-motion";
import { Lock, ArrowRight, Crown } from "lucide-react";
import { aiTools, AIToolCard } from "@/lib/chatData";

interface ToolsDashboardProps {
  currentPlan: string;
  onSelectTool: (action: string) => void;
  onUpgrade: () => void;
}

const planLevel: Record<string, number> = { guest: 0, basic: 1, advanced: 2, pro: 3 };

export default function ToolsDashboard({ currentPlan, onSelectTool, onUpgrade }: ToolsDashboardProps) {
  const userLevel = planLevel[currentPlan] || 0;
  const categories = [...new Set(aiTools.map((t) => t.category))];

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <div key={category}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {category}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {aiTools
              .filter((t) => t.category === category)
              .map((tool, i) => {
                const locked = planLevel[tool.requiredPlan] > userLevel;
                return (
                  <motion.button
                    key={tool.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => (locked ? onUpgrade() : onSelectTool(tool.action))}
                    className={`relative p-4 rounded-xl text-left transition-all group overflow-hidden ${
                      locked
                        ? "glass border border-border opacity-60 hover:opacity-80"
                        : "glass border border-border hover:border-primary/20 hover:glow"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-2xl mb-2 block">{tool.icon}</span>
                      {locked ? (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-warning/10 text-warning text-[9px] font-semibold">
                          <Lock className="w-2.5 h-2.5" />
                          {tool.requiredPlan}
                        </div>
                      ) : (
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {tool.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{tool.description}</p>

                    {locked && (
                      <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg gradient-btn text-primary-foreground text-xs font-semibold">
                          <Crown className="w-3 h-3" /> Upgrade
                        </span>
                      </div>
                    )}
                  </motion.button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
