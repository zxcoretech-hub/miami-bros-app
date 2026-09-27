import { auth } from './firebase.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// Check authentication state across the app
onAuthStateChanged(auth, (user) => {
    const isLoginPage = window.location.pathname.includes('login.html');
    const isAdminPage = window.location.pathname.includes('/admin/');

    if (user) {
        // User is signed in.
        if (isLoginPage) {
            // If they are on the login page but already signed in, redirect to dashboard
            window.location.href = 'index.html';
        }
    } else {
        // User is signed out.
        if (isAdminPage && !isLoginPage) {
            // If they try to access admin panel without being signed in, kick them out
            window.location.href = 'login.html';
        }
    }
});

// Setup Login Form Listener if we are on the login page
document.addEventListener('DOMContentLoaded', () => {
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
                // The onAuthStateChanged listener will automatically redirect to index.html
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

    // Setup Logout Button if we are on the dashboard
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth).then(() => {
                // Sign-out successful. onAuthStateChanged will handle redirect.
            }).catch((error) => {
                console.error("Error signing out:", error);
            });
        });
    }
});
