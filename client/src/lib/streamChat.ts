import { detectLanguage } from "./languageUtils";
import { generateSmartResponse } from "./responseEngine";
import { Message } from "./chatData";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const CHAT_URL = SUPABASE_URL && SUPABASE_KEY ? `${SUPABASE_URL}/functions/v1/chat` : import.meta.env.VITE_CHAT_API_URL;
const USE_REMOTE_AI = import.meta.env.VITE_USE_REMOTE_AI === "true" && CHAT_URL;

export type ChatMessage = { role: "user" | "assistant"; content: string };

function localResponse(messages: ChatMessage[], mode?: string) {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user")?.content || "";
  const detected = detectLanguage(lastUserMessage);
  const history: Message[] = messages.map((message, index) => ({
    id: String(index),
    role: message.role === "user" ? "user" : "ai",
    content: message.content,
    timestamp: new Date(),
  }));

  return generateSmartResponse({
    userMessage: lastUserMessage,
    conversationHistory: history,
    activeMode: mode || "chat",
    language: detected.code,
    isBanglish: !!detected.isBanglish,
    hasImages: false,
    hasFiles: false,
  }).replaceAll("Aura AI", "Nova Assist AI");
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
      onError("No response body");
      return;
    }

    const contentType = resp.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await resp.json();
      const content = data.content || data.message || "";
      if (!content) {
        onError(data.error || "Empty AI response");
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
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch {
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }

    // Flush remaining buffer
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
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch {
          /* ignore partial leftovers */
        }
      }
    }

    onDone();
  } catch (e) {
    console.error("Stream error:", e);
    finishWithLocalResponse(messages, mode, onDelta, onDone);
  }
}
