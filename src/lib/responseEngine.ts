import { Message } from "./chatData";

/**
 * Smart AI Response Engine
 * Generates contextual responses based on user input, conversation history, and detected language.
 */

interface ResponseContext {
  userMessage: string;
  conversationHistory: Message[];
  activeMode: string;
  language: string;
  isBanglish: boolean;
  hasImages: boolean;
  hasFiles: boolean;
}

// Topic detection patterns
const TOPIC_PATTERNS: { topic: string; patterns: RegExp[]; }[] = [
  {
    topic: "javascript_variables",
    patterns: [/\b(javascript|js)\b.*\b(variable|var|let|const)\b/i, /\b(variable|var|let|const)\b.*\b(javascript|js)\b/i, /\bexplain\b.*\bvariable/i],
  },
  {
    topic: "react_component",
    patterns: [/\breact\b.*\bcomponent/i, /\bcomponent\b.*\breact/i, /\bcreate\b.*\breact/i, /\breact\b.*\bcreate/i],
  },
  {
    topic: "react_hooks",
    patterns: [/\breact\b.*\bhook/i, /\buseState\b/i, /\buseEffect\b/i, /\buseRef\b/i, /\bhook\b.*\breact/i],
  },
  {
    topic: "react_general",
    patterns: [/\breact\b/i],
  },
  {
    topic: "python",
    patterns: [/\bpython\b/i, /\bdjango\b/i, /\bflask\b/i, /\bpip\b/i, /\bpandas\b/i, /\bnumpy\b/i],
  },
  {
    topic: "html_css",
    patterns: [/\bhtml\b/i, /\bcss\b/i, /\bflexbox\b/i, /\bgrid\b.*\blayout/i, /\bstyl(e|ing)\b/i, /\bresponsive\b/i],
  },
  {
    topic: "nextjs",
    patterns: [/\bnext\.?js\b/i, /\bnext\b.*\brouting/i, /\bserver\s*component/i, /\bapp\s*router/i],
  },
  {
    topic: "java",
    patterns: [/\bjava\b(?!script)/i, /\bspring\b/i, /\bjvm\b/i],
  },
  {
    topic: "cpp",
    patterns: [/\bc\+\+\b/i, /\bcpp\b/i, /\bpointer\b/i, /\bmemory\s*(management|alloc)/i],
  },
  {
    topic: "c_lang",
    patterns: [/\bc\s+language\b/i, /\bc\s+programming\b/i, /\bprintf\b/i, /\bscanf\b/i],
  },
  {
    topic: "api",
    patterns: [/\bapi\b/i, /\brest\b.*\bapi/i, /\bfetch\b/i, /\bendpoint/i, /\bhttp\b/i],
  },
  {
    topic: "database",
    patterns: [/\bdatabase\b/i, /\bsql\b/i, /\bmongodb\b/i, /\bpostgres/i, /\bmysql\b/i, /\bquery\b/i],
  },
  {
    topic: "git",
    patterns: [/\bgit\b/i, /\bgithub\b/i, /\bcommit\b/i, /\bbranch\b/i, /\bmerge\b/i, /\bpull\s*request/i],
  },
  {
    topic: "debugging",
    patterns: [/\bdebug/i, /\berror\b/i, /\bbug\b/i, /\bfix\b/i, /\bnot\s*work/i, /\bbroken\b/i, /\bcrash/i],
  },
  {
    topic: "algorithm",
    patterns: [/\balgorithm/i, /\bdata\s*structure/i, /\bsort/i, /\bsearch\b.*\balgorithm/i, /\bbig\s*o\b/i, /\brecursion/i],
  },
  {
    topic: "greeting",
    patterns: [/^(hi|hello|hey|howdy|sup|yo|greetings)\b/i, /^(good\s*(morning|afternoon|evening|night))/i, /^(assalamu|salam|namaste)/i],
  },
  {
    topic: "who_are_you",
    patterns: [/\bwho\s*(are|r)\s*you\b/i, /\bwhat\s*(are|r)\s*you\b/i, /\byour\s*name\b/i, /\btumi\s*ke\b/i, /\bapni\s*ke\b/i],
  },
  {
    topic: "thanks",
    patterns: [/^(thanks|thank\s*you|thx|ty|dhonnobad|dhanyabad)/i],
  },
  {
    topic: "math",
    patterns: [/\bcalculat/i, /\bmath/i, /\bequation/i, /\bformula/i, /\b\d+\s*[\+\-\*\/]\s*\d+/],
  },
  {
    topic: "translate",
    patterns: [/\btranslat/i, /\bconvert\b.*\blanguage/i, /\benglis(h|e)\b.*\bbangla/i, /\bbangla\b.*\benglis(h|e)/i],
  },
  {
    topic: "explain",
    patterns: [/^explain\b/i, /\bexplain\b.*\bto\s*me/i, /\bwhat\s*is\b/i, /\bdefin(e|ition)/i, /\bdescribe\b/i],
  },
  {
    topic: "write_code",
    patterns: [/\bwrite\b.*\bcode/i, /\bcode\b.*\bwrite/i, /\bprogram\b.*\bwrite/i, /\bwrite\b.*\bprogram/i, /\bwrite\b.*\bfunction/i, /\bwrite\b.*\bscript/i],
  },
  {
    topic: "ai_ml",
    patterns: [/\bartificial\s*intelligence\b/i, /\bmachine\s*learning\b/i, /\bdeep\s*learning\b/i, /\bneural\s*network/i, /\bai\b/i, /\bml\b/i],
  },
];

