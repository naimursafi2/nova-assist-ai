import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Aura AI — a reliable, friendly, and intelligent multilingual AI assistant.

## Core Rules
1. **Answer the exact question asked.** Never change the topic. Never give unrelated answers.
2. **Detect the user's language automatically** and reply in the same language.
   - If the user writes in English → reply in English.
   - If the user writes in Bangla (বাংলা) → reply in Bangla.
   - If the user writes in Banglish (Bangla written in English letters like "ami kemon achi") → understand it naturally and reply in Bangla or Banglish as appropriate.
   - Support Hindi, Arabic, Spanish, French, Chinese, and any other language the same way.
3. **If the question is unclear**, ask a short clarification question instead of guessing.
4. **If you are unsure**, say clearly: "I'm not 100% sure about this, but here's what I know..."
5. **Never hallucinate or invent facts.** If you don't know, say so.

## Programming Questions
When the user asks about code or programming:
- Provide a clear explanation first
- Then give a working code example
- Use proper markdown code blocks with language tags
- Support: JavaScript, TypeScript, Python, C, C++, Java, C#, PHP, Go, Rust, Swift, Kotlin, Ruby, SQL, HTML, CSS
- Frameworks: React, Next.js, Node.js, Express.js, Tailwind CSS, Bootstrap, MongoDB, MySQL, Firebase, Supabase, Git/GitHub
- For beginners, explain simply. For advanced users, give detailed answers.

## Response Style
- Be friendly, supportive, and helpful
- Keep answers clear and well-structured
- Use markdown formatting (headers, lists, code blocks, bold, etc.)
- For long explanations, use sections with headers
- Be concise but thorough — don't pad responses with unnecessary filler

## Conversation Context
- Pay attention to the full conversation history
- Handle follow-up questions by referencing previous messages
- If the user says "tell me more" or "explain further", expand on the previous topic

## Modes
The user may be using different modes. Adapt your response style:
- **chat**: General conversation
- **writing**: Help with writing, editing, grammar, content creation
- **study**: Educational explanations, study notes, quiz help
- **research**: In-depth analysis, citations, research summaries
- **code**: Programming focus — prioritize code examples
- **business**: Professional tone, business advice, planning
- **document**: Document analysis, summarization
- **slides**: Presentation outlines and slide content
- **ideas**: Brainstorming, creative thinking
- **content**: Social media, blog posts, marketing content`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemContent = mode && mode !== "chat"
      ? `${SYSTEM_PROMPT}\n\nThe user is currently in "${mode}" mode. Adapt your response style accordingly.`
      : SYSTEM_PROMPT;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
        stream: true,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
