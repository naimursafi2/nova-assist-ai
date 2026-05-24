import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "";

app.use(cors());
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

const messageSchema = new mongoose.Schema({
  role: String,
  content: String,
  timestamp: String,
});

const chatSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
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

const Chat = mongoose.model("Chat", chatSchema);

app.get("/api/health", (_, res) => {
  res.json({ success: true, message: "Nova Assist AI backend running" });
});

app.get("/api/chats/:userId", async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.params.userId }).sort({ updatedAt: -1 });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ success: false, message: "চ্যাট লোড করা যায়নি" });
  }
});

app.post("/api/chats", async (req, res) => {
  try {
    const chat = await Chat.create(req.body);
    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ success: false, message: "চ্যাট তৈরি করা যায়নি" });
  }
});

app.put("/api/chats/:id", async (req, res) => {
  try {
    const updated = await Chat.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ success: false, message: "চ্যাট আপডেট করা যায়নি" });
  }
});

app.delete("/api/chats/:id", async (req, res) => {
  try {
    await Chat.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "চ্যাট ডিলিট করা যায়নি" });
  }
});

async function startServer() {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI পাওয়া যায়নি");
    }

    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

startServer();
