import mongoose from "mongoose";

export async function connectDatabase(mongoUri: string): Promise<{ ephemeral: boolean }> {
  if (mongoUri) {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected (persistent storage).");
    return { ephemeral: false };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("MONGODB_URI is missing. Set it in the server environment (e.g. Render's Environment settings).");
  }

  console.warn(
    "\n[nova-assist-ai] MONGODB_URI is not set.\n" +
    "Starting an EPHEMERAL in-memory MongoDB for local development only.\n" +
    "Chats, users, and billing history will be LOST when the server restarts.\n" +
    "Set MONGODB_URI in server/.env (e.g. a MongoDB Atlas connection string) for real persistence.\n"
  );

  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri());
  return { ephemeral: true };
}
