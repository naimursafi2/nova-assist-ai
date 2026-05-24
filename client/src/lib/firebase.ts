import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAmBKyt9WIq0oo6erBV02El2CRWX8HUMe4",
  authDomain: "nova-ai-4a15a.firebaseapp.com",
  databaseURL: "https://nova-ai-4a15a-default-rtdb.firebaseio.com",
  projectId: "nova-ai-4a15a",
  storageBucket: "nova-ai-4a15a.firebasestorage.app",
  messagingSenderId: "679663583912",
  appId: "1:679663583912:web:870e469aee1d43945ef89d",
  measurementId: "G-SJ942EK444",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();