// Bangla topic patterns
const BANGLA_TOPIC_PATTERNS: { topic: string; patterns: RegExp[]; }[] = [
  { topic: "greeting_bn", patterns: [/^(আসসালামু|হ্যালো|হাই|নমস্কার|কেমন\s*আছ)/] },
  { topic: "programming_bn", patterns: [/প্রোগ্রামিং|কোড|কোডিং|জাভাস্ক্রিপ্ট|পাইথন|রিয়েক্ট/] },
  { topic: "explain_bn", patterns: [/ব্যাখ্যা|বুঝিয়ে|বলো|বলুন|শেখাও|শিখাও/] },
];

// Banglish topic patterns
const BANGLISH_TOPIC_PATTERNS: { topic: string; patterns: RegExp[]; }[] = [
  { topic: "greeting_banglish", patterns: [/^(kemon\s*ach|ki\s*koro|ki\s*holo|ki\s*khabar|kemon\s*asi)/i] },
  { topic: "explain_banglish", patterns: [/bujai\s*dao|bujhiye|bolen|bolun|shikhao|shekhao/i] },
  { topic: "code_banglish", patterns: [/code\s*ta|code\s*likh|program\s*ta|ki\s*vabe\s*code/i] },
];

// Comprehensive topic-specific responses
const TOPIC_RESPONSES: Record<string, string> = {
  javascript_variables: `## JavaScript Variables Explained

JavaScript has three ways to declare variables:

### 1. \`var\` (Old way)
\`\`\`javascript
var name = "Nova";
// Function-scoped, can be redeclared
\`\`\`

### 2. \`let\` (Modern, recommended)
\`\`\`javascript
let age = 25;
age = 26; // ✅ Can be reassigned
// Block-scoped, cannot be redeclared
\`\`\`

### 3. \`const\` (For constants)
\`\`\`javascript
const PI = 3.14159;
// PI = 3; ❌ Cannot be reassigned
// Block-scoped
\`\`\`

### Key Differences:
| Feature | var | let | const |
|---------|-----|-----|-------|
| Scope | Function | Block | Block |
| Reassign | ✅ | ✅ | ❌ |
| Redeclare | ✅ | ❌ | ❌ |
| Hoisting | Yes (undefined) | Yes (TDZ) | Yes (TDZ) |

💡 **Best Practice**: Use \`const\` by default, \`let\` when you need to reassign, and avoid \`var\`.

Would you like me to explain any of these in more detail?`,

  react_component: `## Creating a React Component

Here's how to create a React component:

### Function Component (Recommended)
\`\`\`jsx
function Greeting({ name }) {
  return (
    <div className="greeting">
      <h1>Hello, {name}! 👋</h1>
      <p>Welcome to React</p>
    </div>
  );
}

// Usage
<Greeting name="Nova" />
\`\`\`

### Arrow Function Component
\`\`\`jsx
const Card = ({ title, description, children }) => {
  return (
    <div className="card">
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </div>
  );
};
\`\`\`

### Component with State
\`\`\`jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
\`\`\`

### Key Rules:
1. Component names must start with **uppercase**
2. Must return **JSX** (or null)
3. Accept **props** as parameters
4. Use **hooks** for state and side effects

Need more examples or want to learn about props, state, or hooks?`,

  react_hooks: `## React Hooks Explained

Hooks let you use state and other React features in function components.

### 1. useState — State Management
\`\`\`jsx
const [value, setValue] = useState(initialValue);

// Example
const [name, setName] = useState("Nova");
const [items, setItems] = useState([]);
\`\`\`

### 2. useEffect — Side Effects
\`\`\`jsx
useEffect(() => {
  // Runs after render
  fetchData();
  
  return () => {
    // Cleanup function
  };
}, [dependency]); // Only re-run when dependency changes
\`\`\`

### 3. useRef — DOM References
\`\`\`jsx
const inputRef = useRef(null);

// Focus the input
inputRef.current.focus();

return <input ref={inputRef} />;
\`\`\`

### 4. useCallback — Memoize Functions
\`\`\`jsx
const handleClick = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
\`\`\`

### 5. useMemo — Memoize Values
\`\`\`jsx
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);
\`\`\`

💡 **Rules of Hooks:**
- Only call hooks at the **top level**
- Only call hooks inside **React components** or custom hooks
- Hook names always start with **use**

Want me to go deeper into any specific hook?`,

  react_general: `## React Overview

React is a JavaScript library for building user interfaces.

### Core Concepts:
1. **Components** — Reusable UI building blocks
2. **JSX** — HTML-like syntax in JavaScript
3. **Props** — Pass data to child components
4. **State** — Manage dynamic data
5. **Hooks** — Add features to function components

### Quick Example:
\`\`\`jsx
import { useState } from 'react';

function App() {
  const [message, setMessage] = useState("Hello React!");

  return (
    <div>
      <h1>{message}</h1>
      <button onClick={() => setMessage("Updated!")}>
        Click Me
      </button>
    </div>
  );
}
\`\`\`

What specific React topic would you like to learn about? (Components, Hooks, Routing, State Management, etc.)`,

  python: `## Python Programming

Python is a versatile, beginner-friendly programming language.

### Basic Syntax:
\`\`\`python
# Variables
name = "Nova AI"
age = 2025
is_active = True

# Functions
def greet(name):
    return f"Hello, {name}!"

print(greet("User"))  # Hello, User!

# Lists
fruits = ["apple", "banana", "cherry"]
for fruit in fruits:
    print(fruit)

# Dictionary
user = {
    "name": "John",
    "age": 25,
    "skills": ["Python", "JavaScript"]
}
\`\`\`

### Popular Libraries:
- **pandas** — Data analysis
- **numpy** — Numerical computing
- **flask/django** — Web development
- **requests** — HTTP requests

What would you like to learn about Python? (basics, data structures, web development, data science, etc.)`,

  html_css: `## HTML & CSS Fundamentals

### HTML Structure:
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Page</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <h1>Welcome</h1>
    <nav>
      <a href="#about">About</a>
      <a href="#contact">Contact</a>
    </nav>
  </header>
  <main>
    <p>Hello, World!</p>
  </main>
</body>
</html>
\`\`\`

### CSS Flexbox Layout:
\`\`\`css
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.card {
  padding: 1.5rem;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
\`\`\`

### CSS Grid:
\`\`\`css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
\`\`\`

Want to learn more about responsive design, animations, or specific CSS properties?`,

  nextjs: `## Next.js Overview

Next.js is a React framework for building full-stack web apps.

### Key Features:
\`\`\`jsx
// app/page.js — App Router
export default function HomePage() {
  return <h1>Welcome to Next.js!</h1>;
}

// app/about/page.js — Automatic routing
export default function AboutPage() {
  return <h1>About Us</h1>;
}
\`\`\`

### Server Components (Default):
\`\`\`jsx
// This runs on the server
async function ProductList() {
  const products = await fetch('https://api.example.com/products');
  const data = await products.json();
  
  return (
    <ul>
      {data.map(p => <li key={p.id}>{p.name}</li>)}
    </ul>
  );
}
\`\`\`

### Client Components:
\`\`\`jsx
'use client';
import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
\`\`\`

### Core Concepts:
- **File-based routing** — Folders = routes
- **Server/Client Components** — Optimized rendering
- **API Routes** — Backend endpoints
- **SSR/SSG/ISR** — Flexible rendering strategies

What Next.js topic would you like to explore?`,

  java: `## Java Programming

### Basic Example:
\`\`\`java
public class Main {
    public static void main(String[] args) {
        String name = "Nova";
        int age = 2025;
        
        System.out.println("Hello, " + name + "!");
        
        // Array
        int[] numbers = {1, 2, 3, 4, 5};
        for (int n : numbers) {
            System.out.println(n);
        }
    }
}
\`\`\`

### OOP Example:
\`\`\`java
public class User {
    private String name;
    private int age;
    
    public User(String name, int age) {
        this.name = name;
        this.age = age;
    }
    
    public String getName() { return name; }
    public int getAge() { return age; }
}
\`\`\`

Java is strongly typed, object-oriented, and runs on the JVM. What would you like to know more about?`,

  cpp: `## C++ Programming

### Basic Example:
\`\`\`cpp
#include <iostream>
#include <string>
using namespace std;

int main() {
    string name = "Nova";
    int age = 2025;
    
    cout << "Hello, " << name << "!" << endl;
    
    // Pointers
    int x = 10;
    int* ptr = &x;
    cout << "Value: " << *ptr << endl;
    
    return 0;
}
\`\`\`

### Classes:
\`\`\`cpp
class Rectangle {
private:
    double width, height;
public:
    Rectangle(double w, double h) : width(w), height(h) {}
    double area() { return width * height; }
};
\`\`\`

What C++ topic would you like to explore? (pointers, OOP, STL, memory management, etc.)`,

  c_lang: `## C Programming

### Basic Example:
\`\`\`c
#include <stdio.h>

int main() {
    char name[] = "Nova";
    int age = 2025;
    
    printf("Hello, %s!\\n", name);
    printf("Year: %d\\n", age);
    
    // Arrays
    int numbers[] = {1, 2, 3, 4, 5};
    int size = sizeof(numbers) / sizeof(numbers[0]);
    
    for (int i = 0; i < size; i++) {
        printf("%d ", numbers[i]);
    }
    
    return 0;
}
\`\`\`

### Pointers:
\`\`\`c
int x = 10;
int *ptr = &x;
printf("Value: %d, Address: %p\\n", *ptr, ptr);
\`\`\`

C is the foundation of modern programming. What would you like to learn more about?`,

  api: `## APIs Explained

### What is an API?
An API (Application Programming Interface) allows different software systems to communicate.

### REST API Example with Fetch:
\`\`\`javascript
// GET request
const response = await fetch('https://api.example.com/users');
const users = await response.json();

// POST request
const newUser = await fetch('https://api.example.com/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Nova', email: 'nova@ai.com' })
});
\`\`\`

### Building an API with Express:
\`\`\`javascript
const express = require('express');
const app = express();
app.use(express.json());

app.get('/api/users', (req, res) => {
  res.json([{ id: 1, name: 'John' }]);
});

app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  res.status(201).json({ id: 2, name, email });
});

app.listen(3000);
\`\`\`

Want to learn about authentication, error handling, or specific API patterns?`,

  database: `## Database Basics

### SQL Example:
\`\`\`sql
-- Create a table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert data
INSERT INTO users (name, email) VALUES ('Nova', 'nova@ai.com');

-- Query data
SELECT * FROM users WHERE name LIKE '%Nova%';

-- Join tables
SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id;
\`\`\`

### Popular Databases:
- **PostgreSQL** — Powerful relational DB
- **MySQL** — Popular open-source SQL DB
- **MongoDB** — Document-based NoSQL
- **SQLite** — Lightweight embedded DB

What database topic would you like to explore?`,

  git: `## Git & GitHub Guide

### Essential Git Commands:
\`\`\`bash
# Initialize a repository
git init

# Stage changes
git add .
git add filename.js

# Commit
git commit -m "feat: add login feature"

# Create and switch branch
git checkout -b feature/login
git switch -c feature/login

# Push to remote
git push origin main
git push -u origin feature/login

# Pull latest changes
git pull origin main

# Merge branch
git checkout main
git merge feature/login
\`\`\`

### Good Commit Messages:
- \`feat: add user authentication\`
- \`fix: resolve login redirect bug\`
- \`docs: update API documentation\`
- \`refactor: simplify user validation\`

Want to learn about branching strategies, merge conflicts, or GitHub workflows?`,

  debugging: `## Debugging Guide

### JavaScript Debugging:
\`\`\`javascript
// Console methods
console.log("Value:", variable);
console.table(arrayOfObjects);
console.error("Something went wrong!");
console.time("operation");
// ... code
console.timeEnd("operation");

// Debugger statement
function problematicFunction(data) {
  debugger; // Pauses execution here
  return data.map(item => item.value);
}

// Try-catch for error handling
try {
  const result = riskyOperation();
} catch (error) {
  console.error("Error:", error.message);
  console.error("Stack:", error.stack);
}
\`\`\`

### Common Debugging Steps:
1. **Read the error message** carefully
2. **Check the line number** in the stack trace
3. **Add console.log** to track variable values
4. **Use browser DevTools** (F12)
5. **Simplify** — isolate the problem

What error or bug are you facing? I can help you fix it!`,

  algorithm: `## Algorithms & Data Structures

### Common Sorting:
\`\`\`javascript
// Bubble Sort — O(n²)
function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}

// Binary Search — O(log n)
function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}
\`\`\`

### Big O Notation:
- **O(1)** — Constant
- **O(log n)** — Logarithmic
- **O(n)** — Linear
- **O(n log n)** — Efficient sorting
- **O(n²)** — Quadratic

What algorithm topic interests you?`,

  greeting: `Hey there! 👋 I'm **Nova AI**, your intelligent assistant.

I can help you with:
- 💻 **Programming** — JavaScript, Python, React, C++, Java, and more
- 📝 **Writing** — Articles, emails, summaries
- 🔬 **Research** — Deep analysis and insights
- 💡 **Ideas** — Brainstorming and planning
- 🌐 **Translation** — Multiple languages

What would you like to work on today?`,

  who_are_you: `I'm **Nova AI** — a next-generation AI workspace assistant! 🚀

Here's what I can do:
- **Answer questions** on any topic
- **Write and debug code** in multiple languages
- **Help with writing** — essays, emails, content
- **Research topics** with detailed analysis
- **Brainstorm ideas** for projects and business
- **Translate** between languages (English, Bangla, Hindi, Arabic, etc.)
- **Understand Banglish** naturally

I'm designed to be helpful, accurate, and friendly. How can I assist you today?`,

  thanks: `You're welcome! 😊 Happy to help!

Feel free to ask me anything else — whether it's code, writing, research, or just a chat. I'm here for you! 🚀`,

  math: `Let me help with that math problem! 🧮

Here's how I can assist:

### Basic Operations:
\`\`\`
Addition:       5 + 3 = 8
Subtraction:    10 - 4 = 6
Multiplication: 7 × 8 = 56
Division:       20 ÷ 4 = 5
\`\`\`

### Common Formulas:
- **Area of circle**: A = πr²
- **Pythagorean theorem**: a² + b² = c²
- **Quadratic formula**: x = (-b ± √(b²-4ac)) / 2a

Please share the specific math problem you'd like me to solve!`,

  translate: `## Translation Assistant 🌐

I can help translate between multiple languages:
- **English** ↔ **Bangla** (বাংলা)
- **English** ↔ **Hindi** (हिंदी)
- **English** ↔ **Arabic** (العربية)
- **English** ↔ **Spanish** (Español)
- **English** ↔ **French** (Français)
- And more!

Please provide the text you'd like translated and specify the target language.

**Example**: "Translate 'Hello, how are you?' to Bangla"`,

  explain: `I'd be happy to explain! Could you please be more specific about what you'd like me to explain?

I can help with:
- 💻 **Programming concepts** — Variables, functions, OOP, etc.
- 🧮 **Math** — Formulas, theorems, problems
- 🔬 **Science** — Physics, chemistry, biology
- 📚 **General knowledge** — History, geography, technology
- 💼 **Business** — Strategy, marketing, finance

Just tell me the topic and I'll give you a clear, detailed explanation! 📖`,

  write_code: `I'd be happy to write code for you! Please tell me:

1. **What language?** (JavaScript, Python, C++, Java, etc.)
2. **What should the code do?**
3. **Any specific requirements?**

For example:
- "Write a function to sort an array in JavaScript"
- "Create a Python script to read a CSV file"
- "Build a login form in React"

What would you like me to code? 🚀`,

  ai_ml: `## AI & Machine Learning Overview

### What is AI?
Artificial Intelligence is the simulation of human intelligence by machines.

### Types of AI:
1. **Narrow AI** — Specialized (Siri, chess engines)
2. **General AI** — Human-level intelligence (theoretical)
3. **Super AI** — Beyond human intelligence (hypothetical)

### Machine Learning Basics:
\`\`\`python
# Simple ML with scikit-learn
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

# Prepare data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Train model
model = RandomForestClassifier()
model.fit(X_train, y_train)

# Predict
predictions = model.predict(X_test)
accuracy = model.score(X_test, y_test)
\`\`\`

### Key Concepts:
- **Supervised Learning** — Learn from labeled data
- **Unsupervised Learning** — Find patterns in unlabeled data
- **Deep Learning** — Neural networks with many layers
- **NLP** — Understanding human language
- **Computer Vision** — Understanding images

What aspect of AI/ML would you like to explore?`,

  // Bangla responses
  greeting_bn: `হ্যালো! 👋 আমি **Nova AI** — আপনার বুদ্ধিমান সহকারী।

আমি সাহায্য করতে পারি:
- 💻 **প্রোগ্রামিং** — জাভাস্ক্রিপ্ট, পাইথন, রিয়েক্ট ইত্যাদি
- 📝 **লেখালেখি** — আর্টিকেল, ইমেইল, সারাংশ
- 🔬 **গবেষণা** — বিশ্লেষণ এবং তথ্য
- 💡 **আইডিয়া** — ব্রেইনস্টর্মিং
- 🌐 **অনুবাদ** — বিভিন্ন ভাষায়

আজ আপনাকে কীভাবে সাহায্য করতে পারি?`,

  programming_bn: `## প্রোগ্রামিং সহায়তা

আমি বিভিন্ন প্রোগ্রামিং ভাষায় সাহায্য করতে পারি:

- **JavaScript** — ওয়েব ডেভেলপমেন্ট
- **Python** — ডেটা সায়েন্স, ব্যাকএন্ড
- **React** — ইউজার ইন্টারফেস
- **C/C++** — সিস্টেম প্রোগ্রামিং
- **Java** — এন্টারপ্রাইজ অ্যাপ্লিকেশন

কোন বিষয়ে সাহায্য চান? নির্দিষ্ট প্রশ্ন করলে আরো ভালো উত্তর দিতে পারব! 🚀`,

  explain_bn: `আমি ব্যাখ্যা করতে রাজি! 📖

অনুগ্রহ করে বলুন কী বিষয়ে জানতে চান:
- 💻 **প্রোগ্রামিং** — ভ্যারিয়েবল, ফাংশন, ক্লাস
- 🧮 **গণিত** — সূত্র, সমীকরণ
- 🔬 **বিজ্ঞান** — পদার্থবিদ্যা, রসায়ন
- 📚 **সাধারণ জ্ঞান**

আপনার প্রশ্ন করুন, আমি সহজ ভাষায় বুঝিয়ে দেব!`,

  // Banglish responses
  greeting_banglish: `Hey! 👋 Ami Nova AI — tomar intelligent assistant!

Ami help korte pari:
- 💻 **Programming** — JavaScript, Python, React
- 📝 **Writing** — Article, email, content
- 🔬 **Research** — Analysis and insights
- 💡 **Ideas** — Brainstorming
- 🌐 **Translation** — Multiple languages

Ki niye help chai? Bolo! 🚀`,

  explain_banglish: `Haan, ami explain korte pari! 📖

Ki bishoy e janthe chao bolo:
- 💻 **Programming concepts** — Variable, function, loop
- 🧮 **Math** — Formula, equation
- 📚 **General topics**

Specific question kor, ami clear vabe bujhiye dibo!`,

  code_banglish: `Code likhte chai? Besh! 🚀

Amake bolo:
1. **Kon language?** (JavaScript, Python, C++, etc.)
2. **Code ta ki korbe?**
3. **Kono specific requirement ache?**

Example:
- "JavaScript e array sort er function likh"
- "Python e file read korar code likh"
- "React e login form banao"

Ki code likhbo bolo! 💻`,
};

