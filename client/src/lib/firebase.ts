import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Firebase is used for authentication (Google sign-in) ONLY.
// User profile, plan, usage, chats, and billing all live in MongoDB via the
// Express API (see server/src/index.ts) so there is a single source of truth.
const firebaseConfig = {
  apiKey: "AIzaSyAmBKyt9WIq0oo6erBV02El2CRWX8HUMe4",
  authDomain: "nova-ai-4a15a.firebaseapp.com",
  projectId: "nova-ai-4a15a",
  storageBucket: "nova-ai-4a15a.firebasestorage.app",
  messagingSenderId: "679663583912",
  appId: "1:679663583912:web:870e469aee1d43945ef89d",
  measurementId: "G-SJ942EK444",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
