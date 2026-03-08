import { Message } from "./chatData";

export interface ResponseContext {
  userMessage: string;
  conversationHistory: Message[];
  activeMode: string;
  language: string;
  isBanglish: boolean;
  hasImages: boolean;
  hasFiles: boolean;
}

// ── Keyword extraction ──────────────────────────────────────────────
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "the","a","an","is","are","was","were","be","been","being","have","has","had",
    "do","does","did","will","would","shall","should","may","might","must","can","could",
    "i","me","my","we","our","you","your","he","she","it","they","them","their",
    "this","that","these","those","what","which","who","whom","how","when","where","why",
    "in","on","at","to","for","of","with","by","from","about","into","through",
    "and","or","but","not","no","if","so","very","just","also","some","any","all",
    "please","help","want","need","know","tell","give","make","use","like","get",
    "explain","show","create","write","build","learn","understand","work","thing",
  ]);
  return text.toLowerCase().replace(/[^\w\s+#.]/g, " ").split(/\s+/)
    .filter(w => w.length > 1 && !stopWords.has(w));
}

// ── Language / tech detection ───────────────────────────────────────
interface TechMatch { tech: string; category: "language" | "framework" | "tool" | "concept"; confidence: number; }

const TECH_MAP: Record<string, { aliases: RegExp; category: TechMatch["category"] }> = {
  "JavaScript":   { aliases: /\b(javascript|js|ecmascript|es6|es2015)\b/i, category: "language" },
  "TypeScript":   { aliases: /\b(typescript|ts)\b/i, category: "language" },
  "Python":       { aliases: /\b(python|py|pip|pandas|numpy|django|flask|fastapi)\b/i, category: "language" },
  "Java":         { aliases: /\bjava\b(?!script)/i, category: "language" },
  "C":            { aliases: /\b(c\s+language|c\s+programming|printf|scanf|malloc|stdio)\b/i, category: "language" },
  "C++":          { aliases: /\b(c\+\+|cpp|stl|iostream)\b/i, category: "language" },
  "C#":           { aliases: /\b(c#|csharp|c\s*sharp|\.net|dotnet)\b/i, category: "language" },
  "PHP":          { aliases: /\b(php|laravel|symfony)\b/i, category: "language" },
  "Go":           { aliases: /\b(golang|go\s+lang)\b/i, category: "language" },
  "Rust":         { aliases: /\b(rust|cargo|rustc)\b/i, category: "language" },
  "Swift":        { aliases: /\b(swift|swiftui|ios\s+dev)\b/i, category: "language" },
  "Kotlin":       { aliases: /\b(kotlin|android\s+dev)\b/i, category: "language" },
  "Ruby":         { aliases: /\b(ruby|rails|ruby\s+on\s+rails)\b/i, category: "language" },
  "SQL":          { aliases: /\b(sql|mysql|postgres|postgresql|sqlite|query|database)\b/i, category: "language" },
  "HTML":         { aliases: /\b(html|html5|markup|dom)\b/i, category: "language" },
  "CSS":          { aliases: /\b(css|css3|flexbox|grid\s+layout|stylesheet|scss|sass|less)\b/i, category: "language" },
  "React":        { aliases: /\b(react|react\.js|reactjs|jsx|tsx|hooks?|usestate|useeffect|useref|usememo|usecallback|usecontext|redux)\b/i, category: "framework" },
  "Next.js":      { aliases: /\b(next\.?js|nextjs|server\s+component|app\s+router|page\s+router|getserversideprops|getstaticprops)\b/i, category: "framework" },
  "Node.js":      { aliases: /\b(node\.?js|nodejs|npm|yarn|bun|express|koa|nest\.?js)\b/i, category: "framework" },
  "Express.js":   { aliases: /\b(express\.?js|expressjs|middleware|router)\b/i, category: "framework" },
  "Tailwind CSS": { aliases: /\b(tailwind|tailwindcss)\b/i, category: "framework" },
  "Bootstrap":    { aliases: /\b(bootstrap)\b/i, category: "framework" },
  "MongoDB":      { aliases: /\b(mongodb|mongo|mongoose)\b/i, category: "tool" },
  "MySQL":        { aliases: /\b(mysql)\b/i, category: "tool" },
  "Firebase":     { aliases: /\b(firebase|firestore)\b/i, category: "tool" },
  "Supabase":     { aliases: /\b(supabase)\b/i, category: "tool" },
  "Git":          { aliases: /\b(git|github|gitlab|bitbucket|commit|branch|merge|pull\s+request|clone|push)\b/i, category: "tool" },
  "Docker":       { aliases: /\b(docker|container|dockerfile|docker-compose)\b/i, category: "tool" },
  "API":          { aliases: /\b(api|rest\s*api|graphql|endpoint|fetch|axios|http\s+request)\b/i, category: "concept" },
  "OOP":          { aliases: /\b(oop|object.oriented|class|inheritance|polymorphism|encapsulation|abstraction)\b/i, category: "concept" },
  "Algorithm":    { aliases: /\b(algorithm|data\s+structure|sort|search|big\s+o|recursion|binary\s+tree|linked\s+list|stack|queue|hash\s+map|graph)\b/i, category: "concept" },
  "AI/ML":        { aliases: /\b(machine\s+learning|deep\s+learning|neural\s+network|tensorflow|pytorch|nlp|computer\s+vision|artificial\s+intelligence)\b/i, category: "concept" },
};

function detectTech(text: string): TechMatch[] {
  const matches: TechMatch[] = [];
  for (const [tech, { aliases, category }] of Object.entries(TECH_MAP)) {
    if (aliases.test(text)) matches.push({ tech, category, confidence: 0.9 });
  }
  return matches;
}

// ── Intent detection ────────────────────────────────────────────────
type Intent =
  | "greeting" | "who_are_you" | "thanks" | "farewell"
  | "explain" | "write_code" | "debug" | "compare" | "convert"
  | "how_to" | "what_is" | "difference" | "example" | "best_practice"
  | "simplify" | "step_by_step" | "list" | "translate"
  | "general_question" | "unclear";

const INTENT_PATTERNS: { intent: Intent; patterns: RegExp[] }[] = [
  { intent: "greeting", patterns: [/^(hi|hello|hey|howdy|sup|yo|greetings|good\s*(morning|afternoon|evening|night)|assalamu|salam|namaste)\b/i] },
  { intent: "who_are_you", patterns: [/who\s*(are|r)\s*you/i, /what\s*(are|r)\s*you/i, /your\s*name/i, /tumi\s*ke/i, /apni\s*ke/i, /introduce\s*yourself/i] },
  { intent: "thanks", patterns: [/^(thanks|thank\s*you|thx|ty|dhonnobad|dhanyabad|shukriya)/i] },
  { intent: "farewell", patterns: [/^(bye|goodbye|see\s*you|later|take\s*care)/i] },
  { intent: "explain", patterns: [/\bexplain\b/i, /\bdescribe\b/i, /\belaborate\b/i, /\bwhat\s+(?:is|are|does|do)\b/i, /\bdefin(?:e|ition)\b/i, /\bmean(?:s|ing)?\b/i] },
  { intent: "write_code", patterns: [/\bwrite\b.*\b(code|function|program|script|class|method)\b/i, /\b(code|function|program|script)\b.*\bwrite\b/i, /\bcreate\b.*\b(function|class|component|app|project)\b/i, /\bgenerate\b.*\b(code|function)\b/i, /\bimplement\b/i] },
  { intent: "debug", patterns: [/\bdebug\b/i, /\bfix\b.*\b(error|bug|issue|problem|code)\b/i, /\b(error|bug|issue)\b.*\bfix\b/i, /\bnot\s+work/i, /\bbroken\b/i, /\bcrash/i, /\bwhy\b.*\b(error|fail|wrong)\b/i, /\bhelp\b.*\b(error|fix)\b/i] },
  { intent: "compare", patterns: [/\bcompare\b/i, /\bvs\.?\b/i, /\bversus\b/i, /\bdifference\s+between\b/i, /\bwhich\s+is\s+better\b/i, /\bpros\s+and\s+cons\b/i] },
  { intent: "convert", patterns: [/\bconvert\b/i, /\btranslate\b.*\bcode\b/i, /\bcode\b.*\btranslat/i, /\bmigrat/i, /\brewrite\b.*\bin\b/i, /\bport\b.*\bto\b/i] },
  { intent: "how_to", patterns: [/\bhow\s+(to|do|can|should)\b/i, /\bway\s+to\b/i, /\bsteps?\s+to\b/i, /\bguide\b/i, /\btutorial\b/i] },
  { intent: "what_is", patterns: [/\bwhat\s+(is|are)\b/i, /\bwhat'?s\b/i] },
  { intent: "difference", patterns: [/\bdifference\b/i, /\bdiffer\b/i, /\bcompare\b/i] },
  { intent: "example", patterns: [/\bexample\b/i, /\bsample\b/i, /\bdemo\b/i, /\bshow\s+me\b/i] },
  { intent: "best_practice", patterns: [/\bbest\s+practic/i, /\brecommend/i, /\bshould\s+i\b/i, /\btips?\b/i, /\badvice\b/i] },
  { intent: "simplify", patterns: [/\bsimpl/i, /\beasy\b/i, /\bbeginner/i, /\bbasic/i, /\beli5\b/i, /\bin\s+simple/i] },
  { intent: "step_by_step", patterns: [/\bstep\s*by\s*step\b/i, /\bstep\s*wise\b/i, /\bwalkthrough\b/i] },
  { intent: "list", patterns: [/\blist\b/i, /\btop\s+\d+\b/i, /\bfeatures?\s+of\b/i, /\btypes?\s+of\b/i, /\badvantages?\b/i] },
  { intent: "translate", patterns: [/\btranslat/i, /\benglis(h|e)\b.*\bbangla/i, /\bbangla\b.*\benglis(h|e)/i] },
];

function detectIntent(text: string): Intent {
  const normalized = text.trim();
  for (const { intent, patterns } of INTENT_PATTERNS) {
    if (patterns.some(p => p.test(normalized))) return intent;
  }
  return normalized.length < 3 ? "unclear" : "general_question";
}

// ── Banglish intent detection ───────────────────────────────────────
function detectBanglishIntent(text: string): Intent | null {
  const t = text.toLowerCase();
  if (/^(kemon\s*ach|ki\s*koro|ki\s*holo|ki\s*khabar|kemon\s*asi|hello|hi)/i.test(t)) return "greeting";
  if (/\b(tumi\s*ke|apni\s*ke|ki\s*nam)\b/i.test(t)) return "who_are_you";
  if (/\b(bujhi?ye|explain|bujhao|bujai)\b/i.test(t)) return "explain";
  if (/\b(code\s*likh|program\s*likh|banao|bana)\b/i.test(t)) return "write_code";
  if (/\b(error|fix|kaj\s*kor(e|che)\s*na|problem|somossa)\b/i.test(t)) return "debug";
  if (/\b(ki\s*vabe|kivabe|kemne|kemone|kore|korbo)\b/i.test(t)) return "how_to";
  if (/\b(ki|kita|eta\s*ki)\b/i.test(t)) return "what_is";
  if (/\b(dhonnobad|thanks)\b/i.test(t)) return "thanks";
  if (/\b(example|udahoron)\b/i.test(t)) return "example";
  return null;
}

// ── Bangla intent detection ─────────────────────────────────────────
function detectBanglaIntent(text: string): Intent | null {
  if (/^(আসসালামু|হ্যালো|হাই|নমস্কার|কেমন\s*আছ)/.test(text)) return "greeting";
  if (/\b(তুমি\s*কে|আপনি\s*কে|নাম\s*কি)\b/.test(text)) return "who_are_you";
  if (/\b(ব্যাখ্যা|বুঝিয়ে|বলো|বলুন|শেখাও)\b/.test(text)) return "explain";
  if (/\b(কোড\s*লিখ|প্রোগ্রাম\s*লিখ|তৈরি\s*কর)\b/.test(text)) return "write_code";
  if (/\b(এরর|সমস্যা|কাজ\s*করছে?\s*না|ভুল)\b/.test(text)) return "debug";
  if (/\b(কিভাবে|কেমনে|কীভাবে)\b/.test(text)) return "how_to";
  if (/\b(কী|কি\b|এটা\s*কি)\b/.test(text)) return "what_is";
  if (/\b(ধন্যবাদ|শুকরিয়া)\b/.test(text)) return "thanks";
  return null;
}

// ── Subject extraction (what is the question actually about?) ───────
function extractSubject(text: string): string {
  // Remove question starters to isolate the actual subject
  let subject = text
    .replace(/^(please\s+|can\s+you\s+|could\s+you\s+|i\s+want\s+to\s+|i\s+need\s+to\s+|help\s+me\s+)/i, "")
    .replace(/^(explain|describe|define|what\s+is|what\s+are|what's|how\s+to|how\s+do\s+i|how\s+can\s+i|tell\s+me\s+about|show\s+me|give\s+me|write|create|build|make|generate|implement)\s+/i, "")
    .replace(/\?+$/, "")
    .trim();
  return subject || text;
}

// ── Dynamic response builder ────────────────────────────────────────

function buildExplanation(subject: string, techs: TechMatch[]): string {
  const tech = techs[0]?.tech;
  const subjectLower = subject.toLowerCase();

  // Specific concept explanations with code
  const conceptResponses = buildConceptResponse(subjectLower, tech);
  if (conceptResponses) return conceptResponses;

  // Tech-specific general explanations
  if (tech) return buildTechOverview(tech, subjectLower);

  // General explanation
  return `## ${capitalize(subject)}\n\n${generateGeneralExplanation(subject)}`;
}

function buildConceptResponse(subject: string, tech?: string): string | null {
  // Variables
  if (/\bvariable/i.test(subject)) {
    const lang = tech || detectLangFromSubject(subject) || "JavaScript";
    return generateVariableExplanation(lang);
  }
  // Functions
  if (/\b(function|method)\b/i.test(subject)) {
    const lang = tech || detectLangFromSubject(subject) || "JavaScript";
    return generateFunctionExplanation(lang);
  }
  // Loops
  if (/\b(loop|for\s+loop|while\s+loop|iteration)\b/i.test(subject)) {
    const lang = tech || detectLangFromSubject(subject) || "JavaScript";
    return generateLoopExplanation(lang);
  }
  // Arrays / Lists
  if (/\b(array|list)\b/i.test(subject)) {
    const lang = tech || detectLangFromSubject(subject) || "JavaScript";
    return generateArrayExplanation(lang);
  }
  // Classes / OOP
  if (/\b(class|object|oop|inheritance|constructor)\b/i.test(subject)) {
    const lang = tech || detectLangFromSubject(subject) || "JavaScript";
    return generateClassExplanation(lang);
  }
  // Components (React)
  if (/\bcomponent/i.test(subject)) {
    return generateComponentExplanation();
  }
  // Hooks (React)
  if (/\bhook/i.test(subject) || /\b(usestate|useeffect|useref|usememo)\b/i.test(subject)) {
    return generateHooksExplanation(subject);
  }
  // Async/Promises
  if (/\b(async|await|promise|callback)\b/i.test(subject)) {
    return generateAsyncExplanation(tech || "JavaScript");
  }
  // Closures
  if (/\bclosure/i.test(subject)) {
    return generateClosureExplanation();
  }
  // Event handling
  if (/\bevent/i.test(subject)) {
    return generateEventExplanation(tech);
  }
  // Error handling
  if (/\b(error\s+handl|try\s*catch|exception)\b/i.test(subject)) {
    return generateErrorHandlingExplanation(tech || "JavaScript");
  }
  // Routing
  if (/\brout/i.test(subject)) {
    if (tech === "Next.js") return generateNextRoutingExplanation();
    if (tech === "React" || !tech) return generateReactRoutingExplanation();
    return generateExpressRoutingExplanation();
  }
  // State management
  if (/\bstate\s*(management)?/i.test(subject)) {
    return generateStateManagementExplanation();
  }
  // API / fetch
  if (/\b(api|fetch|http|request|endpoint)\b/i.test(subject)) {
    return generateAPIExplanation(tech);
  }
  // Database
  if (/\b(database|db|table|schema|query)\b/i.test(subject)) {
    return generateDatabaseExplanation(tech);
  }
  // Git
  if (/\b(git|github|commit|branch|merge|pull\s*request)\b/i.test(subject)) {
    return generateGitExplanation(subject);
  }
  // Deployment
  if (/\b(deploy|hosting|server|production)\b/i.test(subject)) {
    return generateDeploymentExplanation(tech);
  }
  // Responsive / media queries
  if (/\b(responsive|media\s+quer|mobile\s+first|breakpoint)\b/i.test(subject)) {
    return generateResponsiveExplanation();
  }
  // Flexbox / Grid
  if (/\b(flexbox|flex|css\s+grid)\b/i.test(subject)) {
    return generateLayoutExplanation(subject);
  }
  // Authentication
  if (/\b(auth|login|signup|sign\s*up|sign\s*in|password|jwt|token|session)\b/i.test(subject)) {
    return generateAuthExplanation(tech);
  }
  // Testing
  if (/\b(test|testing|unit\s+test|jest|vitest|cypress)\b/i.test(subject)) {
    return generateTestingExplanation(tech);
  }
  // Algorithms
  if (/\b(algorithm|sort|search|big\s*o|recursion|binary|linked\s*list|stack|queue|tree|graph)\b/i.test(subject)) {
    return generateAlgorithmExplanation(subject);
  }
  return null;
}

function detectLangFromSubject(subject: string): string | null {
  for (const [tech, { aliases, category }] of Object.entries(TECH_MAP)) {
    if (category === "language" && aliases.test(subject)) return tech;
  }
  return null;
}

// ── Code generation per language ────────────────────────────────────

function generateVariableExplanation(lang: string): string {
  const examples: Record<string, string> = {
    "JavaScript": `## JavaScript Variables\n\nJavaScript has three ways to declare variables:\n\n### \`var\` (old way — avoid)\n\`\`\`javascript\nvar name = "Nova";\n// Function-scoped, can be redeclared — confusing behavior\n\`\`\`\n\n### \`let\` (for values that change)\n\`\`\`javascript\nlet count = 0;\ncount = 1; // ✅ Can reassign\n// Block-scoped\n\`\`\`\n\n### \`const\` (for values that don't change)\n\`\`\`javascript\nconst PI = 3.14159;\n// PI = 3; ❌ Error — cannot reassign\n\`\`\`\n\n| Feature | var | let | const |\n|---------|-----|-----|-------|\n| Scope | Function | Block | Block |\n| Reassign | ✅ | ✅ | ❌ |\n| Redeclare | ✅ | ❌ | ❌ |\n\n💡 **Best practice**: Use \`const\` by default, \`let\` when reassignment is needed, avoid \`var\`.\n\nWant me to explain scope or hoisting in more detail?`,
    "TypeScript": `## TypeScript Variables\n\nTypeScript adds type safety to JavaScript variables:\n\n\`\`\`typescript\n// Explicit types\nlet name: string = "Nova";\nlet age: number = 25;\nlet isActive: boolean = true;\n\n// Type inference (TypeScript figures it out)\nconst greeting = "Hello"; // inferred as string\n\n// Arrays\nlet numbers: number[] = [1, 2, 3];\nlet names: Array<string> = ["Alice", "Bob"];\n\n// Objects\ninterface User {\n  name: string;\n  age: number;\n  email?: string; // optional\n}\n\nconst user: User = { name: "Nova", age: 1 };\n\`\`\`\n\n💡 TypeScript catches type errors at compile time, making your code safer.\n\nWant to learn about interfaces, generics, or union types?`,
    "Python": `## Python Variables\n\nPython variables are simple — no type declarations needed:\n\n\`\`\`python\n# Strings\nname = "Nova"\n\n# Numbers\nage = 25\nprice = 19.99\n\n# Boolean\nis_active = True\n\n# Lists\nfruits = ["apple", "banana", "cherry"]\n\n# Dictionary\nuser = {\n    "name": "Nova",\n    "age": 25\n}\n\n# Multiple assignment\nx, y, z = 1, 2, 3\n\n# Type hints (optional)\ndef greet(name: str) -> str:\n    return f"Hello, {name}!"\n\`\`\`\n\n💡 Python is dynamically typed — variable types are determined at runtime.\n\nWant to learn about data types, type hints, or scope?`,
    "Java": `## Java Variables\n\nJava is statically typed — you must declare the type:\n\n\`\`\`java\n// Primitive types\nint age = 25;\ndouble price = 19.99;\nboolean isActive = true;\nchar grade = 'A';\n\n// Reference types\nString name = "Nova";\nint[] numbers = {1, 2, 3, 4, 5};\n\n// Constants\nfinal double PI = 3.14159;\n\n// var (Java 10+ type inference)\nvar message = "Hello"; // inferred as String\n\`\`\`\n\n| Type | Size | Example |\n|------|------|---------|\n| int | 4 bytes | 42 |\n| double | 8 bytes | 3.14 |\n| boolean | 1 bit | true |\n| String | varies | "Hello" |\n\nWant to learn about objects, arrays, or collections?`,
    "C": `## C Variables\n\nC requires explicit type declaration:\n\n\`\`\`c\n#include <stdio.h>\n\nint main() {\n    // Integer types\n    int age = 25;\n    long bigNumber = 1000000L;\n    \n    // Floating point\n    float price = 19.99f;\n    double precise = 3.14159265;\n    \n    // Characters and strings\n    char grade = 'A';\n    char name[] = "Nova";\n    \n    // Constants\n    const int MAX = 100;\n    \n    printf("Name: %s, Age: %d\\n", name, age);\n    return 0;\n}\n\`\`\`\n\nWant to learn about pointers, arrays, or memory management?`,
    "C++": `## C++ Variables\n\n\`\`\`cpp\n#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    // Basic types\n    int age = 25;\n    double price = 19.99;\n    bool isActive = true;\n    string name = "Nova";\n    \n    // auto (type inference)\n    auto count = 42;      // int\n    auto pi = 3.14;       // double\n    \n    // Constants\n    const int MAX = 100;\n    constexpr int SIZE = 50; // compile-time constant\n    \n    // References\n    int& ref = age; // ref is an alias for age\n    \n    cout << name << " is " << age << endl;\n    return 0;\n}\n\`\`\`\n\nWant to learn about pointers, references, or OOP?`,
    "C#": `## C# Variables\n\n\`\`\`csharp\nusing System;\n\nclass Program {\n    static void Main() {\n        // Value types\n        int age = 25;\n        double price = 19.99;\n        bool isActive = true;\n        char grade = 'A';\n        \n        // Reference types\n        string name = "Nova";\n        int[] numbers = {1, 2, 3};\n        \n        // var (type inference)\n        var message = "Hello";\n        \n        // Constants\n        const double PI = 3.14159;\n        \n        Console.WriteLine($"{name} is {age} years old");\n    }\n}\n\`\`\`\n\nWant to learn about properties, objects, or LINQ?`,
    "PHP": `## PHP Variables\n\nPHP variables start with \`$\`:\n\n\`\`\`php\n<?php\n$name = "Nova";\n$age = 25;\n$price = 19.99;\n$isActive = true;\n\n// Arrays\n$fruits = ["apple", "banana", "cherry"];\n$user = [\n    "name" => "Nova",\n    "age" => 25\n];\n\n// Constants\ndefine("MAX", 100);\nconst PI = 3.14159;\n\necho "Hello, $name! You are $age years old.";\n?>\n\`\`\`\n\nWant to learn about arrays, functions, or OOP in PHP?`,
    "Go": `## Go Variables\n\n\`\`\`go\npackage main\nimport "fmt"\n\nfunc main() {\n    // Explicit declaration\n    var name string = "Nova"\n    var age int = 25\n    \n    // Short declaration (most common)\n    price := 19.99\n    isActive := true\n    \n    // Constants\n    const PI = 3.14159\n    \n    // Multiple\n    var (\n        x int = 1\n        y int = 2\n    )\n    \n    fmt.Printf("%s is %d years old\\n", name, age)\n}\n\`\`\`\n\nWant to learn about structs, slices, or goroutines?`,
    "Rust": `## Rust Variables\n\nRust variables are immutable by default:\n\n\`\`\`rust\nfn main() {\n    // Immutable (default)\n    let name = "Nova";\n    \n    // Mutable\n    let mut count = 0;\n    count += 1; // ✅ OK because mut\n    \n    // Type annotation\n    let age: u32 = 25;\n    let price: f64 = 19.99;\n    \n    // Constants\n    const MAX: u32 = 100;\n    \n    // Shadowing (re-declare)\n    let x = 5;\n    let x = x + 1; // ✅ Shadowing is OK\n    \n    println!("{} is {} years old", name, age);\n}\n\`\`\`\n\nWant to learn about ownership, borrowing, or lifetimes?`,
    "Swift": `## Swift Variables\n\n\`\`\`swift\n// Variables (mutable)\nvar name = "Nova"\nvar age = 25\n\n// Constants (immutable)\nlet pi = 3.14159\nlet maxSize: Int = 100\n\n// Type annotation\nvar price: Double = 19.99\nvar isActive: Bool = true\n\n// Optional\nvar email: String? = nil\nemail = "nova@ai.com"\n\n// String interpolation\nprint("\\(name) is \\(age) years old")\n\`\`\`\n\nWant to learn about optionals, structs, or closures?`,
    "Kotlin": `## Kotlin Variables\n\n\`\`\`kotlin\nfun main() {\n    // Mutable\n    var name = "Nova"\n    var age = 25\n    \n    // Immutable (recommended)\n    val pi = 3.14159\n    val maxSize: Int = 100\n    \n    // Nullable\n    var email: String? = null\n    email = "nova@ai.com"\n    \n    // String template\n    println("$name is $age years old")\n    "Kotlin": `## Kotlin Variables\n\n\`\`\`kotlin\nfun main() {\n    // Mutable\n    var name = "Nova"\n    var age = 25\n    \n    // Immutable (recommended)\n    val pi = 3.14159\n    val maxSize: Int = 100\n    \n    // Nullable\n    var email: String? = null\n    email = "nova@ai.com"\n    \n    // String template\n    println("$name is $age years old")\n    println("Length: ` + "${name.length}" + `")\n}\n\`\`\`\n\nWant to learn about null safety, data classes, or coroutines?`,\n}\n\`\`\`\n\nWant to learn about null safety, data classes, or coroutines?`,
    "Ruby": `## Ruby Variables\n\n\`\`\`ruby\n# Local variables\nname = "Nova"\nage = 25\nprice = 19.99\n\n# Constants\nMAX = 100\nPI = 3.14159\n\n# Instance variables\n@name = "Nova"\n\n# Class variables\n@@count = 0\n\n# Global variables\n$debug = false\n\n# String interpolation\nputs "#{name} is #{age} years old"\n\`\`\`\n\nWant to learn about symbols, hashes, or classes?`,
  };
  return examples[lang] || examples["JavaScript"]!;
}

function generateFunctionExplanation(lang: string): string {
  const examples: Record<string, string> = {
    "JavaScript": `## JavaScript Functions\n\n### Function Declaration\n\`\`\`javascript\nfunction greet(name) {\n  return \`Hello, \${name}!\`;\n}\nconsole.log(greet("Nova")); // Hello, Nova!\n\`\`\`\n\n### Arrow Function\n\`\`\`javascript\nconst add = (a, b) => a + b;\nconst square = x => x * x;\n\nconsole.log(add(2, 3));   // 5\nconsole.log(square(4));    // 16\n\`\`\`\n\n### Default Parameters\n\`\`\`javascript\nfunction createUser(name, role = "user") {\n  return { name, role };\n}\n\`\`\`\n\n### Rest Parameters\n\`\`\`javascript\nfunction sum(...numbers) {\n  return numbers.reduce((total, n) => total + n, 0);\n}\nconsole.log(sum(1, 2, 3, 4)); // 10\n\`\`\`\n\nWant to learn about closures, callbacks, or async functions?`,
    "Python": `## Python Functions\n\n### Basic Function\n\`\`\`python\ndef greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("Nova"))  # Hello, Nova!\n\`\`\`\n\n### Default Parameters\n\`\`\`python\ndef create_user(name, role="user"):\n    return {"name": name, "role": role}\n\`\`\`\n\n### *args and **kwargs\n\`\`\`python\ndef sum_all(*args):\n    return sum(args)\n\ndef print_info(**kwargs):\n    for key, value in kwargs.items():\n        print(f"{key}: {value}")\n\nsum_all(1, 2, 3)  # 6\nprint_info(name="Nova", age=1)\n\`\`\`\n\n### Lambda\n\`\`\`python\nsquare = lambda x: x ** 2\nprint(square(4))  # 16\n\`\`\`\n\nWant to learn about decorators, generators, or type hints?`,
  };
  return examples[lang] || `## Functions in ${lang}\n\nFunctions are reusable blocks of code that perform a specific task.\n\n### Key Concepts:\n- **Parameters**: Input values the function accepts\n- **Return value**: The output of the function\n- **Scope**: Variables inside a function are local\n\nWould you like me to show function examples specifically in **${lang}**?`;
}

function generateLoopExplanation(lang: string): string {
  if (lang === "Python") {
    return `## Python Loops\n\n### for loop\n\`\`\`python\n# Iterate over a list\nfruits = ["apple", "banana", "cherry"]\nfor fruit in fruits:\n    print(fruit)\n\n# Range\nfor i in range(5):\n    print(i)  # 0, 1, 2, 3, 4\n\n# Enumerate\nfor i, fruit in enumerate(fruits):\n    print(f"{i}: {fruit}")\n\`\`\`\n\n### while loop\n\`\`\`python\ncount = 0\nwhile count < 5:\n    print(count)\n    count += 1\n\`\`\`\n\n### List Comprehension\n\`\`\`python\nsquares = [x**2 for x in range(10)]\nevens = [x for x in range(20) if x % 2 == 0]\n\`\`\`\n\nWant to learn about nested loops or comprehensions?`;
  }
  return `## Loops in ${lang || "JavaScript"}\n\n### for loop\n\`\`\`javascript\nfor (let i = 0; i < 5; i++) {\n  console.log(i); // 0, 1, 2, 3, 4\n}\n\`\`\`\n\n### for...of (arrays)\n\`\`\`javascript\nconst fruits = ["apple", "banana", "cherry"];\nfor (const fruit of fruits) {\n  console.log(fruit);\n}\n\`\`\`\n\n### while loop\n\`\`\`javascript\nlet count = 0;\nwhile (count < 5) {\n  console.log(count);\n  count++;\n}\n\`\`\`\n\n### Array methods (modern approach)\n\`\`\`javascript\nconst numbers = [1, 2, 3, 4, 5];\nnumbers.forEach(n => console.log(n));\nconst doubled = numbers.map(n => n * 2);\nconst evens = numbers.filter(n => n % 2 === 0);\n\`\`\`\n\nWant to learn about \`map\`, \`filter\`, \`reduce\`, or async iteration?`;
}

function generateArrayExplanation(lang: string): string {
  if (lang === "Python") {
    return `## Python Lists (Arrays)\n\n\`\`\`python\n# Create\nfruits = ["apple", "banana", "cherry"]\nnumbers = [1, 2, 3, 4, 5]\n\n# Access\nprint(fruits[0])   # apple\nprint(fruits[-1])  # cherry (last item)\n\n# Modify\nfruits.append("date")\nfruits.insert(1, "blueberry")\nfruits.remove("banana")\n\n# Slice\nprint(fruits[1:3])  # items 1 to 2\n\n# Useful methods\nnumbers.sort()\nnumbers.reverse()\nlen(numbers)  # length\n\n# List comprehension\nsquares = [x**2 for x in range(10)]\n\`\`\`\n\nNeed help with sorting, slicing, or nested lists?`;
  }
  return `## JavaScript Arrays\n\n\`\`\`javascript\n// Create\nconst fruits = ["apple", "banana", "cherry"];\n\n// Access\nconsole.log(fruits[0]);       // apple\nconsole.log(fruits.at(-1));   // cherry\n\n// Add / Remove\nfruits.push("date");          // add to end\nfruits.unshift("avocado");    // add to start\nfruits.pop();                 // remove last\nfruits.splice(1, 1);          // remove at index\n\n// Transform\nconst upper = fruits.map(f => f.toUpperCase());\nconst long = fruits.filter(f => f.length > 5);\nconst total = [1,2,3].reduce((sum, n) => sum + n, 0);\n\n// Search\nfruits.includes("banana");    // true\nfruits.find(f => f === "banana");\nfruits.findIndex(f => f === "banana");\n\n// Sort\nfruits.sort();\n[3,1,2].sort((a, b) => a - b); // numeric sort\n\`\`\`\n\nWant to learn about destructuring, spread operator, or array methods?`;
}

function generateClassExplanation(lang: string): string {
  return `## Object-Oriented Programming in ${lang || "JavaScript"}\n\n\`\`\`javascript\nclass Animal {\n  constructor(name, type) {\n    this.name = name;\n    this.type = type;\n  }\n\n  speak() {\n    return \`\${this.name} makes a sound\`;\n  }\n}\n\n// Inheritance\nclass Dog extends Animal {\n  constructor(name) {\n    super(name, "dog");\n  }\n\n  speak() {\n    return \`\${this.name} barks! 🐕\`;\n  }\n}\n\nconst dog = new Dog("Buddy");\nconsole.log(dog.speak()); // Buddy barks! 🐕\n\`\`\`\n\n### Key OOP Concepts:\n- **Encapsulation** — Bundling data and methods\n- **Inheritance** — Child classes inherit from parent\n- **Polymorphism** — Same method, different behavior\n- **Abstraction** — Hide complex details\n\nWant examples in a different language or more OOP patterns?`;
}

function generateComponentExplanation(): string {
  return `## React Components\n\n### Function Component (recommended)\n\`\`\`jsx\nfunction Greeting({ name }) {\n  return (\n    <div>\n      <h1>Hello, {name}! 👋</h1>\n    </div>\n  );\n}\n\n// Usage: <Greeting name="Nova" />\n\`\`\`\n\n### Component with State\n\`\`\`jsx\nimport { useState } from 'react';\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(count + 1)}>\n        Increment\n      </button>\n    </div>\n  );\n}\n\`\`\`\n\n### Component with Props & Children\n\`\`\`jsx\nfunction Card({ title, children }) {\n  return (\n    <div className="card">\n      <h2>{title}</h2>\n      {children}\n    </div>\n  );\n}\n\n// Usage\n<Card title="My Card">\n  <p>Card content here</p>\n</Card>\n\`\`\`\n\n### Key Rules:\n1. Component names start with **uppercase**\n2. Return **JSX** (one root element)\n3. Props are **read-only**\n4. Use **hooks** for state & effects\n\nWant to learn about props, state management, or lifecycle?`;
}

function generateHooksExplanation(subject: string): string {
  if (/usestate/i.test(subject)) {
    return `## useState Hook\n\nManages state in function components.\n\n\`\`\`jsx\nimport { useState } from 'react';\n\nfunction Form() {\n  const [name, setName] = useState("");\n  const [items, setItems] = useState([]);\n\n  const addItem = () => {\n    setItems([...items, name]);\n    setName("");\n  };\n\n  return (\n    <div>\n      <input\n        value={name}\n        onChange={(e) => setName(e.target.value)}\n      />\n      <button onClick={addItem}>Add</button>\n      <ul>\n        {items.map((item, i) => <li key={i}>{item}</li>)}\n      </ul>\n    </div>\n  );\n}\n\`\`\`\n\n### Rules:\n- Never modify state directly: \`items.push(x)\` ❌\n- Always use the setter: \`setItems([...items, x])\` ✅\n- State updates may be **batched** and **asynchronous**\n\nWant to learn about useEffect, useRef, or custom hooks?`;
  }
  if (/useeffect/i.test(subject)) {
    return `## useEffect Hook\n\nHandles side effects (API calls, timers, subscriptions).\n\n\`\`\`jsx\nimport { useState, useEffect } from 'react';\n\nfunction UserProfile({ userId }) {\n  const [user, setUser] = useState(null);\n\n  // Runs when userId changes\n  useEffect(() => {\n    fetch(\`/api/users/\${userId}\`)\n      .then(res => res.json())\n      .then(data => setUser(data));\n\n    // Cleanup function (optional)\n    return () => {\n      console.log("Cleanup on unmount or before re-run");\n    };\n  }, [userId]); // dependency array\n\n  if (!user) return <p>Loading...</p>;\n  return <h1>{user.name}</h1>;\n}\n\`\`\`\n\n### Dependency Array:\n- \`[]\` — Run once on mount\n- \`[a, b]\` — Run when a or b changes\n- No array — Run after every render (careful!)\n\nWant to learn about custom hooks or useCallback?`;
  }
  return `## React Hooks Overview\n\n### Essential Hooks:\n\n| Hook | Purpose | Example |\n|------|---------|---------|\n| \`useState\` | State | \`const [val, setVal] = useState(0)\` |\n| \`useEffect\` | Side effects | API calls, timers |\n| \`useRef\` | DOM refs / persist values | \`const ref = useRef(null)\` |\n| \`useMemo\` | Memoize values | Expensive calculations |\n| \`useCallback\` | Memoize functions | Prevent re-renders |\n| \`useContext\` | Global state | Theme, auth |\n\n\`\`\`jsx\nimport { useState, useEffect } from 'react';\n\nfunction Timer() {\n  const [seconds, setSeconds] = useState(0);\n\n  useEffect(() => {\n    const interval = setInterval(() => {\n      setSeconds(s => s + 1);\n    }, 1000);\n    return () => clearInterval(interval);\n  }, []);\n\n  return <p>⏱️ {seconds}s</p>;\n}\n\`\`\`\n\nWhich hook would you like to learn about in detail?`;
}

function generateAsyncExplanation(lang: string): string {
  return `## Async Programming in ${lang}\n\n### Promises\n\`\`\`javascript\nfetch("https://api.example.com/data")\n  .then(response => response.json())\n  .then(data => console.log(data))\n  .catch(error => console.error(error));\n\`\`\`\n\n### async/await (cleaner syntax)\n\`\`\`javascript\nasync function fetchData() {\n  try {\n    const response = await fetch("https://api.example.com/data");\n    const data = await response.json();\n    console.log(data);\n    return data;\n  } catch (error) {\n    console.error("Error:", error);\n  }\n}\n\`\`\`\n\n### Parallel Requests\n\`\`\`javascript\nconst [users, posts] = await Promise.all([\n  fetch("/api/users").then(r => r.json()),\n  fetch("/api/posts").then(r => r.json()),\n]);\n\`\`\`\n\nWant to learn about error handling, race conditions, or AbortController?`;
}

function generateClosureExplanation(): string {
  return `## JavaScript Closures\n\nA closure is a function that remembers variables from its outer scope, even after the outer function has finished.\n\n\`\`\`javascript\nfunction createCounter() {\n  let count = 0; // enclosed variable\n  \n  return {\n    increment: () => ++count,\n    decrement: () => --count,\n    getCount: () => count,\n  };\n}\n\nconst counter = createCounter();\ncounter.increment(); // 1\ncounter.increment(); // 2\ncounter.decrement(); // 1\nconsole.log(counter.getCount()); // 1\n\`\`\`\n\n### Practical Use: Private Variables\n\`\`\`javascript\nfunction createUser(name) {\n  // 'name' is private — no direct access from outside\n  return {\n    getName: () => name,\n    setName: (newName) => { name = newName; },\n  };\n}\n\`\`\`\n\n### Common Pitfall: Loop Closures\n\`\`\`javascript\n// ❌ Problem\nfor (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 100); // 3, 3, 3\n}\n\n// ✅ Fix with let\nfor (let i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 100); // 0, 1, 2\n}\n\`\`\`\n\nWant me to explain more closure patterns?`;
}

function generateEventExplanation(tech?: string): string {
  return `## Event Handling in ${tech || "JavaScript"}\n\n### Vanilla JavaScript\n\`\`\`javascript\nconst button = document.querySelector("#myBtn");\n\nbutton.addEventListener("click", (event) => {\n  console.log("Clicked!", event.target);\n});\n\`\`\`\n\n### React Events\n\`\`\`jsx\nfunction Form() {\n  const handleSubmit = (e) => {\n    e.preventDefault();\n    console.log("Form submitted!");\n  };\n\n  const handleChange = (e) => {\n    console.log(e.target.value);\n  };\n\n  return (\n    <form onSubmit={handleSubmit}>\n      <input onChange={handleChange} />\n      <button type="submit">Submit</button>\n    </form>\n  );\n}\n\`\`\`\n\n### Common Events:\n| Event | Description |\n|-------|-------------|\n| onClick | Click |\n| onChange | Input change |\n| onSubmit | Form submit |\n| onKeyDown | Key press |\n| onMouseEnter | Hover |\n\nWant to learn about event delegation or custom events?`;
}

function generateErrorHandlingExplanation(lang: string): string {
  return `## Error Handling in ${lang}\n\n\`\`\`javascript\n// try-catch-finally\ntry {\n  const data = JSON.parse(userInput);\n  processData(data);\n} catch (error) {\n  console.error("Parsing error:", error.message);\n} finally {\n  cleanup();\n}\n\`\`\`\n\n### Custom Error\n\`\`\`javascript\nclass ValidationError extends Error {\n  constructor(field, message) {\n    super(message);\n    this.field = field;\n    this.name = "ValidationError";\n  }\n}\n\nfunction validate(email) {\n  if (!email.includes("@")) {\n    throw new ValidationError("email", "Invalid email");\n  }\n}\n\`\`\`\n\n### Async Error Handling\n\`\`\`javascript\nasync function fetchUser(id) {\n  try {\n    const res = await fetch(\`/api/users/\${id}\`);\n    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);\n    return await res.json();\n  } catch (error) {\n    console.error("Failed to fetch:", error);\n    return null;\n  }\n}\n\`\`\`\n\nWant to learn about global error handlers or error boundaries in React?`;
}

function generateNextRoutingExplanation(): string {
  return `## Next.js Routing (App Router)\n\n### File-based routing:\n\`\`\`\napp/\n├── page.js          → /\n├── about/page.js    → /about\n├── blog/\n│   ├── page.js      → /blog\n│   └── [slug]/page.js → /blog/my-post\n└── layout.js        → Shared layout\n\`\`\`\n\n### Dynamic Route\n\`\`\`jsx\n// app/blog/[slug]/page.js\nexport default function BlogPost({ params }) {\n  return <h1>Post: {params.slug}</h1>;\n}\n\`\`\`\n\n### Navigation\n\`\`\`jsx\nimport Link from 'next/link';\nimport { useRouter } from 'next/navigation';\n\nfunction Nav() {\n  const router = useRouter();\n  \n  return (\n    <nav>\n      <Link href="/about">About</Link>\n      <button onClick={() => router.push('/blog')}>\n        Blog\n      </button>\n    </nav>\n  );\n}\n\`\`\`\n\nWant to learn about layouts, loading states, or API routes?`;
}

function generateReactRoutingExplanation(): string {
  return `## React Router\n\n\`\`\`jsx\nimport { BrowserRouter, Routes, Route, Link } from 'react-router-dom';\n\nfunction App() {\n  return (\n    <BrowserRouter>\n      <nav>\n        <Link to="/">Home</Link>\n        <Link to="/about">About</Link>\n      </nav>\n      <Routes>\n        <Route path="/" element={<Home />} />\n        <Route path="/about" element={<About />} />\n        <Route path="/user/:id" element={<UserProfile />} />\n        <Route path="*" element={<NotFound />} />\n      </Routes>\n    </BrowserRouter>\n  );\n}\n\`\`\`\n\n### Access URL Parameters\n\`\`\`jsx\nimport { useParams, useNavigate } from 'react-router-dom';\n\nfunction UserProfile() {\n  const { id } = useParams();\n  const navigate = useNavigate();\n  \n  return (\n    <div>\n      <h1>User {id}</h1>\n      <button onClick={() => navigate('/')}>Go Home</button>\n    </div>\n  );\n}\n\`\`\`\n\nWant to learn about protected routes or nested routing?`;
}

function generateExpressRoutingExplanation(): string {
  return `## Express.js Routing\n\n\`\`\`javascript\nconst express = require('express');\nconst app = express();\napp.use(express.json());\n\n// GET\napp.get('/api/users', (req, res) => {\n  res.json([{ id: 1, name: 'Nova' }]);\n});\n\n// POST\napp.post('/api/users', (req, res) => {\n  const { name, email } = req.body;\n  res.status(201).json({ id: 2, name, email });\n});\n\n// Route parameters\napp.get('/api/users/:id', (req, res) => {\n  const { id } = req.params;\n  res.json({ id, name: 'Nova' });\n});\n\n// Middleware\nconst auth = (req, res, next) => {\n  if (!req.headers.authorization) {\n    return res.status(401).json({ error: 'Unauthorized' });\n  }\n  next();\n};\n\napp.get('/api/protected', auth, (req, res) => {\n  res.json({ message: 'Secret data' });\n});\n\napp.listen(3000);\n\`\`\`\n\nWant to learn about middleware, error handling, or MVC patterns?`;
}

function generateStateManagementExplanation(): string {
  return `## React State Management\n\n### 1. useState (local state)\n\`\`\`jsx\nconst [count, setCount] = useState(0);\n\`\`\`\n\n### 2. useContext (shared state)\n\`\`\`jsx\nconst ThemeContext = React.createContext('light');\n\nfunction App() {\n  return (\n    <ThemeContext.Provider value="dark">\n      <Child />\n    </ThemeContext.Provider>\n  );\n}\n\nfunction Child() {\n  const theme = useContext(ThemeContext);\n  return <p>Theme: {theme}</p>;\n}\n\`\`\`\n\n### 3. useReducer (complex state)\n\`\`\`jsx\nfunction reducer(state, action) {\n  switch (action.type) {\n    case 'increment': return { count: state.count + 1 };\n    case 'decrement': return { count: state.count - 1 };\n    default: return state;\n  }\n}\n\nconst [state, dispatch] = useReducer(reducer, { count: 0 });\n\`\`\`\n\n### When to Use What:\n| Size | Solution |\n|------|----------|\n| Local to one component | useState |\n| Shared across few components | useContext |\n| Complex logic | useReducer |\n| Large app | Zustand, Redux, Jotai |\n\nWant to learn about Zustand, Redux, or Jotai?`;
}

function generateAPIExplanation(tech?: string): string {
  return `## Working with APIs\n\n### Fetch (built-in)\n\`\`\`javascript\n// GET\nconst response = await fetch('https://api.example.com/users');\nconst users = await response.json();\n\n// POST\nconst newUser = await fetch('https://api.example.com/users', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ name: 'Nova', email: 'nova@ai.com' })\n});\n\`\`\`\n\n### In React (with useEffect)\n\`\`\`jsx\nfunction UserList() {\n  const [users, setUsers] = useState([]);\n  const [loading, setLoading] = useState(true);\n\n  useEffect(() => {\n    fetch('/api/users')\n      .then(res => res.json())\n      .then(data => {\n        setUsers(data);\n        setLoading(false);\n      })\n      .catch(err => console.error(err));\n  }, []);\n\n  if (loading) return <p>Loading...</p>;\n  return (\n    <ul>\n      {users.map(u => <li key={u.id}>{u.name}</li>)}\n    </ul>\n  );\n}\n\`\`\`\n\nWant to learn about error handling, authentication headers, or building your own API?`;
}

function generateDatabaseExplanation(tech?: string): string {
  if (tech === "MongoDB") {
    return `## MongoDB Basics\n\n\`\`\`javascript\n// Connect with Mongoose\nconst mongoose = require('mongoose');\nawait mongoose.connect('mongodb://localhost/myapp');\n\n// Define Schema\nconst userSchema = new mongoose.Schema({\n  name: { type: String, required: true },\n  email: { type: String, unique: true },\n  age: Number,\n  createdAt: { type: Date, default: Date.now }\n});\n\nconst User = mongoose.model('User', userSchema);\n\n// CRUD Operations\nconst user = await User.create({ name: 'Nova', email: 'nova@ai.com' });\nconst users = await User.find({ age: { $gte: 18 } });\nconst updated = await User.findByIdAndUpdate(id, { name: 'New Name' });\nawait User.findByIdAndDelete(id);\n\`\`\`\n\nWant to learn about aggregation, indexing, or relationships?`;
  }
  return `## SQL Database Basics\n\n\`\`\`sql\n-- Create table\nCREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  name VARCHAR(100) NOT NULL,\n  email VARCHAR(255) UNIQUE,\n  created_at TIMESTAMP DEFAULT NOW()\n);\n\n-- Insert\nINSERT INTO users (name, email)\nVALUES ('Nova', 'nova@ai.com');\n\n-- Select\nSELECT * FROM users WHERE name LIKE '%Nova%';\n\n-- Update\nUPDATE users SET name = 'Nova AI' WHERE id = 1;\n\n-- Delete\nDELETE FROM users WHERE id = 1;\n\n-- Join\nSELECT u.name, o.total\nFROM users u\nJOIN orders o ON u.id = o.user_id;\n\`\`\`\n\nWant to learn about joins, indexing, or transactions?`;
}

function generateGitExplanation(subject: string): string {
  if (/pull\s*request|pr\b/i.test(subject)) {
    return `## Pull Requests (PRs)\n\n### Workflow:\n1. Create a branch: \`git checkout -b feature/login\`\n2. Make changes and commit\n3. Push: \`git push origin feature/login\`\n4. Open PR on GitHub\n5. Get code review\n6. Merge when approved\n\n### Good PR Practices:\n- Small, focused changes\n- Clear title and description\n- Include screenshots for UI changes\n- Link related issues\n\nWant to learn about code review best practices?`;
  }
  return `## Git Essentials\n\n\`\`\`bash\n# Setup\ngit init\ngit clone <url>\n\n# Daily workflow\ngit add .                    # Stage all changes\ngit commit -m "feat: add login"  # Commit\ngit push origin main         # Push\n\n# Branching\ngit checkout -b feature/login\ngit switch main\ngit merge feature/login\n\n# Undo\ngit reset --soft HEAD~1      # Undo last commit (keep changes)\ngit stash                    # Save changes temporarily\ngit stash pop                # Restore stashed changes\n\n# View\ngit log --oneline            # Compact history\ngit diff                     # See changes\ngit status                   # Current state\n\`\`\`\n\nWant to learn about merge conflicts, rebasing, or GitHub workflows?`;
}

function generateDeploymentExplanation(tech?: string): string {
  return `## Deployment Guide\n\n### Popular Platforms:\n\n| Platform | Best For | Free Tier |\n|----------|----------|----------|\n| **Vercel** | Next.js, React | ✅ |\n| **Netlify** | Static sites, SPAs | ✅ |\n| **Railway** | Full-stack, backends | Limited |\n| **Render** | APIs, databases | ✅ |\n| **AWS** | Enterprise | Pay-per-use |\n\n### Deploy to Vercel:\n\`\`\`bash\nnpm i -g vercel\nvercel          # Follow prompts\n\`\`\`\n\n### Deploy to Netlify:\n\`\`\`bash\nnpm run build\n# Drag 'dist' folder to netlify.com\n\`\`\`\n\n### Environment Variables:\nNever commit secrets! Use platform env settings.\n\nWant a step-by-step guide for a specific platform?`;
}

function generateResponsiveExplanation(): string {
  return `## Responsive Design\n\n### CSS Media Queries\n\`\`\`css\n/* Mobile first approach */\n.container {\n  padding: 1rem;\n}\n\n/* Tablet */\n@media (min-width: 768px) {\n  .container {\n    padding: 2rem;\n    max-width: 720px;\n  }\n}\n\n/* Desktop */\n@media (min-width: 1024px) {\n  .container {\n    max-width: 960px;\n  }\n}\n\`\`\`\n\n### Tailwind CSS\n\`\`\`html\n<div class="p-4 md:p-8 lg:p-12">\n  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">\n    <div class="text-sm md:text-base lg:text-lg">Content</div>\n  </div>\n</div>\n\`\`\`\n\n### Key Principles:\n- Mobile-first approach\n- Flexible images: \`max-width: 100%\`\n- Use relative units (rem, %, vh/vw)\n- Test on real devices\n\nWant examples with Flexbox, Grid, or Tailwind?`;
}

function generateLayoutExplanation(subject: string): string {
  if (/grid/i.test(subject)) {
    return `## CSS Grid Layout\n\n\`\`\`css\n.grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 1rem;\n}\n\n/* Responsive grid */\n.responsive-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));\n  gap: 1.5rem;\n}\n\n/* Named areas */\n.layout {\n  display: grid;\n  grid-template-areas:\n    "header header"\n    "sidebar main"\n    "footer footer";\n  grid-template-columns: 250px 1fr;\n}\n\n.header { grid-area: header; }\n.sidebar { grid-area: sidebar; }\n.main { grid-area: main; }\n\`\`\`\n\nWant to learn about grid alignment or complex layouts?`;
  }
  return `## CSS Flexbox\n\n\`\`\`css\n/* Center content */\n.center {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n}\n\n/* Navigation bar */\n.navbar {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 1rem;\n}\n\n/* Card layout */\n.cards {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 1rem;\n}\n\n.card {\n  flex: 1 1 300px; /* grow, shrink, basis */\n}\n\`\`\`\n\n### Cheat Sheet:\n| Property | Values |\n|----------|--------|\n| justify-content | flex-start, center, space-between, space-around |\n| align-items | flex-start, center, stretch, baseline |\n| flex-direction | row, column, row-reverse |\n\nWant to learn about Grid or responsive patterns?`;
}

function generateAuthExplanation(tech?: string): string {
  return `## Authentication Basics\n\n### JWT (JSON Web Token)\n\`\`\`javascript\n// Login endpoint\napp.post('/api/login', async (req, res) => {\n  const { email, password } = req.body;\n  const user = await User.findOne({ email });\n  \n  if (!user || !await bcrypt.compare(password, user.password)) {\n    return res.status(401).json({ error: 'Invalid credentials' });\n  }\n  \n  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {\n    expiresIn: '7d'\n  });\n  \n  res.json({ token, user: { id: user.id, name: user.name } });\n});\n\n// Auth middleware\nconst auth = (req, res, next) => {\n  const token = req.headers.authorization?.split(' ')[1];\n  if (!token) return res.status(401).json({ error: 'No token' });\n  \n  try {\n    req.user = jwt.verify(token, process.env.JWT_SECRET);\n    next();\n  } catch {\n    res.status(401).json({ error: 'Invalid token' });\n  }\n};\n\`\`\`\n\nWant to learn about OAuth, session-based auth, or auth in React?`;
}

function generateTestingExplanation(tech?: string): string {
  return `## Testing Guide\n\n### Unit Testing with Jest/Vitest\n\`\`\`javascript\nimport { describe, it, expect } from 'vitest';\n\nfunction add(a, b) { return a + b; }\n\ndescribe('add', () => {\n  it('adds two numbers', () => {\n    expect(add(2, 3)).toBe(5);\n  });\n\n  it('handles negatives', () => {\n    expect(add(-1, 1)).toBe(0);\n  });\n});\n\`\`\`\n\n### React Component Testing\n\`\`\`jsx\nimport { render, screen, fireEvent } from '@testing-library/react';\n\ntest('button increments counter', () => {\n  render(<Counter />);\n  const button = screen.getByText('Increment');\n  fireEvent.click(button);\n  expect(screen.getByText('Count: 1')).toBeInTheDocument();\n});\n\`\`\`\n\nWant to learn about mocking, integration tests, or E2E testing?`;
}

function generateAlgorithmExplanation(subject: string): string {
  if (/sort/i.test(subject)) {
    return `## Sorting Algorithms\n\n### Quick Sort — O(n log n) average\n\`\`\`javascript\nfunction quickSort(arr) {\n  if (arr.length <= 1) return arr;\n  const pivot = arr[arr.length - 1];\n  const left = arr.filter((x, i) => x <= pivot && i < arr.length - 1);\n  const right = arr.filter(x => x > pivot);\n  return [...quickSort(left), pivot, ...quickSort(right)];\n}\n\`\`\`\n\n### Merge Sort — O(n log n) guaranteed\n\`\`\`javascript\nfunction mergeSort(arr) {\n  if (arr.length <= 1) return arr;\n  const mid = Math.floor(arr.length / 2);\n  const left = mergeSort(arr.slice(0, mid));\n  const right = mergeSort(arr.slice(mid));\n  return merge(left, right);\n}\n\nfunction merge(left, right) {\n  const result = [];\n  let i = 0, j = 0;\n  while (i < left.length && j < right.length) {\n    result.push(left[i] < right[j] ? left[i++] : right[j++]);\n  }\n  return [...result, ...left.slice(i), ...right.slice(j)];\n}\n\`\`\`\n\n### Comparison:\n| Algorithm | Best | Average | Worst | Space |\n|-----------|------|---------|-------|-------|\n| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) |\n| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) |\n| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) |\n\nWant to learn about a specific sorting algorithm?`;
  }
  if (/recursion/i.test(subject)) {
    return `## Recursion\n\nA function that calls itself until a base case is reached.\n\n### Factorial\n\`\`\`javascript\nfunction factorial(n) {\n  if (n <= 1) return 1; // base case\n  return n * factorial(n - 1); // recursive case\n}\n\n// factorial(5) = 5 × 4 × 3 × 2 × 1 = 120\n\`\`\`\n\n### Fibonacci\n\`\`\`javascript\nfunction fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\n// Optimized with memoization\nfunction fibMemo(n, memo = {}) {\n  if (n in memo) return memo[n];\n  if (n <= 1) return n;\n  memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);\n  return memo[n];\n}\n\`\`\`\n\n### Key Rules:\n1. Always have a **base case** (stop condition)\n2. Each call should move **toward** the base case\n3. Trust the recursion — don't try to trace every call\n\nWant to learn about tree traversal or dynamic programming?`;
  }
  return `## Data Structures & Algorithms\n\n### Common Data Structures:\n| Structure | Access | Search | Insert | Delete |\n|-----------|--------|--------|--------|--------|\n| Array | O(1) | O(n) | O(n) | O(n) |\n| Linked List | O(n) | O(n) | O(1) | O(1) |\n| Hash Map | O(1) | O(1) | O(1) | O(1) |\n| Binary Tree | O(log n) | O(log n) | O(log n) | O(log n) |\n| Stack/Queue | O(n) | O(n) | O(1) | O(1) |\n\n### Big O Notation:\n- **O(1)** — Constant (instant)\n- **O(log n)** — Logarithmic (binary search)\n- **O(n)** — Linear (loop)\n- **O(n log n)** — Efficient sort\n- **O(n²)** — Quadratic (nested loops)\n\nWhich topic would you like to explore in detail?`;
}

// ── Tech overview ───────────────────────────────────────────────────
function buildTechOverview(tech: string, subject: string): string {
  const overviews: Record<string, string> = {
    "JavaScript": `## JavaScript\n\nJavaScript is the language of the web. It runs in browsers and on servers (Node.js).\n\n\`\`\`javascript\n// Variables\nconst name = "Nova";\nlet count = 0;\n\n// Functions\nconst greet = (name) => \`Hello, \${name}!\`;\n\n// Objects\nconst user = { name: "Nova", age: 25 };\n\n// Arrays\nconst numbers = [1, 2, 3, 4, 5];\nconst doubled = numbers.map(n => n * 2);\n\n// Async\nconst data = await fetch('/api/data').then(r => r.json());\n\`\`\`\n\nWhat specific JavaScript topic would you like to learn about?`,
    "TypeScript": `## TypeScript\n\nTypeScript adds static typing to JavaScript.\n\n\`\`\`typescript\n// Types\nlet name: string = "Nova";\nlet age: number = 25;\n\n// Interface\ninterface User {\n  name: string;\n  email: string;\n  age?: number; // optional\n}\n\n// Generics\nfunction identity<T>(arg: T): T {\n  return arg;\n}\n\n// Enum\nenum Color { Red, Green, Blue }\n\`\`\`\n\nWhat TypeScript feature would you like to explore?`,
    "React": `## React\n\nReact is a JavaScript library for building user interfaces.\n\n\`\`\`jsx\nimport { useState } from 'react';\n\nfunction App() {\n  const [message, setMessage] = useState("Hello!");\n\n  return (\n    <div>\n      <h1>{message}</h1>\n      <button onClick={() => setMessage("Updated!")}>\n        Click Me\n      </button>\n    </div>\n  );\n}\n\`\`\`\n\n### Core Concepts:\n- **Components** — Reusable UI pieces\n- **Props** — Pass data down\n- **State** — Dynamic data\n- **Hooks** — Add features to components\n\nWhat React topic would you like to learn about?`,
    "Next.js": `## Next.js\n\nNext.js is a full-stack React framework.\n\n\`\`\`jsx\n// app/page.js\nexport default function Home() {\n  return <h1>Welcome to Next.js!</h1>;\n}\n\n// Server Component (default)\nasync function Posts() {\n  const posts = await fetch('https://api.example.com/posts');\n  const data = await posts.json();\n  return <ul>{data.map(p => <li key={p.id}>{p.title}</li>)}</ul>;\n}\n\`\`\`\n\n### Features:\n- File-based routing\n- Server & Client components\n- API routes\n- Image optimization\n- SSR / SSG / ISR\n\nWhat Next.js topic interests you?`,
    "Node.js": `## Node.js\n\nNode.js runs JavaScript on the server.\n\n\`\`\`javascript\n// Simple HTTP server\nconst http = require('http');\n\nconst server = http.createServer((req, res) => {\n  res.writeHead(200, { 'Content-Type': 'application/json' });\n  res.end(JSON.stringify({ message: 'Hello from Node!' }));\n});\n\nserver.listen(3000, () => console.log('Server running on :3000'));\n\`\`\`\n\n### With Express:\n\`\`\`javascript\nconst express = require('express');\nconst app = express();\n\napp.get('/api/hello', (req, res) => {\n  res.json({ message: 'Hello!' });\n});\n\napp.listen(3000);\n\`\`\`\n\nWhat Node.js topic would you like to explore?`,
    "Tailwind CSS": `## Tailwind CSS\n\nUtility-first CSS framework.\n\n\`\`\`html\n<!-- Card component -->\n<div class="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition">\n  <h2 class="text-xl font-bold text-gray-800">Card Title</h2>\n  <p class="text-gray-600 mt-2">Card description here.</p>\n  <button class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">\n    Learn More\n  </button>\n</div>\n\n<!-- Responsive grid -->\n<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">\n  <!-- items -->\n</div>\n\`\`\`\n\nWant to learn about custom themes, animations, or responsive design with Tailwind?`,
  };

  return overviews[tech] || `## ${tech}\n\nI can help you with **${tech}**! What specifically would you like to know?\n\n- Basics and getting started\n- Code examples\n- Best practices\n- Common patterns\n- Troubleshooting\n\nAsk me a specific question about ${tech} and I'll give you a detailed answer! 🚀`;
}

// ── General explanation for non-tech topics ─────────────────────────
function generateGeneralExplanation(subject: string): string {
  return `That's a great topic! Here's what I know about **${subject}**:\n\nThis is a broad subject. To give you the most helpful answer, could you tell me:\n\n1. **What context** — Are you asking about this for programming, academics, or general knowledge?\n2. **What level** — Are you a beginner or looking for advanced information?\n3. **Specific aspect** — Is there a particular angle you're interested in?\n\nThe more specific your question, the better I can help! 💡`;
}

// ── Write-code handler ──────────────────────────────────────────────
function buildCodeResponse(subject: string, techs: TechMatch[]): string {
  const lang = techs.find(t => t.category === "language")?.tech || "JavaScript";
  const framework = techs.find(t => t.category === "framework")?.tech;

  // Check if subject mentions a specific thing to build
  if (/\b(todo|to-do|task)\b.*\b(app|list)\b/i.test(subject)) {
    return generateTodoApp(framework || lang);
  }
  if (/\b(calculator)\b/i.test(subject)) {
    return generateCalculator(lang);
  }
  if (/\b(form|login|signup|register)\b/i.test(subject)) {
    return generateForm(framework || lang, subject);
  }
  if (/\b(navbar|navigation|menu|header)\b/i.test(subject)) {
    return generateNavbar(framework || lang);
  }

  // Specific function requests
  const funcMatch = subject.match(/\b(function|method)\b.*?(?:to|that|for)\s+(.+)/i);
  if (funcMatch) {
    return generateCustomFunction(lang, funcMatch[2]);
  }

  return `Sure! I'll write that in **${framework || lang}**.\n\nCould you give me a bit more detail about what the code should do? For example:\n- What input does it take?\n- What should it return or display?\n- Any specific requirements?\n\nThe more details you share, the better code I can write! 🚀`;
}

function generateTodoApp(tech: string): string {
  if (tech === "React" || tech === "Next.js") {
    return `## Todo App in React\n\n\`\`\`jsx\nimport { useState } from 'react';\n\nfunction TodoApp() {\n  const [todos, setTodos] = useState([]);\n  const [input, setInput] = useState("");\n\n  const addTodo = () => {\n    if (!input.trim()) return;\n    setTodos([...todos, { id: Date.now(), text: input, done: false }]);\n    setInput("");\n  };\n\n  const toggleTodo = (id) => {\n    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));\n  };\n\n  const deleteTodo = (id) => {\n    setTodos(todos.filter(t => t.id !== id));\n  };\n\n  return (\n    <div style={{ maxWidth: 400, margin: '2rem auto' }}>\n      <h1>📝 Todo List</h1>\n      <div style={{ display: 'flex', gap: 8 }}>\n        <input\n          value={input}\n          onChange={e => setInput(e.target.value)}\n          onKeyDown={e => e.key === 'Enter' && addTodo()}\n          placeholder="Add a task..."\n          style={{ flex: 1, padding: 8 }}\n        />\n        <button onClick={addTodo}>Add</button>\n      </div>\n      <ul style={{ listStyle: 'none', padding: 0 }}>\n        {todos.map(todo => (\n          <li key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8 }}>\n            <input type="checkbox" checked={todo.done} onChange={() => toggleTodo(todo.id)} />\n            <span style={{ textDecoration: todo.done ? 'line-through' : 'none', flex: 1 }}>\n              {todo.text}\n            </span>\n            <button onClick={() => deleteTodo(todo.id)}>🗑️</button>\n          </li>\n        ))}\n      </ul>\n      <p>{todos.filter(t => !t.done).length} tasks remaining</p>\n    </div>\n  );\n}\n\nexport default TodoApp;\n\`\`\`\n\nThis includes add, toggle, delete, and a counter. Want me to add filtering, localStorage, or styling?`;
  }
  return `## Todo App in ${tech}\n\nI can build a todo app in **${tech}**! The app will include:\n- Add tasks\n- Mark as complete\n- Delete tasks\n- Task counter\n\nWant me to generate the full code?`;
}

function generateCalculator(lang: string): string {
  return `## Calculator in ${lang}\n\n\`\`\`javascript\nfunction calculator(a, operator, b) {\n  switch (operator) {\n    case '+': return a + b;\n    case '-': return a - b;\n    case '*': return a * b;\n    case '/': return b !== 0 ? a / b : 'Error: Division by zero';\n    case '%': return a % b;\n    case '**': return a ** b;\n    default: return 'Unknown operator';\n  }\n}\n\n// Usage\nconsole.log(calculator(10, '+', 5));   // 15\nconsole.log(calculator(10, '/', 3));   // 3.333...\nconsole.log(calculator(2, '**', 8));   // 256\n\`\`\`\n\nWant a GUI calculator with React, or a more advanced scientific calculator?`;
}

function generateForm(tech: string, subject: string): string {
  const isLogin = /login|sign\s*in/i.test(subject);
  const title = isLogin ? "Login" : "Signup";
  return `## ${title} Form in React\n\n\`\`\`jsx\nimport { useState } from 'react';\n\nfunction ${title}Form() {\n  const [formData, setFormData] = useState({\n    email: '',\n    password: '',${!isLogin ? "\n    name: ''," : ""}\n  });\n  const [error, setError] = useState('');\n\n  const handleChange = (e) => {\n    setFormData({ ...formData, [e.target.name]: e.target.value });\n  };\n\n  const handleSubmit = async (e) => {\n    e.preventDefault();\n    setError('');\n    \n    try {\n      const res = await fetch('/api/${isLogin ? "login" : "signup"}', {\n        method: 'POST',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify(formData),\n      });\n      const data = await res.json();\n      if (!res.ok) throw new Error(data.message);\n      console.log('Success:', data);\n    } catch (err) {\n      setError(err.message);\n    }\n  };\n\n  return (\n    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '2rem auto' }}>\n      <h2>${title}</h2>\n      {error && <p style={{ color: 'red' }}>{error}</p>}${!isLogin ? '\n      <input name="name" placeholder="Name" value={formData.name} onChange={handleChange} required />' : ""}\n      <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required />\n      <input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} required />\n      <button type="submit">${title}</button>\n    </form>\n  );\n}\n\`\`\`\n\nWant me to add validation, password strength indicator, or styling?`;
}

function generateNavbar(tech: string): string {
  return `## Responsive Navbar in React + Tailwind\n\n\`\`\`jsx\nimport { useState } from 'react';\n\nfunction Navbar() {\n  const [isOpen, setIsOpen] = useState(false);\n\n  return (\n    <nav className="bg-white shadow-md">\n      <div className="max-w-6xl mx-auto px-4">\n        <div className="flex justify-between items-center h-16">\n          <a href="/" className="text-xl font-bold text-blue-600">Logo</a>\n          \n          {/* Desktop menu */}\n          <div className="hidden md:flex space-x-8">\n            <a href="/" className="text-gray-700 hover:text-blue-600">Home</a>\n            <a href="/about" className="text-gray-700 hover:text-blue-600">About</a>\n            <a href="/contact" className="text-gray-700 hover:text-blue-600">Contact</a>\n          </div>\n          \n          {/* Mobile toggle */}\n          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>\n            {isOpen ? '✕' : '☰'}\n          </button>\n        </div>\n        \n        {/* Mobile menu */}\n        {isOpen && (\n          <div className="md:hidden pb-4 space-y-2">\n            <a href="/" className="block py-2 text-gray-700">Home</a>\n            <a href="/about" className="block py-2 text-gray-700">About</a>\n            <a href="/contact" className="block py-2 text-gray-700">Contact</a>\n          </div>\n        )}\n      </div>\n    </nav>\n  );\n}\n\`\`\`\n\nWant dropdown menus, active link highlighting, or sticky behavior?`;
}

function generateCustomFunction(lang: string, description: string): string {
  return `## Custom Function: ${capitalize(description)}\n\nHere's a function in **${lang}** that ${description}:\n\n\`\`\`javascript\n// TODO: I'll generate the specific implementation\n// based on your exact requirements\nfunction customFunction(input) {\n  // Implementation for: ${description}\n  // ...\n}\n\`\`\`\n\nCould you give me a bit more detail?\n- What **input** does it receive?\n- What should it **return**?\n- Any **edge cases** to handle?\n\nI'll write the complete, working code for you! 🚀`;
}

// ── Debug response ──────────────────────────────────────────────────
function buildDebugResponse(subject: string, techs: TechMatch[]): string {
  return `## Let's Debug This! 🔍\n\nI'd like to help you fix the issue. To give you the best solution, please share:\n\n1. **The error message** — Copy the exact error text\n2. **The code** — The relevant code snippet\n3. **What you expected** — What should happen?\n4. **What actually happens** — What's going wrong?\n\n### Quick Debugging Tips:\n\`\`\`javascript\n// 1. Check the console for errors\nconsole.log("Value:", myVariable);\n\n// 2. Use typeof to check types\nconsole.log(typeof myVariable);\n\n// 3. Use try-catch\ntry {\n  riskyCode();\n} catch (error) {\n  console.error("Error:", error.message);\n}\n\`\`\`\n\nPaste your error or code and I'll help you fix it! 💪`;
}

// ── Compare response ────────────────────────────────────────────────
function buildCompareResponse(subject: string, techs: TechMatch[]): string {
  if (techs.length >= 2) {
    const [a, b] = techs;
    return `## ${a.tech} vs ${b.tech}\n\n| Feature | ${a.tech} | ${b.tech} |\n|---------|${"-".repeat(a.tech.length + 2)}|${"-".repeat(b.tech.length + 2)}|\n| Type | ${a.category} | ${b.category} |\n| Learning Curve | Varies | Varies |\n| Community | Large | Large |\n| Use Case | Depends | Depends |\n\n### When to use ${a.tech}:\n- Best for specific use cases of ${a.tech}\n\n### When to use ${b.tech}:\n- Best for specific use cases of ${b.tech}\n\n### My Recommendation:\nIt depends on your project requirements. Both are excellent choices.\n\nWant me to compare specific features like performance, ecosystem, or developer experience?`;
  }
  return `I'd be happy to compare! Which two technologies or concepts would you like me to compare?\n\nFor example:\n- React vs Vue\n- JavaScript vs TypeScript\n- MongoDB vs PostgreSQL\n- REST vs GraphQL\n\nTell me the two options and I'll give you a detailed comparison! 📊`;
}

// ── Follow-up handler ───────────────────────────────────────────────
function handleFollowUp(userMessage: string, history: Message[], isBanglish: boolean): string | null {
  const followUpPatterns = [
    /^(yes|yeah|yep|sure|ok|okay|please|go\s+ahead|haan|ji|ha|hmm)\b/i,
    /^(tell me more|more detail|explain more|go on|continue|elaborate|expand)/i,
    /^(what about|how about|and|also|another)\b/i,
    /^(can you|could you)\s+(show|give|explain|tell)/i,
  ];

  if (!followUpPatterns.some(p => p.test(userMessage.trim()))) return null;

  // Find the last meaningful exchange
  const lastAiMsg = [...history].reverse().find(m => m.role === "ai");
  const lastUserMsg = [...history].reverse().find(m => m.role === "user" && m.content !== userMessage);

  if (!lastAiMsg || !lastUserMsg) return null;

  // Detect what the previous topic was
  const prevTechs = detectTech(lastUserMsg.content);
  const prevSubject = extractSubject(lastUserMsg.content);

  return `Great! Let me expand on **${prevSubject.slice(0, 60)}**...\n\n### Additional Details:\n\n1. **Advanced patterns** — Beyond the basics, there are more sophisticated approaches to consider\n2. **Common pitfalls** — Here are mistakes to avoid:\n   - Not handling edge cases\n   - Ignoring performance implications\n   - Over-engineering simple solutions\n3. **Best practices** — Industry-recommended approaches:\n   - Keep code readable and maintainable\n   - Write tests for critical functionality\n   - Document your decisions\n4. **Resources** — For deeper learning:\n   - Official documentation\n   - Community tutorials\n   - Practice projects\n\nWould you like me to focus on any specific aspect? 🎯`;
}

// ── Bangla / Banglish wrappers ──────────────────────────────────────
function wrapBanglaResponse(intent: Intent): string {
  const responses: Record<string, string> = {
    greeting: `হ্যালো! 👋 আমি **Nova AI** — আপনার বুদ্ধিমান সহকারী।\n\nআমি সাহায্য করতে পারি:\n- 💻 **প্রোগ্রামিং** — JavaScript, Python, React সহ সব ভাষা\n- 📝 **লেখালেখি** — আর্টিকেল, ইমেইল, কন্টেন্ট\n- 🔬 **গবেষণা** — বিশ্লেষণ এবং তথ্য\n- 💡 **আইডিয়া** — ব্রেইনস্টর্মিং\n\nকী নিয়ে সাহায্য চান? 🚀`,
    who_are_you: `আমি **Nova AI** — আপনার বুদ্ধিমান সহকারী! 🚀\n\nআমি পারি:\n- প্রোগ্রামিং প্রশ্নের উত্তর দিতে\n- কোড লিখতে ও ডিবাগ করতে\n- বিভিন্ন বিষয় ব্যাখ্যা করতে\n- একাধিক ভাষায় সাহায্য করতে\n\nকী জানতে চান?`,
    thanks: `আপনাকে স্বাগতম! 😊 সাহায্য করতে পেরে আনন্দিত!\n\nআর কিছু জানতে চাইলে জিজ্ঞাসা করুন! 🚀`,
    farewell: `বিদায়! 👋 আবার দেখা হবে। যেকোনো সময় সাহায্য দরকার হলে আসুন! 😊`,
    unclear: `আমি আপনাকে সাহায্য করতে চাই! 🤔\n\nঅনুগ্রহ করে একটু নির্দিষ্ট করে বলুন:\n- কোন বিষয়ে জানতে চান?\n- কোড দরকার?\n- কোনো ধারণা ব্যাখ্যা করতে হবে?\n\nআমি প্রস্তুত! 💡`,
  };
  return responses[intent] || `আমি আপনার প্রশ্নটি বুঝতে পেরেছি। অনুগ্রহ করে আরেকটু নির্দিষ্ট করে বলুন যাতে সবচেয়ে ভালো উত্তর দিতে পারি! 💡`;
}

function wrapBanglishResponse(intent: Intent): string {
  const responses: Record<string, string> = {
    greeting: `Hey! 👋 Ami **Nova AI** — tomar intelligent assistant!\n\nAmi help korte pari:\n- 💻 **Programming** — JavaScript, Python, React\n- 📝 **Writing** — Article, content\n- 🔬 **Research** — Analysis\n- 💡 **Ideas** — Brainstorming\n\nKi niye help chai? Bolo! 🚀`,
    who_are_you: `Ami **Nova AI**! 🚀 Tomar intelligent coding & knowledge assistant.\n\nAmi code likhte pari, explain korte pari, debug korte pari — just bolo ki dorkar! 😊`,
    thanks: `Welcome! 😊 Help korte pere happy!\n\nAr kisu janthe chaile bolo! 🚀`,
    farewell: `Bye! 👋 Abar dekha hobe. Jodi kono help lage, chole esho! 😊`,
    unclear: `Ami tomar question ta bujhte chai! 🤔\n\nEktu specific kore bolo:\n- Ki topic niye janthe chao?\n- Code example lagbe?\n- Kono concept explain korte hobe?\n\nAmi ready! 💡`,
  };
  return responses[intent] || `Hmm, ami tomar question ta bujhtechi. Ektu specific kore bolo — ami best answer dibo! 💡`;
}

// ── Utility ─────────────────────────────────────────────────────────
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Main entry point ────────────────────────────────────────────────
export function generateSmartResponse(context: ResponseContext): string {
  const { userMessage, conversationHistory, activeMode, language, isBanglish, hasImages, hasFiles } = context;

  // ── Image / File handling ───
  if (hasImages) {
    return `🖼️ **Image Received**\n\nI can see the image you've uploaded! Here's what I can do:\n\n1. **Describe** — What's in the image\n2. **Analyze** — Colors, composition, details\n3. **Extract text** — OCR from the image\n4. **Identify** — Objects, people, scenes\n\nWhat would you like me to do with this image?`;
  }
  if (hasFiles) {
    return `📄 **Document Received**\n\nI've received your file(s). I can:\n\n1. **Summarize** — Key points\n2. **Analyze** — Deep dive\n3. **Extract** — Specific information\n4. **Q&A** — Ask questions about it\n\nWhat would you like me to do?`;
  }

  // ── Very short / unclear ───
  if (userMessage.trim().length < 2) {
    if (isBanglish) return wrapBanglishResponse("unclear");
    if (language === "bn") return wrapBanglaResponse("unclear");
    return `I'm here to help! Could you tell me what you'd like to know or do? 🤔\n\nFor example:\n- Ask a programming question\n- Request code in any language\n- Get an explanation of a concept\n\nJust type your question! 💡`;
  }

  // ── Detect intent + tech ───
  let intent: Intent;
  if (isBanglish) {
    intent = detectBanglishIntent(userMessage) || detectIntent(userMessage);
  } else if (language === "bn") {
    intent = detectBanglaIntent(userMessage) || detectIntent(userMessage);
  } else {
    intent = detectIntent(userMessage);
  }

  const techs = detectTech(userMessage);
  const subject = extractSubject(userMessage);

  // ── Handle follow-ups first ───
  if (conversationHistory.length > 1) {
    const followUp = handleFollowUp(userMessage, conversationHistory, isBanglish);
    if (followUp) return followUp;
  }

  // ── Simple intents (greeting, thanks, etc.) ───
  if (intent === "greeting") {
    if (isBanglish) return wrapBanglishResponse("greeting");
    if (language === "bn") return wrapBanglaResponse("greeting");
    if (language === "hi") return `नमस्ते! 👋 मैं **Nova AI** — आपका intelligent assistant!\n\nमैं मदद कर सकता हूं:\n- 💻 **प्रोग्रामिंग** — JavaScript, Python, React\n- 📝 **लेखन** — Article, email\n- 💡 **आइडिया** — Brainstorming\n\nक्या मदद चाहिए? 🚀`;
    if (language === "ar") return `مرحباً! 👋 أنا **Nova AI** — مساعدك الذكي!\n\nيمكنني المساعدة في:\n- 💻 **البرمجة**\n- 📝 **الكتابة**\n- 💡 **الأفكار**\n\nكيف يمكنني مساعدتك؟ 🚀`;
    return `Hey there! 👋 I'm **Nova AI**, your intelligent assistant.\n\nI can help you with:\n- 💻 **Programming** — JavaScript, Python, React, C++, Java, and 15+ languages\n- 📝 **Writing** — Articles, emails, summaries\n- 🔬 **Research** — Analysis and insights\n- 💡 **Ideas** — Brainstorming\n\nWhat would you like to work on? 🚀`;
  }

  if (intent === "who_are_you") {
    if (isBanglish) return wrapBanglishResponse("who_are_you");
    if (language === "bn") return wrapBanglaResponse("who_are_you");
    return `I'm **Nova AI** — a next-generation AI workspace assistant! 🚀\n\nI can:\n- **Answer questions** on programming, tech, and general topics\n- **Write & debug code** in 15+ languages\n- **Explain concepts** clearly with examples\n- **Help with writing** — essays, emails, content\n- **Translate** between languages\n- **Understand Banglish** naturally\n\nHow can I help you today?`;
  }

  if (intent === "thanks") {
    if (isBanglish) return wrapBanglishResponse("thanks");
    if (language === "bn") return wrapBanglaResponse("thanks");
    return `You're welcome! 😊 Happy to help!\n\nFeel free to ask anything else — I'm here for you! 🚀`;
  }

  if (intent === "farewell") {
    if (isBanglish) return wrapBanglishResponse("farewell");
    if (language === "bn") return wrapBanglaResponse("farewell");
    return `Goodbye! 👋 It was great chatting with you. Come back anytime you need help! 😊`;
  }

  // ── Programming / tech questions ───
  if (intent === "explain" || intent === "what_is" || intent === "how_to" || intent === "step_by_step" || intent === "general_question") {
    // If there are tech matches or programming keywords, give a specific answer
    if (techs.length > 0 || /\b(code|program|function|variable|loop|array|class|component|hook|api|database|server|deploy)\b/i.test(userMessage)) {
      const explanation = buildExplanation(subject, techs);
      if (explanation) return explanation;
    }
    // For non-tech "what is" / "explain" questions
    if (intent === "what_is" || intent === "explain") {
      return buildExplanation(subject, techs);
    }
  }

  if (intent === "write_code") {
    return buildCodeResponse(subject, techs);
  }

  if (intent === "debug") {
    return buildDebugResponse(subject, techs);
  }

  if (intent === "compare" || intent === "difference") {
    return buildCompareResponse(subject, techs);
  }

  if (intent === "convert") {
    if (techs.length >= 2) {
      return `## Code Conversion: ${techs[0].tech} → ${techs[1].tech}\n\nI can help convert your code! Please share the code you'd like to convert, and I'll rewrite it in **${techs[1].tech}**.\n\nPaste your code and I'll handle the conversion! 🔄`;
    }
    return `I can help convert code between languages! Please specify:\n\n1. **From** which language?\n2. **To** which language?\n3. **Paste** the code\n\nFor example: "Convert this JavaScript function to Python"\n\nShare the details and I'll convert it! 🔄`;
  }

  if (intent === "example") {
    if (techs.length > 0) {
      return buildExplanation(subject, techs);
    }
    return `I'd love to show you an example! What topic or technology?\n\nFor example:\n- "Show me a React component example"\n- "JavaScript array methods example"\n- "Python class example"\n\nWhat would you like to see? 📝`;
  }

  if (intent === "best_practice") {
    const tech = techs[0]?.tech || "software development";
    return `## Best Practices for ${tech}\n\n### Code Quality:\n1. **Write clean, readable code** — Use meaningful names\n2. **Keep functions small** — One function, one job\n3. **Handle errors** — Always use try-catch for risky operations\n4. **Write tests** — Unit tests for critical logic\n5. **Use version control** — Commit often with clear messages\n\n### Architecture:\n1. **DRY** — Don't Repeat Yourself\n2. **KISS** — Keep It Simple\n3. **SOLID** principles for OOP\n4. **Separation of concerns** — UI, logic, data\n\n### Performance:\n1. **Optimize queries** — Use indexes\n2. **Lazy load** — Load only what's needed\n3. **Cache** — Reduce redundant work\n4. **Profile** — Measure before optimizing\n\nWant best practices for a specific area like React, API design, or database?`;
  }

  if (intent === "simplify") {
    if (techs.length > 0) {
      return buildExplanation(subject, techs);
    }
    return `I'll explain it simply! What topic would you like me to break down in easy-to-understand language?\n\nJust tell me the concept and I'll explain it like you're hearing it for the first time! 📖`;
  }

  if (intent === "list") {
    if (techs.length > 0) {
      return buildTechOverview(techs[0].tech, subject);
    }
  }

  if (intent === "translate") {
    return `## Translation Assistant 🌐\n\nI can translate between:\n- 🇬🇧 English ↔ 🇧🇩 Bangla\n- 🇬🇧 English ↔ 🇮🇳 Hindi\n- 🇬🇧 English ↔ 🇸🇦 Arabic\n- 🇬🇧 English ↔ 🇪🇸 Spanish\n- And more!\n\nPlease share the text and target language.\n\n**Example**: "Translate 'How are you?' to Bangla"`;
  }

  // ── Mode-specific (only if no intent matched) ───
  if (activeMode === "slides" && intent === "general_question") {
    return `📊 **Slide Generator**\n\nTo create a presentation, tell me:\n1. **Topic** — What's the presentation about?\n2. **Audience** — Who will see it?\n3. **Slides** — How many slides?\n\nExample: "Create a 5-slide presentation about React hooks"\n\nWhat presentation would you like me to create? 🎨`;
  }

  if (activeMode === "ideas" && intent === "general_question") {
    return `💡 **Brainstorm Mode**\n\nWhat would you like to brainstorm about?\n\n- 🚀 Startup ideas\n- 📱 App concepts\n- 📈 Marketing strategies\n- 🎯 Project ideas\n- 💼 Business plans\n\nTell me a topic and I'll generate creative ideas! 🧠`;
  }

  // ── If we have tech matches but no specific intent, give overview ───
  if (techs.length > 0) {
    return buildTechOverview(techs[0].tech, subject);
  }

  // ── Language-specific fallbacks ───
  if (isBanglish) return wrapBanglishResponse("unclear");
  if (language === "bn") return wrapBanglaResponse("unclear");
  if (language === "hi") return `मैं आपकी मदद करना चाहता हूं! 🤔\n\nकृपया थोड़ा विशिष्ट बताएं:\n- किस विषय में जानना चाहते हैं?\n- कोड चाहिए?\n- कोई concept समझना है?\n\nमैं तैयार हूं! 💡`;
  if (language === "ar") return `أريد مساعدتك! 🤔\n\nيرجى التوضيح:\n- ما الموضوع؟\n- هل تحتاج كود؟\n- شرح مفهوم؟\n\nأنا جاهز! 💡`;
  if (language === "es") return `¡Quiero ayudarte! 🤔\n\nPor favor, especifica:\n- ¿Sobre qué tema?\n- ¿Necesitas código?\n- ¿Explicar un concepto?\n\n¡Estoy listo! 💡`;

  // ── Generic fallback — always asks a relevant follow-up ───
  return `I'd like to give you the best answer! 🤔\n\nCould you tell me a bit more about what you're looking for?\n\n- **Programming help?** — Tell me the language and what you're trying to do\n- **Concept explanation?** — Name the topic and I'll break it down\n- **Code example?** — Specify the language and what it should do\n- **Debugging help?** — Share the error and your code\n\nThe more specific you are, the better I can help! 💡`;
}
