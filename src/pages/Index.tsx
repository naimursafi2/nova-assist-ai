import { useState, useCallback, useEffect } from "react";
import { Chat, Message, dummyChats } from "@/lib/chatData";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatInput from "@/components/chat/ChatInput";

const AI_RESPONSES = [
  "That's a great question! Let me break it down for you.\n\nHere are the key points:\n\n1. **Start with the basics** — understand the fundamentals first\n2. **Practice regularly** — consistency is key\n3. **Build projects** — apply what you learn\n\nWould you like me to elaborate on any of these?",
  "I'd be happy to help with that! Here's what I recommend:\n\n```javascript\nconst solution = () => {\n  // Your implementation here\n  return 'success';\n};\n```\n\nThis approach is clean and maintainable. Let me know if you need more details!",
  "Absolutely! Here's a comprehensive overview:\n\n## Overview\nThis topic covers several important aspects that are worth understanding.\n\n## Key Takeaways\n- Focus on **quality** over quantity\n- Use modern tools and frameworks\n- Keep learning and adapting\n\nFeel free to ask follow-up questions!",
];

export default function Index() {
  const [chats, setChats] = useState<Chat[]>(dummyChats);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  const handleSend = useCallback(
    (content: string) => {
      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: new Date(),
      };

      if (!activeChatId) {
        const newChat: Chat = {
          id: Date.now().toString(),
          title: content.slice(0, 40),
          messages: [userMsg],
          createdAt: new Date(),
        };
        setChats((prev) => [newChat, ...prev]);
        setActiveChatId(newChat.id);

        setIsTyping(true);
        setTimeout(() => {
          const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "ai",
            content: AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)],
            timestamp: new Date(),
          };
          setChats((prev) =>
            prev.map((c) =>
              c.id === newChat.id ? { ...c, messages: [...c.messages, aiMsg] } : c
            )
          );
          setIsTyping(false);
        }, 1500);
      } else {
        setChats((prev) =>
          prev.map((c) =>
            c.id === activeChatId ? { ...c, messages: [...c.messages, userMsg] } : c
          )
        );
        setIsTyping(true);
        setTimeout(() => {
          const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "ai",
            content: AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)],
            timestamp: new Date(),
          };
          setChats((prev) =>
            prev.map((c) =>
              c.id === activeChatId ? { ...c, messages: [...c.messages, aiMsg] } : c
            )
          );
          setIsTyping(false);
        }, 1500);
      }
    },
    [activeChatId]
  );

  const handleNewChat = () => setActiveChatId(null);

  const handleDeleteChat = (id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (activeChatId === id) setActiveChatId(null);
  };

  const handleRenameChat = (id: string, title: string) => {
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
  };

  const handlePinChat = (id: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    );
  };

  // Close sidebar on mobile by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-screen w-full gradient-bg overflow-hidden">
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onPinChat={handlePinChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode(!darkMode)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader
          title={activeChat?.title || ""}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(true)}
        />
        <ChatWindow
          messages={activeChat?.messages || []}
          isTyping={isTyping}
          onPromptClick={handleSend}
        />
        <ChatInput onSend={handleSend} disabled={isTyping} />
      </div>
    </div>
  );
}
