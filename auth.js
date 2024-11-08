console.log("from Auth");

// Importiere `auth` aus `firebase.js`, um die initialisierte Authentifizierungsinstanz zu verwenden
import { auth } from "./firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// Registrierung eines neuen Benutzers
async function register(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Benutzer registriert:", userCredential.user);
  } catch (error) {
    console.error("Fehler bei der Registrierung:", error.message);
  }
}

// Anmeldung eines Benutzers
async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Benutzer angemeldet:", userCredential.user);
  } catch (error) {
    console.error("Fehler bei der Anmeldung:", error.message);
  }
}

// Abmeldung des aktuellen Benutzers
async function logout() {
  try {
    await signOut(auth);
    console.log("Benutzer abgemeldet");
  } catch (error) {
    console.error("Fehler bei der Abmeldung:", error.message);
  }
}

// Funktionen als globale Funktionen verfügbar machen, damit die Buttons sie aufrufen können
window.handleRegister = function() {
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;
  register(email, password);
};

window.handleLogin = function() {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  login(email, password);
};

window.handleLogout = function() {
  logout();
};
