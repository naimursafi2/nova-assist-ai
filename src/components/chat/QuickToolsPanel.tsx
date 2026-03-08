import { motion } from "framer-motion";
import { quickTools } from "@/lib/chatData";

interface QuickToolsPanelProps {
  onSelectTool: (action: string) => void;
}

export default function QuickToolsPanel({ onSelectTool }: QuickToolsPanelProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {quickTools.map((tool, i) => (
        <motion.button
          key={tool.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          onClick={() => onSelectTool(tool.action)}
          className="p-3 rounded-xl glass border border-border hover:border-primary/20 hover:glow transition-all group text-left"
        >
          <span className="text-xl mb-1 block">{tool.icon}</span>
          <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{tool.title}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{tool.description}</p>
        </motion.button>
      ))}
    </div>
  );
}
