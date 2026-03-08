export interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
  sources?: Source[];
  files?: UploadedFile[];
  images?: string[];
}

export interface Source {
  title: string;
  url: string;
  snippet: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  pinned?: boolean;
  starred?: boolean;
  folder?: string;
  createdAt: Date;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
}

export interface AIMode {
  id: string;
  label: string;
  icon: string;
  description: string;
  color: string;
  prompts: { icon: string; title: string; description: string }[];
}

export interface PromptTemplate {
  id: string;
  category: string;
  title: string;
  prompt: string;
  icon: string;
}

export interface QuickTool {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: string;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  badge?: string;
}

export interface MemoryItem {
  id: string;
  type: "preference" | "tone" | "task" | "context";
  content: string;
  createdAt: Date;
}

export const aiModes: AIMode[] = [
  {
    id: "chat",
    label: "Chat Assistant",
    icon: "💬",
    description: "General-purpose AI assistant",
    color: "from-primary to-accent",
    prompts: [
      { icon: "💡", title: "Explain a concept", description: "Break down complex topics simply" },
      { icon: "🤔", title: "Answer a question", description: "Get accurate, detailed answers" },
      { icon: "📋", title: "Make a plan", description: "Organize tasks and goals" },
      { icon: "🎨", title: "Creative ideas", description: "Brainstorm and ideate together" },
    ],
  },
  {
    id: "writing",
    label: "Writing Assistant",
    icon: "✍️",
    description: "Write, edit, and improve content",
    color: "from-emerald-500 to-teal-500",
    prompts: [
      { icon: "📝", title: "Draft an email", description: "Professional and polished emails" },
      { icon: "📄", title: "Write an essay", description: "Well-structured academic writing" },
      { icon: "✨", title: "Improve my writing", description: "Polish tone, grammar, and style" },
      { icon: "📰", title: "Blog post", description: "Engaging content for your audience" },
    ],
  },
  {
    id: "study",
    label: "Study Assistant",
    icon: "📚",
    description: "Learn, review, and study smarter",
    color: "from-amber-500 to-orange-500",
    prompts: [
      { icon: "🧠", title: "Explain like I'm 5", description: "Simple explanations for anything" },
      { icon: "📖", title: "Create flashcards", description: "Key concepts as flashcards" },
      { icon: "✅", title: "Quiz me", description: "Test your knowledge interactively" },
      { icon: "📝", title: "Summarize notes", description: "Condense your study material" },
    ],
  },
  {
    id: "research",
    label: "Research Assistant",
    icon: "🔬",
    description: "Deep research and analysis",
    color: "from-violet-500 to-purple-500",
    prompts: [
      { icon: "🔍", title: "Deep dive", description: "Thorough analysis of any topic" },
      { icon: "📊", title: "Compare options", description: "Side-by-side analysis" },
      { icon: "📈", title: "Market research", description: "Industry insights and trends" },
      { icon: "📑", title: "Literature review", description: "Summarize academic sources" },
    ],
  },
  {
    id: "code",
    label: "Code Assistant",
    icon: "💻",
    description: "Write, debug, and explain code",
    color: "from-cyan-500 to-blue-500",
    prompts: [
      { icon: "🛠️", title: "Debug my code", description: "Find and fix bugs fast" },
      { icon: "⚡", title: "Optimize code", description: "Make it faster and cleaner" },
      { icon: "📖", title: "Explain code", description: "Understand any codebase" },
      { icon: "🏗️", title: "Architecture", description: "Design patterns and structure" },
    ],
  },
  {
    id: "business",
    label: "Business Assistant",
    icon: "💼",
    description: "Strategy, planning, and operations",
    color: "from-rose-500 to-pink-500",
    prompts: [
      { icon: "📊", title: "Business plan", description: "Structure your strategy" },
      { icon: "💰", title: "Financial analysis", description: "Numbers and projections" },
      { icon: "🎯", title: "OKRs & Goals", description: "Set and track objectives" },
      { icon: "📧", title: "Client outreach", description: "Professional communication" },
    ],
  },
];

export const promptLibrary: PromptTemplate[] = [
  { id: "w1", category: "Writing", title: "Professional Email", prompt: "Write a professional email about: ", icon: "📧" },
  { id: "w2", category: "Writing", title: "Blog Post Outline", prompt: "Create a detailed blog post outline for: ", icon: "📝" },
  { id: "w3", category: "Writing", title: "Social Media Post", prompt: "Write an engaging social media post about: ", icon: "📱" },
  { id: "s1", category: "Study", title: "Concept Explanation", prompt: "Explain this concept in simple terms: ", icon: "🧠" },
  { id: "s2", category: "Study", title: "Study Guide", prompt: "Create a comprehensive study guide for: ", icon: "📚" },
  { id: "s3", category: "Study", title: "Practice Questions", prompt: "Generate practice questions about: ", icon: "✅" },
  { id: "b1", category: "Business", title: "SWOT Analysis", prompt: "Perform a SWOT analysis for: ", icon: "📊" },
  { id: "b2", category: "Business", title: "Meeting Agenda", prompt: "Create a meeting agenda for: ", icon: "📋" },
  { id: "b3", category: "Business", title: "Project Proposal", prompt: "Draft a project proposal for: ", icon: "📄" },
  { id: "c1", category: "Coding", title: "Code Review", prompt: "Review this code and suggest improvements: ", icon: "🔍" },
  { id: "c2", category: "Coding", title: "API Design", prompt: "Design a REST API for: ", icon: "🔗" },
  { id: "c3", category: "Coding", title: "Unit Tests", prompt: "Write unit tests for: ", icon: "🧪" },
  { id: "p1", category: "Productivity", title: "Weekly Plan", prompt: "Create a productive weekly plan for: ", icon: "📅" },
  { id: "p2", category: "Productivity", title: "Decision Matrix", prompt: "Help me decide between: ", icon: "⚖️" },
  { id: "p3", category: "Productivity", title: "Goal Setting", prompt: "Help me set SMART goals for: ", icon: "🎯" },
  { id: "m1", category: "Marketing", title: "Marketing Strategy", prompt: "Create a marketing strategy for: ", icon: "📈" },
  { id: "m2", category: "Marketing", title: "Ad Copy", prompt: "Write compelling ad copy for: ", icon: "💡" },
  { id: "m3", category: "Marketing", title: "SEO Content", prompt: "Write SEO-optimized content about: ", icon: "🔍" },
];

