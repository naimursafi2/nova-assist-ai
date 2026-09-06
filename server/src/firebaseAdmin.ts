import admin from "firebase-admin";

let initialized = false;
let initFailed = false;

function ensureInitialized(): boolean {
  if (initialized) return true;
  if (initFailed) return false;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    initFailed = true;
    return false;
  }

  try {
    const serviceAccount = JSON.parse(raw);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    initialized = true;
    return true;
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", (error as Error).message);
    initFailed = true;
    return false;
  }
}

export function isFirebaseAdminConfigured(): boolean {
  return ensureInitialized();
}

export async function verifyIdToken(token: string) {
  if (!ensureInitialized()) {
    throw new Error("Firebase Admin SDK is not configured");
  }
  return admin.auth().verifyIdToken(token);
}
