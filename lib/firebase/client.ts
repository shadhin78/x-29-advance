/**
 * X-29 Modular Firebase Client SDK (lib/firebase/client.ts)
 * 
 * Strict Client-Side Firebase v12 initialization using modular APIs.
 * Does NOT use Firebase Compat.
 * Safe for Next.js SSR / hydration environments.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyD7kXQe7ovTuBlcWYGJpi678idYFdSHUWs",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "x-29-advance.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "x-29-advance",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "x-29-advance.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "277295985303",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:277295985303:web:4c36a1105fa16e8aa16fd2"
};

// Singleton initialization (Auth only - Firestore isolated in lib/firebase/firestore.ts)
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth: Auth = getAuth(app);

export default app;
