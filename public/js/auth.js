import { auth } from './firebase.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// ===== Auto-cierre de sesión por inactividad (solo en el panel) =====
const INACTIVITY_LIMIT_MS = 3 * 60 * 1000; // 3 minutos
let inactivityTimer = null;
let inactivityWired = false;

function triggerInactivityLogout() {
    // Marca el motivo ANTES de salir, por si la redirección pierde el query param.
    try { sessionStorage.setItem('mb-logout-reason', 'inactividad'); } catch (e) {}
    signOut(auth).finally(() => {
        window.location.replace('login.html?reason=inactividad');
    });
}

function startInactivityWatch() {
    if (inactivityWired) return;
    inactivityWired = true;
    const reset = () => {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(triggerInactivityLogout, INACTIVITY_LIMIT_MS);
    };
    ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click', 'wheel']
        .forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
    reset(); // arranca el conteo
}

// Check authentication state across the app
onAuthStateChanged(auth, (user) => {
    const path = window.location.pathname;
    const isLoginPage = /login/i.test(path);
    // Any page under /admin that isn't the login page is the protected dashboard.
    // This covers both /admin/ (directory index) and /admin/index.html.
    const isAdminDashboard = path.includes('/admin') && !isLoginPage;

    if (user) {
        // User is signed in.
        if (isLoginPage) {
            // Redirect to the admin dashboard
            window.location.href = 'index.html';
        } else if (isAdminDashboard) {
            // Inicia el vigilante de inactividad en el panel protegido.
            startInactivityWatch();
        }
    } else {
        // User is signed out.
        if (isAdminDashboard) {
            window.location.href = 'login.html';
        }
    }
});

// Setup Login Form Listener if we are on the login page
document.addEventListener('DOMContentLoaded', () => {
    // Aviso de cierre por inactividad en la pantalla de login
    const noticeBox = document.getElementById('notice');
    const noticeText = document.getElementById('notice-text');
    if (noticeBox && noticeText) {
        let reason = new URLSearchParams(window.location.search).get('reason');
        if (!reason) { try { reason = sessionStorage.getItem('mb-logout-reason'); } catch (e) {} }
        if (reason === 'inactividad') {
            noticeText.textContent = 'Tu sesión se cerró por inactividad. Vuelve a ingresar.';
            noticeBox.classList.remove('hidden');
            try { sessionStorage.removeItem('mb-logout-reason'); } catch (e) {}
        }
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const loginBtn = document.getElementById('login-btn');
            const errorBox = document.getElementById('error-message');
            const errorText = document.getElementById('error-text');

            // Reset UI
            errorBox.classList.add('hidden');
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">refresh</span> Ingresando...';

            try {
                // Attempt Login
                await signInWithEmailAndPassword(auth, email, password);
                // Redirigir de inmediato al panel (no depender solo de onAuthStateChanged)
                window.location.replace('index.html');
                return;
            } catch (error) {
                // Handle Errors
                console.error("Login failed:", error);
                errorBox.classList.remove('hidden');
                
                // Friendly error messages
                if (error.code === 'auth/invalid-credential') {
                    errorText.innerText = 'Correo o contraseña incorrectos.';
                } else if (error.code === 'auth/too-many-requests') {
                    errorText.innerText = 'Demasiados intentos. Intenta más tarde.';
                } else {
                    errorText.innerText = 'Error al iniciar sesión. Verifica tus datos.';
                }

                // Restore Button
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<span class="material-symbols-outlined">login</span> Iniciar Sesión';
            }
        });
    }

    // Setup Logout Buttons (sidebar on PC + topbar on mobile)
    const logoutBtns = document.querySelectorAll('.js-logout, #logout-btn');
    logoutBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            signOut(auth).then(() => {
                window.location.replace('login.html');
            }).catch((error) => {
                console.error("Error signing out:", error);
            });
        });
    });
});