export const quickTools: QuickTool[] = [
  { id: "t1", title: "Summarize", description: "Condense any text", icon: "📋", action: "Summarize the following text: " },
  { id: "t2", title: "Rewrite", description: "Improve and rephrase", icon: "✨", action: "Rewrite and improve the following: " },
  { id: "t3", title: "Translate", description: "Any language pair", icon: "🌐", action: "Translate the following text: " },
  { id: "t4", title: "Email Draft", description: "Quick professional email", icon: "📧", action: "Draft a professional email about: " },
  { id: "t5", title: "Explain Code", description: "Understand any code", icon: "💻", action: "Explain this code step by step: " },
  { id: "t6", title: "Study Notes", description: "Create study material", icon: "📚", action: "Create detailed study notes for: " },
  { id: "t7", title: "Brainstorm", description: "Generate ideas", icon: "💡", action: "Brainstorm creative ideas for: " },
  { id: "t8", title: "Analyze", description: "Deep analysis", icon: "🔍", action: "Provide a detailed analysis of: " },
];

export const aiModels: AIModel[] = [
  { id: "nova-fast", name: "Nova Fast", description: "Quick responses, great for simple tasks", badge: "Fast" },
  { id: "nova-smart", name: "Nova Smart", description: "Balanced speed and intelligence", badge: "Default" },
  { id: "nova-pro", name: "Nova Pro", description: "Most capable, best for complex tasks", badge: "Pro" },
];

export const defaultMemory: MemoryItem[] = [
  { id: "m1", type: "preference", content: "Prefers concise answers with bullet points", createdAt: new Date(Date.now() - 86400000) },
  { id: "m2", type: "tone", content: "Professional but friendly tone", createdAt: new Date(Date.now() - 172800000) },
  { id: "m3", type: "task", content: "Working on a React project", createdAt: new Date(Date.now() - 3600000) },
  { id: "m4", type: "context", content: "Interested in web development and AI", createdAt: new Date(Date.now() - 259200000) },
];

export const chatFolders = ["All", "Work", "Personal", "Study", "Projects"];

export const dummyChats: Chat[] = [
  {
    id: "1",
    title: "How to build a REST API",
    pinned: true,
    folder: "Work",
    createdAt: new Date(Date.now() - 3600000),
    messages: [
      { id: "1a", role: "user", content: "How do I build a REST API with Node.js?", timestamp: new Date(Date.now() - 3600000) },
      {
        id: "1b", role: "ai", timestamp: new Date(Date.now() - 3500000),
        content: "Great question! Here's a step-by-step guide to building a REST API with Node.js:\n\n## 1. Setup\n```bash\nnpm init -y\nnpm install express\n```\n\n## 2. Create your server\n```javascript\nconst express = require('express');\nconst app = express();\napp.use(express.json());\n\napp.get('/api/users', (req, res) => {\n  res.json([{ id: 1, name: 'John' }]);\n});\n\napp.listen(3000);\n```\n\n## 3. Add more routes\nYou can add POST, PUT, DELETE routes following the same pattern.",
        sources: [
          { title: "Express.js Documentation", url: "https://expressjs.com", snippet: "Fast, unopinionated web framework for Node.js" },
          { title: "REST API Best Practices", url: "https://restfulapi.net", snippet: "Guidelines for building RESTful APIs" },
        ],
      },
    ],
  },
  {
    id: "2",
    title: "React best practices",
    pinned: false,
    folder: "Study",
    createdAt: new Date(Date.now() - 86400000),
    messages: [
      { id: "2a", role: "user", content: "What are the best practices for React in 2025?", timestamp: new Date(Date.now() - 86400000) },
      { id: "2b", role: "ai", content: "Here are the top React best practices for 2025:\n\n1. **Use Server Components** where possible\n2. **Prefer `use` hook** for data fetching\n3. **Keep components small** and focused\n4. **Use TypeScript** for type safety\n5. **Leverage React Compiler** for automatic memoization", timestamp: new Date(Date.now() - 86300000) },
    ],
  },
  {
    id: "3",
    title: "Python data analysis",
    pinned: false,
    folder: "Projects",
    createdAt: new Date(Date.now() - 172800000),
    messages: [
      { id: "3a", role: "user", content: "How do I analyze CSV data with Python?", timestamp: new Date(Date.now() - 172800000) },
      { id: "3b", role: "ai", content: "You can use **pandas** for CSV analysis:\n\n```python\nimport pandas as pd\n\ndf = pd.read_csv('data.csv')\nprint(df.describe())\nprint(df.head())\n```\n\nThis gives you statistical summaries instantly!", timestamp: new Date(Date.now() - 172700000) },
    ],
  },
];

export const suggestedPrompts = [
  { icon: "💡", title: "Explain a concept", description: "Break down complex topics simply" },
  { icon: "✍️", title: "Help me write", description: "Draft emails, essays, or code" },
  { icon: "🔍", title: "Analyze data", description: "Find patterns and insights" },
  { icon: "🎨", title: "Creative ideas", description: "Brainstorm and ideate together" },
];
