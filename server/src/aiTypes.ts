export type ChatRole = "user" | "assistant";

export interface ChatTurn {
  role: ChatRole;
  content: string;
}

export interface ProviderStreamOptions {
  apiKey: string;
  modelId?: string;
  messages: ChatTurn[];
  systemPrompt: string;
}

export class AIProviderError extends Error {
  code: "INVALID_KEY" | "RATE_LIMIT" | "NETWORK" | "NO_PROVIDER" | "MODEL_NOT_FOUND" | "UNKNOWN";

  constructor(message: string, code: AIProviderError["code"]) {
    super(message);
    this.code = code;
    this.name = "AIProviderError";
  }
}

export function classifyProviderError(error: unknown): AIProviderError {
  if (error instanceof AIProviderError) return error;
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("api key not valid") || lower.includes("api_key_invalid") || lower.includes("401") || lower.includes("unauthorized") || lower.includes("incorrect api key")) {
    return new AIProviderError("The configured AI provider API key is invalid or expired.", "INVALID_KEY");
  }
  if (lower.includes("429") || lower.includes("quota") || lower.includes("rate limit") || lower.includes("resource_exhausted")) {
    return new AIProviderError("The AI provider rate limit or free-tier quota was reached. Please wait and try again.", "RATE_LIMIT");
  }
  if (lower.includes("404") || lower.includes("not found") || lower.includes("model")) {
    if (lower.includes("model")) {
      return new AIProviderError(`The configured AI model is unavailable: ${message}`, "MODEL_NOT_FOUND");
    }
  }
  if (lower.includes("fetch failed") || lower.includes("network") || lower.includes("enotfound") || lower.includes("econnrefused") || lower.includes("timeout")) {
    return new AIProviderError("Could not reach the AI provider. Check your network connection.", "NETWORK");
  }
  return new AIProviderError(message || "The AI provider returned an unknown error.", "UNKNOWN");
}
