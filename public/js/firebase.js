import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { initializeAppCheck, ReCaptchaV3Provider, ReCaptchaEnterpriseProvider } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app-check.js";

// La apiKey de Firebase web es PÚBLICA por diseño (solo identifica el proyecto).
// La seguridad real está en las reglas de Firestore + (opcional) App Check.
const firebaseConfig = {
  apiKey: "AIzaSyDNaVvH2WEnB4sFBPKAHeELKW6dw9bc4EQ",
  authDomain: "miami-brooss.firebaseapp.com",
  projectId: "miami-brooss",
  storageBucket: "miami-brooss.firebasestorage.app",
  messagingSenderId: "793922881800",
  appId: "1:793922881800:web:78676dc37ed79db1ebc4bd"
};

const app = initializeApp(firebaseConfig);

/* ============================================================
   APP CHECK (protege la API del proyecto contra abuso externo)
   ------------------------------------------------------------
   Queda INACTIVO hasta que pegues tu clave de sitio reCAPTCHA v3.
   Pasos para activarlo (una sola vez):
   1) Firebase Console → Build → App Check → apps → Web → reCAPTCHA v3.
      Te da una "clave de sitio" (site key). Pégala abajo en RECAPTCHA_SITE_KEY.
   2) (Solo para probar en localhost) En la consola del navegador verás un
      "debug token": agrégalo en App Check → Apps → Manage debug tokens.
   3) Cuando confirmes que la web y el panel siguen funcionando, en App Check
      pon Firestore en modo "Enforce" (Aplicar).
   Mientras RECAPTCHA_SITE_KEY esté vacío, no se inicializa nada (no rompe el sitio).
   ============================================================ */
// Site key PÚBLICA de reCAPTCHA (no el "secreto"). App Check en el navegador usa esta.
const RECAPTCHA_SITE_KEY = "6Le159stAAAAAOVyQirviRUf8cvdpJyfTUhiJrK2";
// Tipo de clave: "v3" (reCAPTCHA v3 clásico) o "enterprise" (Fraud Defense / reCAPTCHA Enterprise).
// La app está registrada con Fraud Defense → "enterprise".
const RECAPTCHA_TYPE = "enterprise";

// App Check se inicializa SOLO en producción (no en localhost).
// Motivo: en localhost el debug token se regenera y, si no está registrado, App Check
// devuelve 403 y tumba la conexión a Firestore (modo offline). En desarrollo no hace falta.
// En producción protege la API con reCAPTCHA Enterprise / Fraud Defense.
const isLocalhost = ["localhost", "127.0.0.1", ""].includes(location.hostname);
if (RECAPTCHA_SITE_KEY && !isLocalhost) {
  try {
    const provider = RECAPTCHA_TYPE === "enterprise"
      ? new ReCaptchaEnterpriseProvider(RECAPTCHA_SITE_KEY)
      : new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY);
    initializeAppCheck(app, { provider, isTokenAutoRefreshEnabled: true });
  } catch (e) {
    console.error("No se pudo iniciar App Check:", e);
  }
}

const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
