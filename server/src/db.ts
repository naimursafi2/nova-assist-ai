import mongoose from "mongoose";

export async function connectDatabase(mongoUri: string): Promise<{ ephemeral: boolean }> {
  if (mongoUri) {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected (persistent storage).");
    return { ephemeral: false };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("MONGO_URI is required in production. Set it in the server environment.");
  }

  console.warn(
    "\n[nova-assist-ai] MONGO_URI is not set.\n" +
    "Starting an EPHEMERAL in-memory MongoDB for local development only.\n" +
    "Chats, users, and billing history will be LOST when the server restarts.\n" +
    "Set MONGO_URI in server/.env (e.g. a MongoDB Atlas connection string) for real persistence.\n"
  );

  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri());
  return { ephemeral: true };
}
