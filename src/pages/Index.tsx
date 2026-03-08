import { useState, useCallback, useEffect } from "react";
import { Chat, Message, UploadedFile, dummyChats } from "@/lib/chatData";
import { detectLanguage, getMultilingualResponse } from "@/lib/languageUtils";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatInput from "@/components/chat/ChatInput";
import ModeSwitcher from "@/components/chat/ModeSwitcher";
import SettingsModal from "@/components/chat/SettingsModal";
import MemoryPanel from "@/components/chat/MemoryPanel";
import PromptLibraryModal from "@/components/chat/PromptLibraryModal";
import CommandPalette from "@/components/chat/CommandPalette";

const AI_RESPONSES_EN = [
  "That's a great question! Let me break it down for you.\n\nHere are the key points:\n\n1. **Start with the basics** — understand the fundamentals first\n2. **Practice regularly** — consistency is key\n3. **Build projects** — apply what you learn\n\nWould you like me to elaborate on any of these?",
  "I'd be happy to help with that! Here's what I recommend:\n\n```javascript\nconst solution = () => {\n  // Your implementation here\n  return 'success';\n};\n```\n\nThis approach is clean and maintainable. Let me know if you need more details!",
  "Absolutely! Here's a comprehensive overview:\n\n## Overview\nThis topic covers several important aspects that are worth understanding.\n\n## Key Takeaways\n- Focus on **quality** over quantity\n- Use modern tools and frameworks\n- Keep learning and adapting\n\nFeel free to ask follow-up questions!",
];

const IMAGE_ANALYSIS_RESPONSE = "I can see the image you've uploaded! Here's my analysis:\n\n## Visual Description\nThe image contains interesting visual elements that I can describe in detail.\n\n## Key Observations\n- **Composition**: The layout and arrangement are well-structured\n- **Colors**: The color palette creates a cohesive visual experience\n- **Details**: There are several notable details worth highlighting\n\nWould you like me to focus on any specific aspect of the image?";

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
  const [selectedLanguage, setSelectedLanguage] = useState("auto");
  const [detectedLanguage, setDetectedLanguage] = useState<{ name: string; flag: string; isBanglish?: boolean } | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  const handleSend = useCallback(
    (content: string) => {
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

      const generateAiResponse = (chatId: string) => {
        setIsTyping(true);
        setTimeout(() => {
          let responseContent: string;
          if (hasImages) {
            responseContent = IMAGE_ANALYSIS_RESPONSE;
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
    [activeChatId, webSearch, uploadedFiles, uploadedImages, selectedLanguage]
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
      />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-4 py-2 border-b border-border">
          <ModeSwitcher activeMode={activeMode} onSelectMode={setActiveMode} compact />
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
        />
        <ChatWindow
          messages={activeChat?.messages || []}
          isTyping={isTyping}
          onPromptClick={handleSend}
          activeMode={activeMode}
          onSelectMode={setActiveMode}
          onOpenCommandPalette={() => setShowCommandPalette(true)}
          recentChatsCount={chats.length}
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
    </div>
  );
}
