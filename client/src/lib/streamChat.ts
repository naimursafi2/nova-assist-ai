import { detectLanguage } from "./languageUtils";
import { generateSmartResponse } from "./responseEngine";
import { Message } from "./chatData";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const CHAT_URL = SUPABASE_URL && SUPABASE_KEY ? `${SUPABASE_URL}/functions/v1/chat` : import.meta.env.VITE_CHAT_API_URL;
const USE_REMOTE_AI = import.meta.env.VITE_USE_REMOTE_AI === "true" && CHAT_URL;

export type ChatMessage = { role: "user" | "assistant"; content: string };

type Tone = "bangla" | "banglish" | "english";

function getTone(text: string, isBanglish?: boolean): Tone {
  if (/[\u0980-\u09FF]/.test(text)) return "bangla";
  if (isBanglish || /\b(tumi|ami|amk|aita|eta|koro|kore|daw|dao|ki|keno|thik|bhalo|somossa|kaj|korche|lagbe|hobe)\b/i.test(text)) return "banglish";
  return "english";
}

function clean(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function fallbackAnswer(text: string, mode = "chat", tone: Tone) {
  const q = clean(text);
  const lower = q.toLowerCase();
  const isGreeting = /^(hi|hello|hey|hii|salam|assalamu|নমস্কার|হাই|হ্যালো|আসসালামু)/i.test(q);
  const isCode = /(code|program|javascript|typescript|react|node|express|vite|vercel|error|bug|fix|api|কোড|এরর|সমস্যা|প্রোগ্রাম)/i.test(q);
  const isHow = /(how|kivabe|ki vabe|kemne|কিভাবে|কীভাবে)/i.test(lower);
  const isWhy = /(why|keno|কেন|কেনো)/i.test(lower);

  if (!q) {
    if (tone === "bangla") return "আপনি কী জানতে চান লিখুন। আমি ধাপে ধাপে সাহায্য করব।";
    if (tone === "banglish") return "Tumi ki jante chao likho. Ami step by step help korbo.";
    return "Tell me what you want to do, and I will help step by step.";
  }

  if (isGreeting) {
    if (tone === "bangla") return "হ্যালো! আমি Nova Assist AI। আপনি প্রশ্ন, কোড, লেখা, অনুবাদ বা সমস্যা পাঠালে আমি সাহায্য করব।";
    if (tone === "banglish") return "Hello! Ami Nova Assist AI. Tumi question, code, writing, translation ba kono error dile ami help korbo.";
    return "Hello! I am Nova Assist AI. Send a question, code, writing task, translation, or error and I will help.";
  }

  if (isCode) {
    if (tone === "bangla") {
      return `আমি বুঝেছি: "${q}"\n\nসম্ভাব্য সমাধান:\n1. error message বা কোন জায়গায় সমস্যা হচ্ছে সেটা আগে identify করুন।\n2. frontend হলে browser console দেখুন।\n3. deploy issue হলে Vercel build log দেখুন।\n4. API issue হলে Network tab-এ request URL/status check করুন।\n\nআপনি error screenshot বা code দিলে আমি exact fix বলে দিতে পারব।`;
    }
    if (tone === "banglish") {
      return `Bujhlam: "${q}"\n\nEta fix korte ei vabe check koro:\n1. Browser console e red error ache kina dekho.\n2. Vercel build/deployment log check koro.\n3. API call fail hole Network tab e URL/status dekho.\n4. Code error hole exact file + error message pathao.\n\nTumi error screenshot/code dile ami exact line fix kore dite parbo.`;
    }
    return `I understand: "${q}"\n\nTo fix it, check these first:\n1. Browser console for red errors.\n2. Vercel deployment logs for build/runtime errors.\n3. Network tab for failed API requests and status codes.\n4. The exact file and line if it is a code issue.\n\nSend the error or code and I can give the exact fix.`;
  }

  if (isHow || isWhy) {
    if (tone === "bangla") {
      return `আপনার প্রশ্ন: "${q}"\n\nসহজভাবে বললে, বিষয়টা বুঝতে আগে main goal, current problem, আর expected result আলাদা করতে হবে।\n\nধাপগুলো:\n1. আপনি কী করতে চান সেটা define করুন।\n2. এখন কী error/সমস্যা হচ্ছে সেটা দেখুন।\n3. ছোট অংশে test করুন।\n4. যেটা fail করছে সেটার exact message ধরে fix করুন।`;
    }
    if (tone === "banglish") {
      return `Tomar question: "${q}"\n\nEasy vabe bolle, age goal ta clear korte hobe, tarpor current problem ar expected result alada korte hobe.\n\nSteps:\n1. Ki korte chao seta clear koro.\n2. Ekhon ki error/problem hocche dekho.\n3. Choto part kore test koro.\n4. Je part fail korche, oi exact error dhore fix koro.`;
    }
    return `Your question: "${q}"\n\nThe best way is to separate the goal, the current problem, and the expected result.\n\nSteps:\n1. Define what you want to achieve.\n2. Check what is failing now.\n3. Test it in small parts.\n4. Fix the exact part that fails.`;
  }

  if (tone === "bangla") {
    return `আমি বুঝেছি: "${q}"\n\nএ বিষয়ে আমি সাহায্য করতে পারি। আপনি চাইলে আমি এটাকে সহজ ব্যাখ্যা, step-by-step guide, code example, অথবা Bangla/English translation আকারে সাজিয়ে দিতে পারি।`;
  }
  if (tone === "banglish") {
    return `Bujhlam: "${q}"\n\nAmi eta niye help korte parbo. Tumi chaile ami easy explanation, step-by-step guide, code example, ba Bangla/English translation kore dite pari.`;
  }
  return `I understand: "${q}"\n\nI can help with this. I can turn it into a simple explanation, step-by-step guide, code example, or translation depending on what you need.`;
}

function localResponse(messages: ChatMessage[], mode?: string) {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user")?.content || "";
  const detected = detectLanguage(lastUserMessage);
  const tone = getTone(lastUserMessage, detected.isBanglish);
  const history: Message[] = messages.map((message, index) => ({
    id: String(index),
    role: message.role === "user" ? "user" : "ai",
    content: message.content,
    timestamp: new Date(),
  }));

  try {
    const smart = generateSmartResponse({
      userMessage: lastUserMessage,
      conversationHistory: history,
      activeMode: mode || "chat",
      language: detected.code,
      isBanglish: !!detected.isBanglish,
      hasImages: false,
      hasFiles: false,
    }).replaceAll("Aura AI", "Nova Assist AI").trim();

    const tooGeneric = /^(hi|hello)!?\s*i am nova assist ai/i.test(smart) || smart.length < 40;
    if (smart && !tooGeneric) return smart;
  } catch (error) {
    console.warn("Local smart response failed:", error);
  }

  return fallbackAnswer(lastUserMessage, mode, tone);
}

function finishWithLocalResponse(messages: ChatMessage[], mode: string | undefined, onDelta: (text: string) => void, onDone: () => void) {
  window.setTimeout(() => {
    onDelta(localResponse(messages, mode));
    onDone();
  }, 250);
}

export async function streamChat({
  messages,
  mode,
  onDelta,
  onDone,
  onError,
}: {
  messages: ChatMessage[];
  mode?: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  if (!USE_REMOTE_AI) {
    finishWithLocalResponse(messages, mode, onDelta, onDone);
    return;
  }

  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(SUPABASE_KEY ? { Authorization: `Bearer ${SUPABASE_KEY}` } : {}),
      },
      body: JSON.stringify({ messages, mode }),
    });

    if (!resp.ok) {
      finishWithLocalResponse(messages, mode, onDelta, onDone);
      return;
    }

    if (!resp.body) {
      finishWithLocalResponse(messages, mode, onDelta, onDone);
      return;
    }

    const contentType = resp.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await resp.json();
      const content = data.content || data.message || "";
      if (!content) {
        finishWithLocalResponse(messages, mode, onDelta, onDone);
        return;
      }
      onDelta(content);
      onDone();
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let streamDone = false;
    let receivedContent = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content || parsed.content || parsed.message;
          if (content) {
            receivedContent = true;
            onDelta(content);
          }
        } catch {
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }

    if (buffer.trim()) {
      for (let raw of buffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content || parsed.content || parsed.message;
          if (content) {
            receivedContent = true;
            onDelta(content);
          }
        } catch {
          /* ignore partial leftovers */
        }
      }
    }

    if (!receivedContent) {
      finishWithLocalResponse(messages, mode, onDelta, onDone);
      return;
    }

    onDone();
  } catch (e) {
    console.error("Stream error:", e);
    finishWithLocalResponse(messages, mode, onDelta, onDone);
  }
}
