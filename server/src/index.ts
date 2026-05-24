import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:8080";
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const BASIC_FREE_COUPON = process.env.BASIC_FREE_COUPON || "NOVA-BASIC-FREE";
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-12-18.acacia" }) : null;

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

const messageSchema = new mongoose.Schema(
  {
    id: String,
    role: {
      type: String,
      enum: ["user", "ai", "assistant", "system"],
      required: true,
    },
    content: {
      type: String,
      default: "",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    files: Array,
    images: Array,
    sources: Array,
  },
  { _id: false }
);

const chatSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    folder: {
      type: String,
      default: "All",
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    starred: {
      type: Boolean,
      default: false,
    },
    messages: [messageSchema],
  },
  {
    timestamps: true,
  }
);

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: { type: String, default: "User" },
    email: { type: String, default: "" },
    profileImage: { type: String, default: "" },
    plan: {
      type: String,
      enum: ["guest", "basic", "advanced", "pro"],
      default: "basic",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    trialStartDate: Date,
    trialEndDate: Date,
    dailyUsage: { type: Number, default: 0 },
    messageCount: { type: Number, default: 0 },
    lastUsageReset: String,
    lastLoginAt: Date,
  },
  { timestamps: true }
);

const Chat = mongoose.model("Chat", chatSchema);
const AppUser = mongoose.model("AppUser", userSchema);

const planMessageLimits: Record<string, number> = {
  guest: 5,
  basic: 50,
  advanced: 200,
  pro: 9999,
};

const planPrices: Record<string, { name: string; amount: number }> = {
  basic: { name: "Aura Basic", amount: 900 },
  advanced: { name: "Aura Advanced", amount: 2900 },
  pro: { name: "Aura Pro", amount: 9900 },
};

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

function createTrialEndDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date;
}

app.get("/api/health", (_, res) => {
  res.json({ success: true, message: "Nova Assist AI backend running" });
});

app.post("/api/users/sync", async (req, res) => {
  try {
    const { userId, name, email, profileImage } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: "userId প্রয়োজন" });

    const now = new Date();
    const resetKey = todayKey();
    let user = await AppUser.findOne({ userId });

    if (!user) {
      user = await AppUser.create({
        userId,
        name: name || "User",
        email: email || "",
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
        email: email || user.email,
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
    res.status(500).json({ success: false, message: "ইউজার sync করা যায়নি" });
  }
});

app.get("/api/users/:userId", async (req, res) => {
  try {
    const user = await AppUser.findOne({ userId: req.params.userId });
    if (!user) return res.status(404).json({ success: false, message: "ইউজার পাওয়া যায়নি" });
    res.json(user);
  } catch {
    res.status(500).json({ success: false, message: "ইউজার লোড করা যায়নি" });
  }
});

app.post("/api/users/:userId/usage", async (req, res) => {
  try {
    const user = await AppUser.findOne({ userId: req.params.userId });
    if (!user) return res.status(404).json({ success: false, message: "ইউজার পাওয়া যায়নি" });

    const limit = planMessageLimits[user.plan] || planMessageLimits.guest;
    if (user.dailyUsage >= limit) {
      return res.status(429).json({ success: false, message: "আজকের ব্যবহার সীমা শেষ" });
    }

    user.dailyUsage += 1;
    user.messageCount += 1;
    await user.save();
    res.json({ success: true, user });
  } catch {
    res.status(500).json({ success: false, message: "ব্যবহার আপডেট করা যায়নি" });
  }
});

app.patch("/api/users/:userId/plan", async (req, res) => {
  try {
    const { plan } = req.body;
    if (!planMessageLimits[plan]) return res.status(400).json({ success: false, message: "ভুল plan" });

    const user = await AppUser.findOneAndUpdate({ userId: req.params.userId }, { plan }, { new: true });
    res.json(user);
  } catch {
    res.status(500).json({ success: false, message: "plan আপডেট করা যায়নি" });
  }
});

app.post("/api/payments/apply-basic-coupon", async (req, res) => {
  try {
    const { userId, coupon } = req.body;
    if (!userId || !coupon) return res.status(400).json({ success: false, message: "userId এবং coupon প্রয়োজন" });

    if (coupon.trim().toUpperCase() !== BASIC_FREE_COUPON.toUpperCase()) {
      return res.status(400).json({ success: false, message: "ভুল coupon code" });
    }

    const user = await AppUser.findOneAndUpdate(
      { userId },
      { plan: "basic", dailyUsage: 0 },
      { new: true, upsert: false }
    );

    if (!user) return res.status(404).json({ success: false, message: "ইউজার পাওয়া যায়নি" });
    res.json({ success: true, message: "Basic plan free activated", user });
  } catch {
    res.status(500).json({ success: false, message: "coupon apply করা যায়নি" });
  }
});

app.post("/api/payments/create-checkout-session", async (req, res) => {
  try {
    const { plan, userId, email, coupon } = req.body;
    if (!planPrices[plan]) return res.status(400).json({ success: false, message: "ভুল plan" });

    if (plan === "basic" && coupon?.trim().toUpperCase() === BASIC_FREE_COUPON.toUpperCase()) {
      const user = await AppUser.findOneAndUpdate(
        { userId },
        { plan: "basic", dailyUsage: 0 },
        { new: true }
      );
      return res.json({ success: true, free: true, user, redirectUrl: `${CLIENT_URL}/payment-success?plan=basic` });
    }

    if (!stripe) return res.status(500).json({ success: false, message: "Stripe key সেট করা হয়নি" });

    const selectedPlan = planPrices[plan];
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: selectedPlan.name },
            recurring: { interval: "month" },
            unit_amount: selectedPlan.amount,
          },
          quantity: 1,
        },
      ],
      metadata: { userId: userId || "", plan },
      success_url: `${CLIENT_URL}/payment-success?plan=${plan}`,
      cancel_url: `${CLIENT_URL}/pricing?cancelled=true`,
      allow_promotion_codes: true,
    });

    res.json({ success: true, url: session.url });
  } catch {
    res.status(500).json({ success: false, message: "checkout তৈরি করা যায়নি" });
  }
});

app.get("/api/chats/:userId", async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.params.userId }).sort({ updatedAt: -1 });
    res.json(chats);
  } catch {
    res.status(500).json({ success: false, message: "চ্যাট লোড করা যায়নি" });
  }
});

app.post("/api/chats", async (req, res) => {
  try {
    const chat = await Chat.create(req.body);
    res.status(201).json(chat);
  } catch {
    res.status(500).json({ success: false, message: "চ্যাট তৈরি করা যায়নি" });
  }
});

app.put("/api/chats/:id", async (req, res) => {
  try {
    const updated = await Chat.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ success: false, message: "চ্যাট পাওয়া যায়নি" });
    res.json(updated);
  } catch {
    res.status(500).json({ success: false, message: "চ্যাট আপডেট করা যায়নি" });
  }
});

app.delete("/api/chats/:id", async (req, res) => {
  try {
    await Chat.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: "চ্যাট ডিলিট করা যায়নি" });
  }
});

app.use((_, res) => {
  res.status(404).json({ success: false, message: "API route পাওয়া যায়নি" });
});

async function startServer() {
  try {
    if (!MONGO_URI) throw new Error("MONGO_URI পাওয়া যায়নি");
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected successfully");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

startServer();
