import { useEffect, useRef } from "react";
import { Message } from "@/lib/chatData";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import WelcomeScreen from "./WelcomeScreen";

interface ChatWindowProps {
  messages: Message[];
  isTyping: boolean;
  onPromptClick: (prompt: string) => void;
  activeMode: string;
  onSelectMode: (mode: string) => void;
  onOpenCommandPalette: () => void;
  recentChatsCount: number;
  currentPlan: string;
  onUpgrade: () => void;
}

export default function ChatWindow({
  messages, isTyping, onPromptClick, activeMode, onSelectMode,
  onOpenCommandPalette, recentChatsCount, currentPlan, onUpgrade,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  if (messages.length === 0) {
    return (
      <WelcomeScreen
        onPromptClick={onPromptClick}
        activeMode={activeMode}
        onSelectMode={onSelectMode}
        onOpenCommandPalette={onOpenCommandPalette}
        recentChatsCount={recentChatsCount}
        currentPlan={currentPlan}
        onUpgrade={onUpgrade}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin py-4">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {isTyping && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
