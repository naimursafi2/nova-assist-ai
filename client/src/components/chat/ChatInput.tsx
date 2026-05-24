import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Image, X, Globe } from "lucide-react";
import { UploadedFile } from "@/lib/chatData";
import FileUpload from "./FileUpload";

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
  onSend,
  disabled,
  webSearch,
  files,
  onAddFiles,
  onRemoveFile,
  images,
  onAddImages,
  onRemoveImage,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if ((!value.trim() && images.length === 0) || disabled) return;
    onSend(value.trim());
    setValue("");
    if (inputRef.current) inputRef.current.style.height = "auto";
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
  };

  const handleFileUpload = (accept: string, kind: "file" | "image") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.multiple = true;
    input.onchange = (event) => {
      const selected = (event.target as HTMLInputElement).files;
      if (!selected) return;

      if (kind === "file") {
        onAddFiles(Array.from(selected).map((file) => ({
          id: Date.now().toString() + Math.random(),
          name: file.name,
          type: file.type,
          size: file.size,
        })));
        return;
      }

      const urls: string[] = [];
      Array.from(selected).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          if (!readerEvent.target?.result) return;
          urls.push(readerEvent.target.result as string);
          if (urls.length === selected.length) onAddImages(urls);
        };
        reader.readAsDataURL(file);
      });
    };
    input.click();
  };

  return (
    <div className="p-3 sm:p-4 border-t border-border">
      <div className="max-w-3xl mx-auto space-y-2">
        <FileUpload files={files} onAddFiles={onAddFiles} onRemoveFile={onRemoveFile} compact />

        <AnimatePresence>
          {images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2 overflow-x-auto pb-1"
            >
              {images.map((img, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-border group"
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => onRemoveImage(index)}
                    className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove image"
                  >
                    <X className="w-3 h-3 text-foreground" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {webSearch && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/5 text-primary text-xs font-medium w-fit">
            <Globe className="w-3 h-3" />
            <span>Web search active</span>
          </div>
        )}

        <div className="flex items-end gap-2 rounded-2xl glass border border-border p-2 glow transition-shadow focus-within:ring-1 focus-within:ring-primary/50">
          <button
            onClick={() => handleFileUpload(".pdf,.docx,.doc,.txt", "file")}
            className="p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
            title="Attach file"
          >
            <Paperclip className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => handleFileUpload("image/*", "image")}
            className="p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
            title="Upload image"
          >
            <Image className="w-4 h-4 text-muted-foreground" />
          </button>

          <textarea
            ref={inputRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Ask Nova Assist anything..."
            rows={1}
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground resize-none max-h-[150px] py-2"
          />

          <button
            onClick={handleSend}
            disabled={(!value.trim() && images.length === 0) || disabled}
            className="p-2 rounded-xl gradient-btn text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-[10px] text-muted-foreground mt-2">
          Nova Assist can make mistakes. Check important information.
        </p>
      </div>
    </div>
  );
}
