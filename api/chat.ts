const SYSTEM_PROMPT = `You are Nova Assist AI, a reliable and friendly multilingual assistant.

Rules:
- Reply in the same language or style the user uses.
- Keep answers clear, useful, and direct.
- For coding questions, explain briefly and include working code when helpful.
- Do not invent facts. Say when you are unsure.`;

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

function withMode(mode?: string) {
  return mode && mode !== "chat"
    ? `${SYSTEM_PROMPT}\n\nThe user selected "${mode}" mode. Adapt the response for that task.`
    : SYSTEM_PROMPT;
}

async function callOpenAI(messages: ChatMessage[], mode?: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [{ role: "system", content: withMode(mode) }, ...messages],
      temperature: 0.4,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || "OpenAI request failed");
  return data.choices?.[0]?.message?.content || "";
}

async function callGemini(messages: ChatMessage[], mode?: string) {
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: withMode(mode) }] },
        contents: messages
          .filter((message) => message.role !== "system")
          .map((message) => ({
            role: message.role === "assistant" ? "model" : "user",
            parts: [{ text: message.content }],
          })),
        generationConfig: { temperature: 0.4 },
      }),
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || "Gemini request failed");
  return data.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("") || "";
}

async function callLovable(messages: ChatMessage[], mode?: string) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.LOVABLE_MODEL || "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: withMode(mode) }, ...messages],
      temperature: 0.4,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || data.error || "Lovable AI request failed");
  return data.choices?.[0]?.message?.content || "";
}

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages, mode } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    let content = "";
    if (process.env.OPENAI_API_KEY) {
      content = await callOpenAI(messages, mode);
    } else if (process.env.GEMINI_API_KEY) {
      content = await callGemini(messages, mode);
    } else if (process.env.LOVABLE_API_KEY) {
      content = await callLovable(messages, mode);
    } else {
      return res.status(500).json({
        error: "AI key missing. Set OPENAI_API_KEY, GEMINI_API_KEY, or LOVABLE_API_KEY in Vercel Environment Variables.",
      });
    }

    return res.status(200).json({ content });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "AI request failed" });
  }
}
