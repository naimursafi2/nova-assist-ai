import express, { type NextFunction, type Request, type Response } from "express";
import mongoose from "mongoose";
import cors from "cors";
import * as helmetModule from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import Stripe from "stripe";
import { connectDatabase } from "./db.js";
import { isFirebaseAdminConfigured, verifyIdToken } from "./firebaseAdmin.js";
import { streamGeminiChat } from "./gemini.js";
import { streamOpenAIChat } from "./openaiProvider.js";
import { AIProviderError, classifyProviderError, type ChatTurn } from "./aiTypes.js";

// Imported as a namespace and unwrapped explicitly: helmet's package.json "exports"
// map has no "types" condition, which makes `import helmet from "helmet"` resolve to
// an uncallable namespace type under some npm/TypeScript installs (default-import
// interop ambiguity for dual ESM/CJS packages). `.default` is the real function.
const helmet = helmetModule.default;

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:8080";
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const BASIC_FREE_COUPON = process.env.BASIC_FREE_COUPON || "NOVA-BASIC-FREE";
const AI_PROVIDER = (process.env.AI_PROVIDER || "gemini").toLowerCase();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" }) : null;

app.set("trust proxy", true);
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(helmet());
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// ── Models ──────────────────────────────────────────────────────────
const messageSchema = new mongoose.Schema(
  {
    id: String,
    role: { type: String, enum: ["user", "ai", "assistant", "system"], required: true },
    content: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now },
    files: Array,
    images: Array,
    sources: Array,
  },
  { _id: false }
);

const chatSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    userId: { type: String, required: true, index: true },
    folder: { type: String, default: "All" },
    pinned: { type: Boolean, default: false },
    starred: { type: Boolean, default: false },
    messages: [messageSchema],
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: "User" },
    email: { type: String, default: "" },
    profileImage: { type: String, default: "" },
    plan: { type: String, enum: ["guest", "basic", "advanced", "pro"], default: "basic" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    subscriptionStatus: { type: String, default: "inactive" },
    trialStartDate: Date,
    trialEndDate: Date,
    dailyUsage: { type: Number, default: 0 },
    messageCount: { type: Number, default: 0 },
    lastUsageReset: String,
    lastLoginAt: Date,
  },
  { timestamps: true }
);

const billingHistorySchema = new mongoose.Schema(
  {
    userId: { type: String, index: true },
    email: String,
    plan: String,
    amount: Number,
    currency: { type: String, default: "usd" },
    status: String,
    stripeSessionId: String,
    stripeSubscriptionId: String,
    stripeCustomerId: String,
  },
  { timestamps: true }
);

const Chat = mongoose.model("Chat", chatSchema);
const AppUser = mongoose.model("AppUser", userSchema);
const BillingHistory = mongoose.model("BillingHistory", billingHistorySchema);

const planMessageLimits: Record<string, number> = { guest: 5, basic: 50, advanced: 200, pro: 9999 };
const planPrices: Record<string, { name: string; amount: number }> = {
  basic: { name: "Nova Assist Basic", amount: 900 },
  advanced: { name: "Nova Assist Advanced", amount: 1900 },
  pro: { name: "Nova Assist Pro", amount: 3900 },
};

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

function createTrialEndDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date;
}

// ── Auth middleware ─────────────────────────────────────────────────
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      uid?: string;
      userEmail?: string;
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : null;
}

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!isFirebaseAdminConfigured()) {
    return res.status(500).json({
      success: false,
      code: "AUTH_NOT_CONFIGURED",
      message: "Server authentication is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON in server/.env.",
    });
  }
  const token = extractToken(req);
  if (!token) return res.status(401).json({ success: false, message: "Missing Authorization bearer token" });
  try {
    const decoded = await verifyIdToken(token);
    req.uid = decoded.uid;
    req.userEmail = decoded.email || "";
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired sign-in token" });
  }
}

