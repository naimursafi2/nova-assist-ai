import { motion } from "framer-motion";
import { Bot, User, Copy, RefreshCw, ThumbsUp, ThumbsDown, Check, ExternalLink, Image } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Message } from "@/lib/chatData";
import { SpeakButton } from "./VoiceMode";

interface MessageBubbleProps {
  message: Message;
  onRegenerate?: () => void;
}

export default function MessageBubble({ message, onRegenerate }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<null | "up" | "down">(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const copyText = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const time = message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex gap-3 px-4 sm:px-8 lg:px-16 py-3 ${isUser ? "flex-row-reverse" : ""}`}
      >
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isUser ? "gradient-btn" : "bg-card border border-border"
          }`}
        >
          {isUser ? (
            <User className="w-4 h-4 text-primary-foreground" />
          ) : (
            <Bot className="w-4 h-4 text-primary" />
          )}
        </div>

        <div className={`max-w-[75%] min-w-0 ${isUser ? "text-right" : ""}`}>
          {/* Files attached */}
          {message.files && message.files.length > 0 && (
            <div className={`flex gap-2 mb-2 flex-wrap ${isUser ? "justify-end" : ""}`}>
              {message.files.map((f) => (
                <div key={f.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted text-xs border border-border">
                  <span>📎</span>
                  <span className="text-foreground truncate max-w-[120px]">{f.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Images attached */}
          {message.images && message.images.length > 0 && (
            <div className={`flex gap-2 mb-2 flex-wrap ${isUser ? "justify-end" : ""}`}>
              {message.images.map((img, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setExpandedImage(img)}
                  className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-xl overflow-hidden border border-border group cursor-pointer"
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors flex items-center justify-center">
                    <Image className="w-5 h-5 text-foreground opacity-0 group-hover:opacity-80 transition-opacity" />
                  </div>
                </motion.button>
              ))}
            </div>
          )}

          {message.content && (
            <div
              className={`inline-block rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                isUser
                  ? "bg-chat-user text-chat-user-foreground rounded-tr-md"
                  : "bg-chat-ai text-chat-ai-foreground rounded-tl-md"
              }`}
            >
              {isUser ? (
                <p>{message.content}</p>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-pre:bg-muted prose-pre:rounded-xl prose-pre:border prose-pre:border-border prose-pre:p-3 prose-code:text-primary prose-code:font-mono prose-code:text-xs prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary prose-li:my-0.5">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              )}
            </div>
          )}

          {/* Sources / Citations */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-2 space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Sources</p>
              {message.sources.map((src, i) => (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                >
                  <ExternalLink className="w-3 h-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors truncate">
                      {src.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{src.snippet}</p>
                  </div>
                </a>
              ))}
            </div>
          )}

          <div className={`flex items-center gap-1 mt-1.5 ${isUser ? "justify-end" : ""}`}>
            <span className="text-[10px] text-muted-foreground mr-1">{time}</span>
            {!isUser && (
              <>
                <button onClick={copyText} className="p-1 rounded hover:bg-muted transition-colors" title="Copy">
                  {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                </button>
                <SpeakButton content={message.content} />
                <button onClick={onRegenerate} className="p-1 rounded hover:bg-muted transition-colors" title="Regenerate">
                  <RefreshCw className="w-3 h-3 text-muted-foreground" />
                </button>
                <button
                  onClick={() => setLiked(liked === "up" ? null : "up")}
                  className="p-1 rounded hover:bg-muted transition-colors"
                >
                  <ThumbsUp className={`w-3 h-3 ${liked === "up" ? "text-primary" : "text-muted-foreground"}`} />
                </button>
                <button
                  onClick={() => setLiked(liked === "down" ? null : "down")}
                  className="p-1 rounded hover:bg-muted transition-colors"
                >
                  <ThumbsDown className={`w-3 h-3 ${liked === "down" ? "text-destructive" : "text-muted-foreground"}`} />
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Image lightbox */}
      {expandedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm cursor-pointer"
          onClick={() => setExpandedImage(null)}
        >
          <motion.img
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            src={expandedImage}
            alt=""
            className="max-w-full max-h-[85vh] rounded-2xl border border-border float-shadow object-contain"
          />
        </motion.div>
      )}
    </>
  );
}
