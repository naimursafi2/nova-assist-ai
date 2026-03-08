import { useState, useCallback, useEffect, useRef } from "react";
import { Chat, Message, UploadedFile, dummyChats, aiModes as allModes } from "@/lib/chatData";
import { detectLanguage } from "@/lib/languageUtils";
import { streamChat, ChatMessage } from "@/lib/streamChat";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatInput from "@/components/chat/ChatInput";
import ModeSwitcher from "@/components/chat/ModeSwitcher";
import SettingsModal from "@/components/chat/SettingsModal";
import ProfilePanel from "@/components/chat/ProfilePanel";
import MemoryPanel from "@/components/chat/MemoryPanel";
import PromptLibraryModal from "@/components/chat/PromptLibraryModal";
import CommandPalette from "@/components/chat/CommandPalette";
import SubscriptionModal from "@/components/chat/SubscriptionModal";
import { toast } from "sonner";

const planLevel: Record<string, number> = { guest: 0, basic: 1, advanced: 2, pro: 3 };
const planMessageLimits: Record<string, number> = { guest: 5, basic: 50, advanced: 200, pro: 9999 };

export default function Index() {
  const [chats, setChats] = useState<Chat[]>(dummyChats);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [activeMode, setActiveMode] = useState("chat");
  const [webSearch, setWebSearch] = useState(false);
  const [selectedModel, setSelectedModel] = useState("nova-smart");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("auto");
  const [detectedLanguage, setDetectedLanguage] = useState<{ name: string; flag: string; isBanglish?: boolean } | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("advanced");
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [messageCount, setMessageCount] = useState(0);
  const streamingRef = useRef(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  // Convert chat history to API format
  const buildApiMessages = (chatMessages: Message[]): ChatMessage[] => {
    return chatMessages.map((m) => ({
      role: m.role === "user" ? "user" as const : "assistant" as const,
      content: m.content,
    }));
  };

  const handleSend = useCallback(
    (content: string) => {
      if (streamingRef.current) return;

      const limit = planMessageLimits[currentPlan] || 5;
      if (messageCount >= limit) {
        setShowSubscription(true);
        return;
      }

      const detected = selectedLanguage === "auto"
        ? detectLanguage(content)
        : { code: selectedLanguage, name: "", flag: "", confidence: 1, isBanglish: false };

      if (selectedLanguage === "auto" && content) {
        setDetectedLanguage({ name: detected.name, flag: detected.flag, isBanglish: detected.isBanglish });
        setTimeout(() => setDetectedLanguage(null), 5000);
      }

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: new Date(),
        files: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined,
        images: uploadedImages.length > 0 ? [...uploadedImages] : undefined,
      };

      setUploadedFiles([]);
      setUploadedImages([]);
      setMessageCount((prev) => prev + 1);

      let targetChatId = activeChatId;

      if (!activeChatId) {
        const newChat: Chat = {
          id: Date.now().toString(),
          title: content.slice(0, 40) || "New Chat",
          messages: [userMsg],
          createdAt: new Date(),
        };
        setChats((prev) => [newChat, ...prev]);
        setActiveChatId(newChat.id);
        targetChatId = newChat.id;
      } else {
        setChats((prev) =>
          prev.map((c) =>
            c.id === activeChatId ? { ...c, messages: [...c.messages, userMsg] } : c
          )
        );
      }

      // Start streaming AI response
      setIsTyping(true);
      streamingRef.current = true;

      const aiMsgId = (Date.now() + 1).toString();

      // Build history for the API
      const currentChat = chats.find(c => c.id === targetChatId);
      const allMessages = currentChat ? [...currentChat.messages, userMsg] : [userMsg];
      const apiMessages = buildApiMessages(allMessages);

      // Create empty AI message that will be filled by streaming
      const emptyAiMsg: Message = {
        id: aiMsgId,
        role: "ai",
        content: "",
        timestamp: new Date(),
      };
      setChats((prev) =>
        prev.map((c) =>
          c.id === targetChatId ? { ...c, messages: [...c.messages, emptyAiMsg] } : c
        )
      );

      let accumulated = "";

      streamChat({
        messages: apiMessages,
        mode: activeMode,
        onDelta: (chunk) => {
          accumulated += chunk;
          const currentContent = accumulated;
          setChats((prev) =>
            prev.map((c) => {
              if (c.id !== targetChatId) return c;
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === aiMsgId ? { ...m, content: currentContent } : m
                ),
              };
            })
          );
        },
        onDone: () => {
          setIsTyping(false);
          streamingRef.current = false;
        },
        onError: (error) => {
          setIsTyping(false);
          streamingRef.current = false;
          toast.error(error);
          // Update the AI message with error
          setChats((prev) =>
            prev.map((c) => {
              if (c.id !== targetChatId) return c;
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === aiMsgId
                    ? { ...m, content: "⚠️ " + error + "\n\nPlease try again." }
                    : m
                ),
              };
            })
          );
        },
      });
    },
    [activeChatId, uploadedFiles, uploadedImages, selectedLanguage, activeMode, currentPlan, messageCount, chats]
  );

  const handleNewChat = () => {
    setActiveChatId(null);
    setDetectedLanguage(null);
  };

  const handleDeleteChat = (id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (activeChatId === id) setActiveChatId(null);
  };

  const handleRenameChat = (id: string, title: string) => {
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
  };

  const handlePinChat = (id: string) => {
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)));
  };

  const handleStarChat = (id: string) => {
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, starred: !c.starred } : c)));
  };

  const handleAddFiles = (files: UploadedFile[]) => {
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleAddImages = (urls: string[]) => {
    setUploadedImages((prev) => [...prev, ...urls]);
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectMode = useCallback((mode: string) => {
    const modeData = allModes.find((m) => m.id === mode);
    if (modeData) {
      const requiredLevel = planLevel[modeData.requiredPlan] || 0;
      const userLevel = planLevel[currentPlan] || 0;
      if (requiredLevel > userLevel) {
        setShowSubscription(true);
        return;
      }
    }
    setActiveMode(mode);
  }, [currentPlan]);

  const handleCommandAction = useCallback((action: string, payload?: string) => {
    switch (action) {
      case "open-palette":
        setShowCommandPalette(true);
        break;
      case "new-chat":
        handleNewChat();
        break;
      case "prompt-library":
        setShowPromptLibrary(true);
        break;
      case "memory":
        setShowMemory(true);
        break;
      case "settings":
        setShowSettings(true);
        break;
      case "toggle-web-search":
        setWebSearch((prev) => !prev);
        break;
      case "switch-mode":
        if (payload) setActiveMode(payload);
        break;
      case "quick-tool":
        if (payload) handleSend(payload);
        break;
      case "use-prompt":
        if (payload) handleSend(payload);
        break;
      case "upload-file": {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".pdf,.docx,.doc,.txt";
        input.multiple = true;
        input.onchange = (e) => {
          const fl = (e.target as HTMLInputElement).files;
          if (fl) {
            handleAddFiles(Array.from(fl).map((f) => ({
              id: Date.now().toString() + Math.random(),
              name: f.name, type: f.type, size: f.size,
            })));
          }
        };
        input.click();
        break;
      }
      case "upload-image": {
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
                  if (urls.length === fl.length) handleAddImages(urls);
                }
              };
              reader.readAsDataURL(file);
            });
          }
        };
        input.click();
        break;
      }
    }
  }, [handleSend]);

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
        onStarChat={handleStarChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode(!darkMode)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenMemory={() => setShowMemory(true)}
        onOpenPromptLibrary={() => setShowPromptLibrary(true)}
        onOpenProfile={() => setShowProfile(true)}
        currentPlan={currentPlan}
        onUpgrade={() => setShowSubscription(true)}
        isLoggedIn={isLoggedIn}
        onLogin={() => setIsLoggedIn(true)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-4 py-2 border-b border-border">
          <ModeSwitcher activeMode={activeMode} onSelectMode={setActiveMode} compact currentPlan={currentPlan} onUpgrade={() => setShowSubscription(true)} />
        </div>

        <ChatHeader
          title={activeChat?.title || ""}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(true)}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          webSearch={webSearch}
          onToggleWebSearch={() => setWebSearch(!webSearch)}
          activeMode={activeMode}
          selectedLanguage={selectedLanguage}
          onSelectLanguage={setSelectedLanguage}
          detectedLanguage={detectedLanguage}
          currentPlan={currentPlan}
          messageCount={messageCount}
        />
        <ChatWindow
          messages={activeChat?.messages || []}
          isTyping={isTyping}
          onPromptClick={handleSend}
          activeMode={activeMode}
          onSelectMode={setActiveMode}
          onOpenCommandPalette={() => setShowCommandPalette(true)}
          recentChatsCount={chats.length}
          currentPlan={currentPlan}
          onUpgrade={() => setShowSubscription(true)}
        />
        <ChatInput
          onSend={handleSend}
          disabled={isTyping}
          webSearch={webSearch}
          onToggleWebSearch={() => setWebSearch(!webSearch)}
          files={uploadedFiles}
          onAddFiles={handleAddFiles}
          onRemoveFile={handleRemoveFile}
          onOpenPromptLibrary={() => setShowPromptLibrary(true)}
          activeMode={activeMode}
          images={uploadedImages}
          onAddImages={handleAddImages}
          onRemoveImage={handleRemoveImage}
        />
      </div>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode(!darkMode)}
        webSearch={webSearch}
        onToggleWebSearch={() => setWebSearch(!webSearch)}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        voiceEnabled={voiceEnabled}
        onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
        memoryEnabled={memoryEnabled}
        onToggleMemory={() => setMemoryEnabled(!memoryEnabled)}
      />
      <MemoryPanel isOpen={showMemory} onClose={() => setShowMemory(false)} />
      <PromptLibraryModal
        isOpen={showPromptLibrary}
        onClose={() => setShowPromptLibrary(false)}
        onSelectPrompt={(p) => handleSend(p)}
      />
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onAction={handleCommandAction}
      />
      <SubscriptionModal
        isOpen={showSubscription}
        onClose={() => setShowSubscription(false)}
        currentPlan={currentPlan}
        onSelectPlan={(plan) => { setCurrentPlan(plan); setShowSubscription(false); }}
      />
      <ProfilePanel
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        currentPlan={currentPlan}
        messageCount={messageCount}
        onUpgrade={() => { setShowProfile(false); setShowSubscription(true); }}
        onLogout={() => { setIsLoggedIn(false); setShowProfile(false); }}
      />
    </div>
  );
}
