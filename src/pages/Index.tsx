import { useState, useCallback, useEffect } from "react";
import { Chat, Message, UploadedFile, dummyChats, aiModes as allModes } from "@/lib/chatData";
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
import SubscriptionModal from "@/components/chat/SubscriptionModal";

const AI_RESPONSES_EN = [
  "That's a great question! Let me break it down for you.\n\nHere are the key points:\n\n1. **Start with the basics** — understand the fundamentals first\n2. **Practice regularly** — consistency is key\n3. **Build projects** — apply what you learn\n\nWould you like me to elaborate on any of these?",
  "I'd be happy to help with that! Here's what I recommend:\n\n```javascript\nconst solution = () => {\n  // Your implementation here\n  return 'success';\n};\n```\n\nThis approach is clean and maintainable. Let me know if you need more details!",
  "Absolutely! Here's a comprehensive overview:\n\n## Overview\nThis topic covers several important aspects that are worth understanding.\n\n## Key Takeaways\n- Focus on **quality** over quantity\n- Use modern tools and frameworks\n- Keep learning and adapting\n\nFeel free to ask follow-up questions!",
];

const MODE_RESPONSES: Record<string, string> = {
  slides: "📊 **Slide Deck Generated!**\n\nHere's your presentation outline:\n\n## Slide 1: Title\n**Your Topic** — A compelling subtitle\n\n## Slide 2: Overview\n- Key point 1\n- Key point 2\n- Key point 3\n\n## Slide 3: Deep Dive\nDetailed analysis with data visualizations\n\n## Slide 4: Conclusion\nKey takeaways and next steps\n\n---\n*💡 Tip: You can ask me to expand any slide or change the style.*",
  ideas: "💡 **Brainstorm Results**\n\nHere are some innovative ideas:\n\n### 🚀 Concept 1: AI-Powered Solution\nLeverage machine learning to automate the process\n\n### 🎯 Concept 2: Community-Driven\nBuild a platform where users contribute and benefit\n\n### 💎 Concept 3: Premium Experience\nCreate a high-value offering with exclusive features\n\n### 📈 Concept 4: Data-First Approach\nUse analytics to drive decisions\n\n*Which idea interests you most?*",
  content: "📝 **Content Generated!**\n\n# Your Article Title\n\n## Introduction\nCapture attention with a compelling hook that draws readers in...\n\n## Main Points\n\n### 1. The Current Landscape\nAnalysis of where things stand today.\n\n### 2. Key Trends\nWhat's changing and why it matters.\n\n### 3. Actionable Steps\nConcrete things readers can do right now.\n\n## Conclusion\nWrap up with a strong call to action.\n\n---\n*Want me to expand any section or adjust the tone?*",
  document: "📄 **Document Analysis Complete**\n\n## Key Findings\n- **Main Topic**: The document discusses...\n- **Word Count**: ~2,500 words\n- **Reading Level**: Professional\n\n## Summary\nThe document covers three main areas with detailed analysis and recommendations.\n\n## Key Insights\n1. Important finding #1\n2. Critical data point #2\n3. Action item #3\n\n*Ask me specific questions about the document!*",
  research: "🔬 **Research Report**\n\n## Topic Analysis\n\n### Background\nComprehensive overview of the current state of research.\n\n### Key Sources\n📚 Academic papers, industry reports, and expert analyses\n\n### Findings\n1. **Primary finding** — Supported by multiple sources\n2. **Secondary finding** — Emerging trend\n3. **Tertiary finding** — Requires further study\n\n### Conclusion\nThe evidence suggests...\n\n*Sources: 12 academic papers, 5 industry reports*",
};

const IMAGE_ANALYSIS_RESPONSE = "🖼️ **Image Analysis Complete**\n\n## Visual Description\nThe image contains interesting visual elements.\n\n## Key Observations\n- **Composition**: Well-structured layout\n- **Colors**: Cohesive palette\n- **Details**: Notable details worth highlighting\n\nWould you like me to focus on any specific aspect?";

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
    const { aiModes } = require("@/lib/chatData");
    const modeData = aiModes.find((m: any) => m.id === mode);
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
