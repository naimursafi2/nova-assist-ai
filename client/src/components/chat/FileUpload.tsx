import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileText, File } from "lucide-react";
import { useState, useRef } from "react";
import { UploadedFile } from "@/lib/chatData";

interface FileUploadProps {
  files: UploadedFile[];
  onAddFiles: (files: UploadedFile[]) => void;
  onRemoveFile: (id: string) => void;
  compact?: boolean;
}

const fileIcons: Record<string, string> = {
  pdf: "📄",
  docx: "📝",
  doc: "📝",
  txt: "📃",
};

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return fileIcons[ext] || "📎";
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function FileUpload({ files, onAddFiles, onRemoveFile, compact }: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList) => {
    const newFiles: UploadedFile[] = Array.from(fileList).map((f) => ({
      id: Date.now().toString() + Math.random(),
      name: f.name,
      type: f.type,
      size: f.size,
    }));
    onAddFiles(newFiles);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  if (compact && files.length === 0) return null;

  if (compact) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {files.map((f) => (
          <div key={f.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted text-xs shrink-0">
            <span>{getFileIcon(f.name)}</span>
            <span className="truncate max-w-[100px] text-foreground">{f.name}</span>
            <button onClick={() => onRemoveFile(f.id)} className="text-muted-foreground hover:text-destructive">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
          dragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40 hover:bg-muted/30"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm font-medium text-foreground">Drop files here or click to upload</p>
        <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT — up to 20MB</p>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((f) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                className="flex items-center gap-3 p-3 rounded-xl glass border border-border"
              >
                <span className="text-2xl">{getFileIcon(f.name)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(f.size)}</p>
                </div>
                <button
                  onClick={() => onRemoveFile(f.id)}
                  className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
