import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { quickTools } from "@/lib/chatData";

const planLevel: Record<string, number> = { guest: 0, basic: 1, advanced: 2, pro: 3 };

interface QuickToolsPanelProps {
  onSelectTool: (action: string) => void;
  currentPlan?: string;
  onUpgrade?: () => void;
}

export default function QuickToolsPanel({ onSelectTool, currentPlan = "pro", onUpgrade }: QuickToolsPanelProps) {
  const userLevel = planLevel[currentPlan] || 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
      {quickTools.map((tool, i) => {
        const locked = planLevel[tool.requiredPlan] > userLevel;
        return (
          <motion.button
            key={tool.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => locked ? onUpgrade?.() : onSelectTool(tool.action)}
            className={`p-3 rounded-xl glass border border-border hover:border-primary/20 hover:glow transition-all group text-left relative ${
              locked ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xl mb-1 block">{tool.icon}</span>
              {locked && <Lock className="w-3 h-3 text-warning" />}
            </div>
            <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{tool.title}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{tool.description}</p>
          </motion.button>
        );
      })}
    </div>
  );
}
