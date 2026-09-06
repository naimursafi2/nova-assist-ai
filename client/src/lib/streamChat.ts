const API_URL = import.meta.env.VITE_API_URL || "";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type StreamChatErrorCode =
  | "NO_PROVIDER"
  | "INVALID_KEY"
  | "RATE_LIMIT"
  | "NETWORK"
  | "MODEL_NOT_FOUND"
  | "USAGE_LIMIT"
  | "AUTH_NOT_CONFIGURED"
  | "NO_BACKEND"
  | "UNAUTHORIZED"
  | "ABORTED"
  | "UNKNOWN";

export class StreamChatError extends Error {
  code: StreamChatErrorCode;
  retryable: boolean;

  constructor(message: string, code: StreamChatErrorCode, retryable = true) {
    super(message);
    this.code = code;
    this.retryable = retryable;
    this.name = "StreamChatError";
  }
}

export async function streamChat({
  messages,
  mode,
  model,
  language,
  getAuthToken,
  signal,
  onDelta,
  onDone,
  onError,
}: {
  messages: ChatMessage[];
  mode?: string;
  model?: string;
  language?: string;
  getAuthToken?: () => Promise<string | null>;
  signal?: AbortSignal;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: StreamChatError) => void;
}) {
  if (!API_URL) {
    onError(new StreamChatError("VITE_API_URL is not set, so the app cannot reach the Nova Assist backend. Set it in client/.env and restart the dev server.", "NO_BACKEND", false));
    return;
  }

  let resp: Response;
  try {
    const token = getAuthToken ? await getAuthToken() : null;
    resp = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ messages, mode, model, language }),
    });
  } catch (e) {
    if ((e as Error)?.name === "AbortError") {
      onError(new StreamChatError("Generation stopped.", "ABORTED", false));
      return;
    }
    onError(new StreamChatError("Could not reach the Nova Assist server. Check your network connection or that the backend is running.", "NETWORK"));
    return;
  }

  if (!resp.ok) {
    let payload: { code?: StreamChatErrorCode; message?: string } = {};
    try {
      payload = await resp.json();
    } catch {
      /* non-JSON error body */
    }
    if (resp.status === 401) {
      onError(new StreamChatError(payload.message || "Your session expired. Please sign in again.", "UNAUTHORIZED", false));
      return;
    }
    if (resp.status === 429) {
      onError(new StreamChatError(payload.message || "Daily message limit reached.", "USAGE_LIMIT", false));
      return;
    }
    onError(new StreamChatError(payload.message || `Server error (${resp.status})`, payload.code || "UNKNOWN"));
    return;
  }

  if (!resp.body) {
    onError(new StreamChatError("The server response could not be streamed by this browser.", "UNKNOWN"));
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let receivedAnyDelta = false;
  let finishedCleanly = false;
  let streamError: StreamChatError | null = null;

  const processLine = (line: string) => {
    if (!line.startsWith("data: ")) return;
    const jsonStr = line.slice(6).trim();
    if (!jsonStr) return;
    let parsed: { type?: string; text?: string; code?: StreamChatErrorCode; message?: string };
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return;
    }
    if (parsed.type === "delta" && parsed.text) {
      receivedAnyDelta = true;
      onDelta(parsed.text);
    } else if (parsed.type === "done") {
      finishedCleanly = true;
    } else if (parsed.type === "error") {
      streamError = new StreamChatError(parsed.message || "The AI provider returned an error.", parsed.code || "UNKNOWN");
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n\n")) !== -1) {
        const rawEvent = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 2);
        rawEvent.split("\n").forEach(processLine);
      }
    }
    if (buffer.trim()) {
      buffer.split("\n").forEach(processLine);
    }
  } catch (e) {
    if ((e as Error)?.name === "AbortError") {
      onError(new StreamChatError("Generation stopped.", "ABORTED", false));
      return;
    }
    onError(new StreamChatError("The connection to the server was interrupted mid-response.", "NETWORK"));
    return;
  }

  if (streamError) {
    onError(streamError);
    return;
  }
  if (!finishedCleanly && !receivedAnyDelta) {
    onError(new StreamChatError("The server closed the connection without a response. Please try again.", "UNKNOWN"));
    return;
  }
  onDone();
}