async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token && isFirebaseAdminConfigured()) {
    try {
      const decoded = await verifyIdToken(token);
      req.uid = decoded.uid;
      req.userEmail = decoded.email || "";
    } catch {
      // Invalid token on an optional route -> treat as anonymous guest.
    }
  }
  next();
}

function requireOwnUserId(req: Request, res: Response, next: NextFunction) {
  if (req.params.userId !== req.uid) {
    return res.status(403).json({ success: false, message: "You cannot access another user's data" });
  }
  next();
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const me = await AppUser.findOne({ userId: req.uid });
  if (!me || me.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
}

// ── AI chat (real provider, streaming) ─────────────────────────────
const MODE_PROMPTS: Record<string, string> = {
  chat: "",
  writing: "Focus on excellent writing quality: tone, grammar, clarity, and structure. Offer to refine drafts further.",
  study: "Act as a patient tutor. Break concepts into simple steps and check the learner's understanding.",
  research: "Give thorough, well-organized, research-style answers. You do not have live web access, so never invent citations, statistics, or URLs — say so plainly if the user needs live sources.",
  code: "Act as an expert software engineer. Give correct, runnable code in fenced code blocks with the right language tag, explain key decisions briefly, and call out edge cases or bugs.",
  business: "Act as a business strategy assistant: structured, practical, and numbers-aware.",
  document: "Help analyze or summarize document content the user pastes or describes. If no content was shared yet, ask for it.",
  slides: "Help outline presentations as a clear list of slides, each with a title and key bullet points.",
  ideas: "Brainstorm diverse, creative ideas and organize them clearly under short headings.",
  content: "Write polished, ready-to-publish content (blog posts, social posts, newsletters) tailored to the requested audience and platform.",
};

const BASE_SYSTEM_PROMPT =
  "You are Nova Assist AI, a helpful, honest, and friendly assistant. " +
  "Always reply in the same language and script the user just used: natural Bangla (Bengali script) if they wrote in Bangla, " +
  "natural Banglish (Bengali phonetically spelled in Latin letters) if they wrote in Banglish, and English if they wrote in English or another language. " +
  "Never mix scripts within a reply unless the user did. Use Markdown (headings, lists, fenced code blocks with a language tag) when it improves readability. " +
  "Be concise but complete, and say plainly when you are not sure about something instead of guessing.";

const MAX_HISTORY_MESSAGES = 30;
const guestUsage = new Map<string, { day: string; count: number }>();

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", bn: "Bangla (Bengali script)", hi: "Hindi", ar: "Arabic", es: "Spanish",
  fr: "French", zh: "Chinese", ja: "Japanese", ko: "Korean", pt: "Portuguese", de: "German",
  ru: "Russian", tr: "Turkish", ur: "Urdu",
};

function buildSystemPrompt(mode?: string, language?: string): string {
  const extra = mode ? MODE_PROMPTS[mode] : "";
  const languageName = language && language !== "auto" ? LANGUAGE_NAMES[language] : undefined;
  const languageOverride = languageName ? `The user has manually selected ${languageName} as their preferred reply language. Reply in ${languageName} regardless of the language they typed in.` : "";
  return [BASE_SYSTEM_PROMPT, extra, languageOverride].filter(Boolean).join("\n\n");
}

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Nova Assist AI backend running",
    aiProvider: AI_PROVIDER,
    aiConfigured: AI_PROVIDER === "gemini" ? !!GEMINI_API_KEY : !!OPENAI_API_KEY,
    authConfigured: isFirebaseAdminConfigured(),
  });
});