// Fallback for general questions
const GENERAL_FALLBACK = `That's a great question! Let me think about this...

While I'm currently running in demo mode with pre-built responses, I can still help with:

- **Programming** — Ask about JavaScript, Python, React, C++, Java, HTML/CSS
- **Concepts** — I can explain technical topics clearly
- **Code examples** — I'll provide working code snippets

Try asking something specific like:
- "Explain JavaScript variables"
- "How to create a React component?"
- "Write a Python function to sort a list"

💡 *For fully intelligent responses to any question, enable Lovable Cloud to connect real AI!*`;

const UNCLEAR_RESPONSE = `I want to make sure I give you the best answer! 🤔

Could you clarify your question a bit? For example:
- What specific topic are you asking about?
- Are you looking for an explanation, code example, or comparison?
- Which programming language are you working with?

The more specific your question, the better I can help! 💡`;

/**
 * Detects the topic from user input
 */
function detectTopic(input: string, isBanglish: boolean): string | null {
  const normalized = input.trim().toLowerCase();
  
  // Check Banglish patterns first if detected as Banglish
  if (isBanglish) {
    for (const { topic, patterns } of BANGLISH_TOPIC_PATTERNS) {
      if (patterns.some(p => p.test(normalized))) return topic;
    }
  }

  // Check Bangla patterns
  for (const { topic, patterns } of BANGLA_TOPIC_PATTERNS) {
    if (patterns.some(p => p.test(input))) return topic;
  }

  // Check English patterns
  for (const { topic, patterns } of TOPIC_PATTERNS) {
    if (patterns.some(p => p.test(normalized))) return topic;
  }

  return null;
}

