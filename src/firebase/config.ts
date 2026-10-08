import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Web app's Firebase configuration provided by the user
export const firebaseConfig = {
  apiKey: "AIzaSyCCNktYZYOSCCsCtmjPCV6RWPdhAsi-XI0",
  authDomain: "vyuma-2d9e1.firebaseapp.com",
  projectId: "vyuma-2d9e1",
  storageBucket: "vyuma-2d9e1.firebasestorage.app",
  messagingSenderId: "766988651599",
  appId: "1:766988651599:web:1a7a3301657db74a622e3a",
  measurementId: "G-6YTEMB8RS3"
};

// Initialize Firebase safely
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
