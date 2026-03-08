import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, BookOpen, Globe, Image, X } from "lucide-react";
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
  images: string[];
  onAddImages: (urls: string[]) => void;
  onRemoveImage: (index: number) => void;
}

export default function ChatInput({
  onSend, disabled, webSearch, onToggleWebSearch,
  files, onAddFiles, onRemoveFile, onOpenPromptLibrary, activeMode,
  images, onAddImages, onRemoveImage,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if ((!value.trim() && images.length === 0) || disabled) return;
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

  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = (e) => {
      const fl = (e.target as HTMLInputElement).files;
      if (fl) {
        const urls: string[] = [];
        Array.from(fl).forEach((file) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            if (ev.target?.result) {
              urls.push(ev.target.result as string);
              if (urls.length === fl.length) {
                onAddImages(urls);
              }
            }
          };
          reader.readAsDataURL(file);
        });
      }
    };
    input.click();
  };

  return (
    <div className="p-3 sm:p-4 border-t border-border">
      <div className="max-w-3xl mx-auto space-y-2">
        {/* Attached files */}
        <FileUpload files={files} onAddFiles={onAddFiles} onRemoveFile={onRemoveFile} compact />

        {/* Image previews */}
        <AnimatePresence>
          {images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2 overflow-x-auto pb-1"
            >
              {images.map((img, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-border group"
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => onRemoveImage(i)}
                    className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-foreground" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

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
            onClick={handleImageUpload}
            className="p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
            title="Upload image"
          >
            <Image className="w-4 h-4 text-muted-foreground" />
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
            placeholder="Ask me anything... (⌘K for commands)"
            rows={1}
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground resize-none max-h-[150px] py-2"
          />

          <VoiceMode onTranscript={handleVoiceTranscript} />

          <button
            onClick={handleSend}
            disabled={(!value.trim() && images.length === 0) || disabled}
            className="p-2 rounded-xl gradient-btn text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-[10px] text-muted-foreground mt-2">
          Aura AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
}
