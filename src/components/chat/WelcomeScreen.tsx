import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { suggestedPrompts } from "@/lib/chatData";

interface WelcomeScreenProps {
  onPromptClick: (prompt: string) => void;
}

export default function WelcomeScreen({ onPromptClick }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="w-16 h-16 rounded-2xl gradient-btn mx-auto flex items-center justify-center glow mb-4">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold gradient-text mb-2">How can I help you today?</h2>
          <p className="text-sm text-muted-foreground">
            I'm Nova AI, your intelligent assistant. Ask me anything or pick a prompt below.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestedPrompts.map((prompt, i) => (
            <motion.button
              key={prompt.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              onClick={() => onPromptClick(prompt.title + ": " + prompt.description)}
              className="glass border border-border rounded-xl p-4 text-left hover:bg-muted/50 transition-all group hover:glow"
            >
              <span className="text-2xl mb-2 block">{prompt.icon}</span>
              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {prompt.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{prompt.description}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
