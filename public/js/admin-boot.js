/* ===== Arranque del panel =====
   Muestra la pantalla de carga (#boot) hasta confirmar la sesión con Firebase.
   Si hay usuario → muestra el panel (#app-body); si no → redirige al login. */
import { auth } from './firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';

const boot = document.getElementById('boot');
const app = document.getElementById('app-body');
const msg = document.getElementById('bootMsg');

// Aviso si Firebase tarda demasiado (conexión / error de red).
const slowTimer = setTimeout(() => {
  msg.textContent = 'Esto tarda más de lo normal. Revisa tu conexión a internet o abre la consola (F12) para ver el error.';
}, 7000);

try {
  onAuthStateChanged(auth, (user) => {
    clearTimeout(slowTimer);
    if (user) {
      boot.hidden = true;
      app.hidden = false;
    } else {
      msg.textContent = 'Redirigiendo al inicio de sesión…';
      window.location.replace('login.html');
    }
  });
} catch (e) {
  clearTimeout(slowTimer);
  console.error('Fallo al iniciar Firebase:', e);
  msg.textContent = 'No se pudo conectar con Firebase: ' + ((e && e.message) || e);
}
