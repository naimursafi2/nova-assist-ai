import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Paperclip, Mic } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
    if (inputRef.current) inputRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = inputRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 150) + "px";
    }
  };

  return (
    <div className="p-3 sm:p-4 border-t border-border">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-2 rounded-2xl glass border border-border p-2 glow transition-shadow focus-within:ring-1 focus-within:ring-primary/50">
          <button className="p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0" title="Attach file">
            <Paperclip className="w-4 h-4 text-muted-foreground" />
          </button>

          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Ask me anything..."
            rows={1}
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground resize-none max-h-[150px] py-2"
          />

          <button className="p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0" title="Voice input">
            <Mic className="w-4 h-4 text-muted-foreground" />
          </button>

          <button
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            className="p-2 rounded-xl gradient-btn text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </motion.div>
        <p className="text-center text-[10px] text-muted-foreground mt-2">
          Nova AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
}
