import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isNew = getApps().length === 0;
const app = isNew ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);

// NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true のときのみエミュレータに接続する。
// NODE_ENV 判定だと npm run dev から実 Firebase Auth（stg）に接続する手段がなくなるため、
// 明示的なフラグで切り替える。
if (isNew && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true") {
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
}

export default app;
