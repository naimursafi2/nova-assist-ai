import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { streamChat } from "@/lib/streamChat";

function sseResponse(lines: string[], init?: { ok?: boolean; status?: number; json?: unknown }) {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      for (const line of lines) controller.enqueue(encoder.encode(line));
      controller.close();
    },
  });
  return {
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    body,
    json: async () => init?.json ?? {},
  } as unknown as Response;
}

describe("streamChat", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("emits deltas and calls onDone for a well-formed SSE stream", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      sseResponse([
        'data: {"type":"delta","text":"Hello"}\n\n',
        'data: {"type":"delta","text":" world"}\n\n',
        'data: {"type":"done"}\n\n',
      ])
    );

    const deltas: string[] = [];
    let done = false;
    let error: unknown = null;

    await streamChat({
      messages: [{ role: "user", content: "hi" }],
      onDelta: (text) => deltas.push(text),
      onDone: () => { done = true; },
      onError: (e) => { error = e; },
    });

    expect(deltas.join("")).toBe("Hello world");
    expect(done).toBe(true);
    expect(error).toBeNull();
  });

  it("surfaces a provider error event instead of masking it", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      sseResponse(['data: {"type":"error","code":"RATE_LIMIT","message":"Rate limited"}\n\n'])
    );

    let error: { code?: string; message?: string } | null = null;
    await streamChat({
      messages: [{ role: "user", content: "hi" }],
      onDelta: () => {},
      onDone: () => {},
      onError: (e) => { error = e; },
    });

    expect(error?.code).toBe("RATE_LIMIT");
    expect(error?.message).toBe("Rate limited");
  });

  it("reports a clear error when the backend URL is not configured", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_API_URL", "");
    const { streamChat: streamChatNoBackend } = await import("@/lib/streamChat");

    let error: { code?: string } | null = null;
    await streamChatNoBackend({
      messages: [{ role: "user", content: "hi" }],
      onDelta: () => {},
      onDone: () => {},
      onError: (e) => { error = e; },
    });

    expect(error?.code).toBe("NO_BACKEND");
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("maps an HTTP 429 response to a non-retryable usage-limit error", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      sseResponse([], { ok: false, status: 429, json: { message: "Daily limit reached" } })
    );

    let error: { code?: string; retryable?: boolean } | null = null;
    await streamChat({
      messages: [{ role: "user", content: "hi" }],
      onDelta: () => {},
      onDone: () => {},
      onError: (e) => { error = e; },
    });

    expect(error?.code).toBe("USAGE_LIMIT");
    expect(error?.retryable).toBe(false);
  });
});
