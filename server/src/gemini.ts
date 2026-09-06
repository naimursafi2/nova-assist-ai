import { GoogleGenerativeAI, type Content } from "@google/generative-ai";
import { AIProviderError, classifyProviderError, type ProviderStreamOptions } from "./aiTypes.js";

const MODEL_ALIASES: Record<string, string> = {
  "aura-fast": process.env.GEMINI_MODEL_FAST || "gemini-2.5-flash-lite",
  "aura-smart": process.env.GEMINI_MODEL || "gemini-3.5-flash",
  "aura-pro": process.env.GEMINI_MODEL_PRO || process.env.GEMINI_MODEL || "gemini-3.5-flash",
  "aura-research": process.env.GEMINI_MODEL_PRO || process.env.GEMINI_MODEL || "gemini-3.5-flash",
};

export function resolveGeminiModel(modelId?: string): string {
  if (modelId && MODEL_ALIASES[modelId]) return MODEL_ALIASES[modelId];
  return process.env.GEMINI_MODEL || "gemini-3.5-flash";
}

function toGeminiHistory(messages: ProviderStreamOptions["messages"]): Content[] {
  return messages.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));
}

export async function* streamGeminiChat({ apiKey, modelId, messages, systemPrompt }: ProviderStreamOptions): AsyncGenerator<string> {
  if (!apiKey) throw new AIProviderError("GEMINI_API_KEY is not configured on the server.", "NO_PROVIDER");

  const last = messages[messages.length - 1];
  if (!last || last.role !== "user") {
    throw new AIProviderError("The last message must come from the user.", "UNKNOWN");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: resolveGeminiModel(modelId),
    systemInstruction: systemPrompt,
  });

  try {
    const chat = model.startChat({ history: toGeminiHistory(messages.slice(0, -1)) });
    const result = await chat.sendMessageStream(last.content);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  } catch (error) {
    throw classifyProviderError(error);
  }
}