/**
 * Generates a contextual response based on user input and conversation history
 */
export function generateSmartResponse(context: ResponseContext): string {
  const { userMessage, conversationHistory, activeMode, language, isBanglish, hasImages, hasFiles } = context;

  // Image analysis
  if (hasImages) {
    return TOPIC_RESPONSES["image_analysis"] || `🖼️ **Image Analysis**\n\nI can see the image you've uploaded! Here's what I observe:\n\n- **Content**: The image contains visual elements that could be analyzed\n- **Quality**: The image appears clear\n- **Context**: Based on the visual elements\n\nWould you like me to:\n1. Describe it in more detail?\n2. Analyze specific aspects?\n3. Extract any text from it?`;
  }

  // File analysis
  if (hasFiles) {
    return `📄 **Document Received**\n\nI've received your file(s). Here's what I can help with:\n\n1. **Summarize** — Get key points\n2. **Analyze** — Deep dive into content\n3. **Extract** — Pull specific information\n4. **Q&A** — Ask questions about the document\n\nWhat would you like me to do with the document?`;
  }

  // Mode-specific responses (only for specialized modes with no specific topic detected)
  const modeSpecificResponses: Record<string, string> = {
    slides: `📊 **Slide Deck Generated!**\n\nHere's your presentation outline:\n\n## Slide 1: Title\n**Your Topic** — A compelling subtitle\n\n## Slide 2: Overview\n- Key point 1\n- Key point 2\n- Key point 3\n\n## Slide 3: Deep Dive\nDetailed analysis with data visualizations\n\n## Slide 4: Conclusion\nKey takeaways and next steps\n\n---\n*💡 Tip: You can ask me to expand any slide or change the style.*`,
    ideas: `💡 **Brainstorm Results**\n\nHere are some innovative ideas:\n\n### 🚀 Concept 1: AI-Powered Solution\nLeverage machine learning to automate the process\n\n### 🎯 Concept 2: Community-Driven\nBuild a platform where users contribute and benefit\n\n### 💎 Concept 3: Premium Experience\nCreate a high-value offering with exclusive features\n\n### 📈 Concept 4: Data-First Approach\nUse analytics to drive decisions\n\n*Which idea interests you most?*`,
    content: `📝 **Content Generated!**\n\n# Your Article Title\n\n## Introduction\nCapture attention with a compelling hook...\n\n## Main Points\n\n### 1. The Current Landscape\nAnalysis of where things stand today.\n\n### 2. Key Trends\nWhat's changing and why it matters.\n\n### 3. Actionable Steps\nConcrete things readers can do right now.\n\n## Conclusion\nWrap up with a strong call to action.\n\n---\n*Want me to expand any section or adjust the tone?*`,
  };

  if (modeSpecificResponses[activeMode] && !detectTopic(userMessage, isBanglish)) {
    return modeSpecificResponses[activeMode];
  }

  // Very short/unclear messages
  if (userMessage.trim().length < 3) {
    return UNCLEAR_RESPONSE;
  }

  // Detect topic from user message
  const topic = detectTopic(userMessage, isBanglish);

  if (topic && TOPIC_RESPONSES[topic]) {
    return TOPIC_RESPONSES[topic];
  }

  // Check conversation context for follow-up
  if (conversationHistory.length > 0) {
    const lastAiMsg = [...conversationHistory].reverse().find(m => m.role === "ai");
    const lastUserMsg = [...conversationHistory].reverse().find(m => m.role === "user");
    
    if (lastAiMsg && lastUserMsg) {
      // Detect if this is a follow-up question
      const followUpPatterns = [/^(yes|yeah|yep|sure|ok|okay|please|haan|ji|ha)\b/i, /^(tell me more|more detail|explain more|go on|continue)/i, /^(what about|how about|and|also)\b/i];
      
      if (followUpPatterns.some(p => p.test(userMessage.trim()))) {
        // Try to detect the original topic from the last exchange
        const prevTopic = detectTopic(lastUserMsg.content, isBanglish);
        if (prevTopic) {
          return `Great question! Let me expand on that...\n\nBuilding on what we discussed about **${lastUserMsg.content.slice(0, 50)}**:\n\n### Additional Details\n\nHere are more important aspects to consider:\n\n1. **Advanced concepts** — Going deeper into the topic\n2. **Best practices** — Industry-recommended approaches\n3. **Common mistakes** — What to avoid\n4. **Resources** — Where to learn more\n\nWould you like me to focus on any specific area?`;
        }
      }
    }
  }

  // Language-specific fallbacks
  if (isBanglish) {
    return `Hmm, ami tomar question ta bujhte perechi! 🤔\n\nAmi tomar jonne help korte chai. Ektu specific vabe bolo:\n- Ki topic niye janthe chao?\n- Kono code example lagbe?\n- Kono concept explain korte hobe?\n\nSpecific question korle ami better answer dite parbo! 💡`;
  }

  if (language === "bn") {
    return `আমি আপনার প্রশ্নটি বুঝতে পেরেছি! 🤔\n\nআরও ভালো উত্তর দেওয়ার জন্য, অনুগ্রহ করে নির্দিষ্ট করে বলুন:\n- কোন বিষয়ে জানতে চান?\n- কোড উদাহরণ দরকার?\n- কোনো ধারণা ব্যাখ্যা করতে হবে?\n\nআমি সাহায্য করতে প্রস্তুত! 💡`;
  }

  if (language === "hi") {
    return `मैंने आपका सवाल समझ लिया! 🤔\n\nबेहतर जवाब देने के लिए, कृपया बताएं:\n- किस विषय में जानना चाहते हैं?\n- कोड उदाहरण चाहिए?\n- कोई अवधारणा समझानी है?\n\nमैं मदद करने को तैयार हूं! 💡`;
  }

  if (language === "ar") {
    return `فهمت سؤالك! 🤔\n\nللحصول على إجابة أفضل، يرجى توضيح:\n- ما الموضوع الذي تريد معرفته؟\n- هل تحتاج إلى أمثلة كود؟\n- هل تريد شرح مفهوم معين؟\n\nأنا جاهز للمساعدة! 💡`;
  }

  if (language === "es") {
    return `¡Entendí tu pregunta! 🤔\n\nPara darte una mejor respuesta, por favor especifica:\n- ¿Sobre qué tema quieres saber?\n- ¿Necesitas ejemplos de código?\n- ¿Quieres que explique algún concepto?\n\n¡Estoy listo para ayudar! 💡`;
  }

  // Generic intelligent fallback
  return GENERAL_FALLBACK;
}
