import { useState, useCallback, useEffect } from "react";
import { Chat, Message, UploadedFile, dummyChats, aiModes as allModes } from "@/lib/chatData";
import { detectLanguage } from "@/lib/languageUtils";
import { generateSmartResponse } from "@/lib/responseEngine";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatInput from "@/components/chat/ChatInput";
import ModeSwitcher from "@/components/chat/ModeSwitcher";
import SettingsModal from "@/components/chat/SettingsModal";
import MemoryPanel from "@/components/chat/MemoryPanel";
import PromptLibraryModal from "@/components/chat/PromptLibraryModal";
import CommandPalette from "@/components/chat/CommandPalette";
import SubscriptionModal from "@/components/chat/SubscriptionModal";

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

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  const handleSend = useCallback(
    (content: string) => {
      // Check message limit
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

      const responseLang = selectedLanguage === "auto" ? detected.code : selectedLanguage;
      const hasImages = uploadedImages.length > 0;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: new Date(),
        files: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined,
        images: hasImages ? [...uploadedImages] : undefined,
      };

      setUploadedFiles([]);
      setUploadedImages([]);
      setMessageCount((prev) => prev + 1);

      const generateAiResponse = (chatId: string) => {
        setIsTyping(true);
        setTimeout(() => {
          let responseContent: string;
          if (hasImages) {
            responseContent = IMAGE_ANALYSIS_RESPONSE;
          } else if (MODE_RESPONSES[activeMode]) {
            responseContent = MODE_RESPONSES[activeMode];
          } else {
            const multiResponse = getMultilingualResponse(responseLang, detected.isBanglish);
            responseContent = multiResponse || AI_RESPONSES_EN[Math.floor(Math.random() * AI_RESPONSES_EN.length)];
          }

          const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "ai",
            content: responseContent,
            timestamp: new Date(),
            sources: webSearch ? [
              { title: "Relevant Article", url: "https://example.com", snippet: "Found via web search..." },
              { title: "Research Paper", url: "https://example.com/paper", snippet: "Academic source with citations..." },
            ] : undefined,
          };
          setChats((prev) =>
            prev.map((c) =>
              c.id === chatId ? { ...c, messages: [...c.messages, aiMsg] } : c
            )
          );
          setIsTyping(false);
        }, 1500);
      };

      if (!activeChatId) {
        const newChat: Chat = {
          id: Date.now().toString(),
          title: content ? content.slice(0, 40) : "Image Analysis",
          messages: [userMsg],
          createdAt: new Date(),
        };
        setChats((prev) => [newChat, ...prev]);
        setActiveChatId(newChat.id);
        generateAiResponse(newChat.id);
      } else {
        setChats((prev) =>
          prev.map((c) =>
            c.id === activeChatId ? { ...c, messages: [...c.messages, userMsg] } : c
          )
        );
        generateAiResponse(activeChatId);
      }
    },
    [activeChatId, webSearch, uploadedFiles, uploadedImages, selectedLanguage, activeMode, currentPlan, messageCount]
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
    </div>
  );
}
