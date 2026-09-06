import OpenAI from "openai";
import { AIProviderError, classifyProviderError, type ProviderStreamOptions } from "./aiTypes.js";

const MODEL_ALIASES: Record<string, string> = {
  "aura-fast": process.env.OPENAI_MODEL_FAST || "gpt-4o-mini",
  "aura-smart": process.env.OPENAI_MODEL || "gpt-4o-mini",
  "aura-pro": process.env.OPENAI_MODEL_PRO || process.env.OPENAI_MODEL || "gpt-4o",
  "aura-research": process.env.OPENAI_MODEL_PRO || process.env.OPENAI_MODEL || "gpt-4o",
};

export function resolveOpenAIModel(modelId?: string): string {
  if (modelId && MODEL_ALIASES[modelId]) return MODEL_ALIASES[modelId];
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
}

export async function* streamOpenAIChat({ apiKey, modelId, messages, systemPrompt }: ProviderStreamOptions): AsyncGenerator<string> {
  if (!apiKey) throw new AIProviderError("OPENAI_API_KEY is not configured on the server.", "NO_PROVIDER");

  const client = new OpenAI({ apiKey });

  try {
    const stream = await client.chat.completions.create({
      model: resolveOpenAIModel(modelId),
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content } as const)),
      ],
    });

    for await (const part of stream) {
      const text = part.choices?.[0]?.delta?.content;
      if (text) yield text;
    }
  } catch (error) {
    throw classifyProviderError(error);
  }
}
