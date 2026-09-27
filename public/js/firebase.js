import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDNaVvH2WEnB4sFBPKAHeELKW6dw9bc4EQ",
  authDomain: "miami-brooss.firebaseapp.com",
  projectId: "miami-brooss",
  storageBucket: "miami-brooss.firebasestorage.app",
  messagingSenderId: "793922881800",
  appId: "1:793922881800:web:78676dc37ed79db1ebc4bd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { db, storage, auth };