app.post("/api/chat", optionalAuth, async (req: Request, res: Response) => {
  const { messages, mode, model, language } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ success: false, message: "messages array is required" });
  }
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== "user" || !String(lastMessage.content || "").trim()) {
    return res.status(400).json({ success: false, message: "The last message must be a non-empty user message" });
  }

  const activeKey = AI_PROVIDER === "openai" ? OPENAI_API_KEY : GEMINI_API_KEY;
  if (!activeKey) {
    return res.status(503).json({
      success: false,
      code: "NO_PROVIDER",
      message: `No AI provider is configured on the server. Set ${AI_PROVIDER === "openai" ? "OPENAI_API_KEY" : "GEMINI_API_KEY"} in server/.env.`,
    });
  }

  // ── Usage / plan enforcement ──
  let appUser: InstanceType<typeof AppUser> | null = null;
  const uid = req.uid;

  if (uid) {
    appUser = await AppUser.findOne({ userId: uid });
    if (!appUser) {
      appUser = await AppUser.create({
        userId: uid,
        email: req.userEmail || "",
        plan: "basic",
        trialStartDate: new Date(),
        trialEndDate: createTrialEndDate(),
        dailyUsage: 0,
        messageCount: 0,
        lastUsageReset: todayKey(),
        lastLoginAt: new Date(),
      });
    }
    const today = todayKey();
    if (appUser.lastUsageReset !== today) {
      appUser.dailyUsage = 0;
      appUser.lastUsageReset = today;
    }
    const limit = planMessageLimits[appUser.plan] ?? planMessageLimits.guest;
    if (appUser.dailyUsage >= limit) {
      return res.status(429).json({ success: false, code: "USAGE_LIMIT", message: "You reached your plan's daily message limit. Upgrade for more messages." });
    }
  } else {
    const ip = req.ip || "unknown";
    const today = todayKey();
    const rec = guestUsage.get(ip);
    if (!rec || rec.day !== today) guestUsage.set(ip, { day: today, count: 0 });
    const current = guestUsage.get(ip)!;
    if (current.count >= planMessageLimits.guest) {
      return res.status(429).json({ success: false, code: "USAGE_LIMIT", message: "Guest daily limit reached. Sign in for more messages." });
    }
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (payload: Record<string, unknown>) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  let closed = false;
  req.on("close", () => {
    closed = true;
  });

  try {
    const history: ChatTurn[] = messages
      .filter((m: unknown): m is { role: string; content: string } => {
        const msg = m as { role?: unknown; content?: unknown };
        return !!msg && typeof msg.content === "string" && (msg.role === "user" || msg.role === "assistant");
      })
      .slice(-MAX_HISTORY_MESSAGES)
      .map((m) => ({ role: m.role as ChatTurn["role"], content: m.content }));

    const systemPrompt = buildSystemPrompt(typeof mode === "string" ? mode : undefined, typeof language === "string" ? language : undefined);
    const generator =
      AI_PROVIDER === "openai"
        ? streamOpenAIChat({ apiKey: activeKey, modelId: model, messages: history, systemPrompt })
        : streamGeminiChat({ apiKey: activeKey, modelId: model, messages: history, systemPrompt });

    for await (const chunk of generator) {
      if (closed) break;
      send({ type: "delta", text: chunk });
    }

    if (!closed) {
      if (uid && appUser) {
        appUser.dailyUsage += 1;
        appUser.messageCount += 1;
        await appUser.save();
      } else {
        const ip = req.ip || "unknown";
        const current = guestUsage.get(ip);
        if (current) current.count += 1;
      }
      send({ type: "done" });
    }
  } catch (error) {
    const classified = error instanceof AIProviderError ? error : classifyProviderError(error);
    console.error("AI provider error:", classified.code, classified.message);
    if (!closed) {
      send({ type: "error", code: classified.code, message: classified.message });
    }
  } finally {
    res.end();
  }
});

// ── Users / profile (MongoDB is the single source of truth) ────────
app.post("/api/users/sync", requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, profileImage } = req.body || {};
    const userId = req.uid!;
    const now = new Date();
    const resetKey = todayKey();
    let user = await AppUser.findOne({ userId });
    if (!user) {
      user = await AppUser.create({
        userId,
        name: name || "User",
        email: req.userEmail || "",
        profileImage: profileImage || "",
        plan: "basic",
        trialStartDate: now,
        trialEndDate: createTrialEndDate(),
        dailyUsage: 0,
        messageCount: 0,
        lastUsageReset: resetKey,
        lastLoginAt: now,
      });
    } else {
      const updates: Record<string, unknown> = {
        name: name || user.name,
        email: req.userEmail || user.email,
        profileImage: profileImage || user.profileImage,
        lastLoginAt: now,
      };
      if (user.lastUsageReset !== resetKey) {
        updates.dailyUsage = 0;
        updates.lastUsageReset = resetKey;
      }
      user = await AppUser.findOneAndUpdate({ userId }, updates, { new: true });
    }
    res.json(user);
  } catch {
    res.status(500).json({ success: false, message: "Could not sync user" });
  }
});

app.get("/api/users/:userId", requireAuth, requireOwnUserId, async (req: Request, res: Response) => {
  try {
    const user = await AppUser.findOne({ userId: req.params.userId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json(user);
  } catch {
    res.status(500).json({ success: false, message: "Could not load user" });
  }
});

app.get("/api/admin/users", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const users = await AppUser.find().sort({ lastLoginAt: -1 }).limit(500);
    res.json(users);
  } catch {
    res.status(500).json({ success: false, message: "Could not load users" });
  }
});

// ── Payments (Stripe) ────────────────────────────────────────────────
app.post("/api/payments/apply-basic-coupon", requireAuth, async (req: Request, res: Response) => {
  try {
    const { coupon } = req.body || {};
    const userId = req.uid!;
    if (!coupon) return res.status(400).json({ success: false, message: "coupon is required" });
    if (String(coupon).trim().toUpperCase() !== BASIC_FREE_COUPON.toUpperCase()) {
      return res.status(400).json({ success: false, message: "Invalid coupon code" });
    }
    const user = await AppUser.findOneAndUpdate(
      { userId },
      { plan: "basic", dailyUsage: 0, subscriptionStatus: "free_coupon" },
      { new: true, upsert: true }
    );
    await BillingHistory.create({ userId, email: user.email, plan: "basic", amount: 0, status: "free_coupon" });
    res.json({ success: true, message: "Basic plan activated for free", user });
  } catch {
    res.status(500).json({ success: false, message: "Could not apply coupon" });
  }
});

app.post("/api/payments/create-checkout-session", requireAuth, async (req: Request, res: Response) => {
  try {
    const { plan, coupon } = req.body || {};
    const userId = req.uid!;
    const email = req.userEmail || req.body?.email;
    if (!planPrices[plan]) return res.status(400).json({ success: false, message: "Invalid plan" });

    if (plan === "basic" && String(coupon || "").trim().toUpperCase() === BASIC_FREE_COUPON.toUpperCase()) {
      const user = await AppUser.findOneAndUpdate(
        { userId },
        { plan: "basic", dailyUsage: 0, subscriptionStatus: "free_coupon" },
        { new: true, upsert: true }
      );
      await BillingHistory.create({ userId, email: user.email, plan: "basic", amount: 0, status: "free_coupon" });
      return res.json({ success: true, free: true, user, redirectUrl: `${CLIENT_URL}/payment-success?plan=basic` });
    }

    if (!stripe) return res.status(500).json({ success: false, message: "Stripe is not configured on the server" });
    const selectedPlan = planPrices[plan];
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [{ price_data: { currency: "usd", product_data: { name: selectedPlan.name }, recurring: { interval: "month" }, unit_amount: selectedPlan.amount }, quantity: 1 }],
      metadata: { userId, plan },
      success_url: `${CLIENT_URL}/payment-success?plan=${plan}`,
      cancel_url: `${CLIENT_URL}/pricing?cancelled=true`,
      allow_promotion_codes: true,
    });
    res.json({ success: true, url: session.url });
  } catch {
    res.status(500).json({ success: false, message: "Could not create checkout session" });
  }
});

app.get("/api/payments/billing-history/:userId", requireAuth, requireOwnUserId, async (req: Request, res: Response) => {
  try {
    const history = await BillingHistory.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(history);
  } catch {
    res.status(500).json({ success: false, message: "Could not load billing history" });
  }
});

app.post("/api/payments/cancel-subscription", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.uid!;
    const user = await AppUser.findOne({ userId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (stripe && user.stripeSubscriptionId) await stripe.subscriptions.cancel(user.stripeSubscriptionId);
    user.plan = "basic";
    user.subscriptionStatus = "cancelled";
    user.stripeSubscriptionId = undefined;
    await user.save();
    await BillingHistory.create({ userId, email: user.email, plan: "basic", amount: 0, status: "cancelled" });
    res.json({ success: true, user });
  } catch {
    res.status(500).json({ success: false, message: "Could not cancel subscription" });
  }
});

// Stripe is the only writer of plan/subscription state for paid upgrades, verified via signature.
app.post("/api/payments/webhook", async (req: Request, res: Response) => {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) return res.status(400).send("Stripe webhook not configured");
  const signature = req.headers["stripe-signature"];
  try {
    const event = stripe.webhooks.constructEvent(req.body, signature as string, STRIPE_WEBHOOK_SECRET);
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId || "";
      const plan = session.metadata?.plan || "basic";
      await AppUser.findOneAndUpdate(
        { userId },
        { plan, subscriptionStatus: "active", stripeCustomerId: String(session.customer || ""), stripeSubscriptionId: String(session.subscription || "") },
        { new: true, upsert: true }
      );
      await BillingHistory.create({ userId, email: session.customer_email || "", plan, amount: session.amount_total || 0, status: "paid", stripeSessionId: session.id, stripeCustomerId: String(session.customer || ""), stripeSubscriptionId: String(session.subscription || "") });
    }
    res.json({ received: true });
  } catch {
    res.status(400).send("Webhook verification failed");
  }
});

// ── Chats ────────────────────────────────────────────────────────────
app.get("/api/chats/:userId", requireAuth, requireOwnUserId, async (req: Request, res: Response) => {
  try {
    const chats = await Chat.find({ userId: req.params.userId }).sort({ updatedAt: -1 });
    res.json(chats);
  } catch {
    res.status(500).json({ success: false, message: "Could not load chats" });
  }
});

app.post("/api/chats", requireAuth, async (req: Request, res: Response) => {
  try {
    const chat = await Chat.create({ ...req.body, userId: req.uid });
    res.status(201).json(chat);
  } catch {
    res.status(500).json({ success: false, message: "Could not create chat" });
  }
});

app.put("/api/chats/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const existing = await Chat.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Chat not found" });
    if (existing.userId !== req.uid) return res.status(403).json({ success: false, message: "You cannot modify another user's chat" });
    const { userId: _ignored, ...updateBody } = req.body || {};
    const updated = await Chat.findByIdAndUpdate(req.params.id, updateBody, { new: true, runValidators: true });
    res.json(updated);
  } catch {
    res.status(500).json({ success: false, message: "Could not update chat" });
  }
});

app.delete("/api/chats/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const existing = await Chat.findById(req.params.id);
    if (!existing) return res.json({ success: true });
    if (existing.userId !== req.uid) return res.status(403).json({ success: false, message: "You cannot delete another user's chat" });
    await Chat.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: "Could not delete chat" });
  }
});

app.use((_req, res) => res.status(404).json({ success: false, message: "API route not found" }));

async function startServer() {
  try {
    await connectDatabase(MONGODB_URI);
    if (!isFirebaseAdminConfigured()) {
      console.warn(
        "\n[nova-assist-ai] FIREBASE_SERVICE_ACCOUNT_JSON is not set.\n" +
        "All authenticated routes (/api/chats, /api/users, /api/payments/*) will return 500 until it is configured.\n"
      );
    }
    const activeKey = AI_PROVIDER === "openai" ? OPENAI_API_KEY : GEMINI_API_KEY;
    if (!activeKey) {
      console.warn(`\n[nova-assist-ai] No API key set for AI_PROVIDER="${AI_PROVIDER}". /api/chat will return 503 until it is configured.\n`);
    }
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

startServer();
