export interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  pinned?: boolean;
  createdAt: Date;
}

export const dummyChats: Chat[] = [
  {
    id: "1",
    title: "How to build a REST API",
    pinned: true,
    createdAt: new Date(Date.now() - 3600000),
    messages: [
      { id: "1a", role: "user", content: "How do I build a REST API with Node.js?", timestamp: new Date(Date.now() - 3600000) },
      { id: "1b", role: "ai", content: "Great question! Here's a step-by-step guide to building a REST API with Node.js:\n\n## 1. Setup\n```bash\nnpm init -y\nnpm install express\n```\n\n## 2. Create your server\n```javascript\nconst express = require('express');\nconst app = express();\napp.use(express.json());\n\napp.get('/api/users', (req, res) => {\n  res.json([{ id: 1, name: 'John' }]);\n});\n\napp.listen(3000);\n```\n\n## 3. Add more routes\nYou can add POST, PUT, DELETE routes following the same pattern. Would you like me to elaborate on any of these steps?", timestamp: new Date(Date.now() - 3500000) },
    ],
  },
  {
    id: "2",
    title: "React best practices",
    pinned: false,
    createdAt: new Date(Date.now() - 86400000),
    messages: [
      { id: "2a", role: "user", content: "What are the best practices for React in 2025?", timestamp: new Date(Date.now() - 86400000) },
      { id: "2b", role: "ai", content: "Here are the top React best practices for 2025:\n\n1. **Use Server Components** where possible\n2. **Prefer `use` hook** for data fetching\n3. **Keep components small** and focused\n4. **Use TypeScript** for type safety\n5. **Leverage React Compiler** for automatic memoization\n\nWould you like details on any of these?", timestamp: new Date(Date.now() - 86300000) },
    ],
  },
  {
    id: "3",
    title: "Python data analysis",
    pinned: false,
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
