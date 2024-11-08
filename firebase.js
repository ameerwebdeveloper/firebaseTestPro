console.log("firebase.js");

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// Firebase-Konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyB8af0a2TmEVm4i3E02PZ2tXRHMc7Ih69c",
  authDomain: "dabubble382.firebaseapp.com",
  projectId: "dabubble382",
  storageBucket: "dabubble382.firebasestorage.app",
  messagingSenderId: "1025519789933",
  appId: "1:1025519789933:web:641a80f3ee273246159c64",
  measurementId: "G-0SYEDTFX53"
};

// Firebase initialisieren
const app = initializeApp(firebaseConfig);

// Firestore und Auth initialisieren und exportieren
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };

