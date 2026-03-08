import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Paperclip, BookOpen, Globe } from "lucide-react";
import { UploadedFile } from "@/lib/chatData";
import FileUpload from "./FileUpload";
import VoiceMode from "./VoiceMode";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  webSearch: boolean;
  onToggleWebSearch: () => void;
  files: UploadedFile[];
  onAddFiles: (files: UploadedFile[]) => void;
  onRemoveFile: (id: string) => void;
  onOpenPromptLibrary: () => void;
  activeMode: string;
}

export default function ChatInput({
  onSend, disabled, webSearch, onToggleWebSearch,
  files, onAddFiles, onRemoveFile, onOpenPromptLibrary, activeMode,
}: ChatInputProps) {
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

  const handleVoiceTranscript = (text: string) => {
    setValue(text);
  };

  return (
    <div className="p-3 sm:p-4 border-t border-border">
      <div className="max-w-3xl mx-auto space-y-2">
        {/* Attached files */}
        <FileUpload files={files} onAddFiles={onAddFiles} onRemoveFile={onRemoveFile} compact />

        {/* Web search indicator */}
        {webSearch && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/5 text-primary text-xs font-medium w-fit">
            <Globe className="w-3 h-3" />
            <span>Web search active</span>
          </div>
        )}

        <div className="flex items-end gap-2 rounded-2xl glass border border-border p-2 glow transition-shadow focus-within:ring-1 focus-within:ring-primary/50">
          <button
            onClick={() => {
              // Trigger file input
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".pdf,.docx,.doc,.txt";
              input.multiple = true;
              input.onchange = (e) => {
                const fl = (e.target as HTMLInputElement).files;
                if (fl) {
                  const newFiles: UploadedFile[] = Array.from(fl).map((f) => ({
                    id: Date.now().toString() + Math.random(),
                    name: f.name,
                    type: f.type,
                    size: f.size,
                  }));
                  onAddFiles(newFiles);
                }
              };
              input.click();
            }}
            className="p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
            title="Attach file"
          >
            <Paperclip className="w-4 h-4 text-muted-foreground" />
          </button>

          <button
            onClick={onOpenPromptLibrary}
            className="p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
            title="Prompt library"
          >
            <BookOpen className="w-4 h-4 text-muted-foreground" />
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

          <VoiceMode onTranscript={handleVoiceTranscript} />

          <button
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            className="p-2 rounded-xl gradient-btn text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-[10px] text-muted-foreground mt-2">
          Nova AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
}
