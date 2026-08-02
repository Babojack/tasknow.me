/**
 * firebase.js - Firebase app initialization.
 *
 * Reads config from Vite env vars (see .env.example). All VITE_FIREBASE_*
 * values come from: Firebase Console -> Project settings -> General ->
 * "Your apps" -> Web app -> SDK setup and configuration -> Config.
 */
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  // Fails loudly in dev so a missing .env is obvious instead of causing
  // confusing downstream Firebase errors.
  console.error(
    "[firebase] Missing VITE_FIREBASE_* environment variables. Copy .env.example to .env and fill in your Firebase project config."
  );
}

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
// Note: file storage is NOT Firebase Storage - uploads go to a custom PHP
// endpoint on Hostinger instead (see src/api/firebaseClient.js UploadFile
// and public/upload.php). Firebase is only used here for Auth + Firestore.
export const googleProvider = new GoogleAuthProvider();
