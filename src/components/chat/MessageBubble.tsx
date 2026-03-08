import { motion } from "framer-motion";
import { Bot, User, Copy, RefreshCw, ThumbsUp, ThumbsDown, Check } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Message } from "@/lib/chatData";

interface MessageBubbleProps {
  message: Message;
  onRegenerate?: () => void;
}

export default function MessageBubble({ message, onRegenerate }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<null | "up" | "down">(null);

  const copyText = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const time = message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 px-4 sm:px-8 lg:px-16 py-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isUser
            ? "gradient-btn"
            : "bg-card border border-border"
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-primary-foreground" />
        ) : (
          <Bot className="w-4 h-4 text-primary" />
        )}
      </div>

      <div className={`max-w-[75%] min-w-0 ${isUser ? "text-right" : ""}`}>
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
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-pre:bg-muted prose-pre:rounded-lg prose-code:text-primary prose-code:font-mono prose-headings:text-foreground">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        <div className={`flex items-center gap-1 mt-1.5 ${isUser ? "justify-end" : ""}`}>
          <span className="text-[10px] text-muted-foreground mr-1">{time}</span>
          {!isUser && (
            <>
              <button onClick={copyText} className="p-1 rounded hover:bg-muted transition-colors" title="Copy">
                {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
              </button>
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
  );
}
