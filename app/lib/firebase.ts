import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// Optional: import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC4SgiWxqW0MuTwq7ATy_T1-Fuv1xyzbWc",
  authDomain: "vbs-zimmersda.firebaseapp.com",
  projectId: "vbs-zimmersda",
  storageBucket: "vbs-zimmersda.firebasestorage.app",
  messagingSenderId: "758292136650",
  appId: "1:758292136650:web:90aae316176e43e69aaa33",
  measurementId: "G-9MCP516Q44",
  databaseURL: "https://vbs-zimmersda-default-rtdb.firebaseio.com", // Added for Realtime Database
};

// Initialize Firebase (only once)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const database = getDatabase(app);

// Optional: analytics only on client side
// const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

export { database };