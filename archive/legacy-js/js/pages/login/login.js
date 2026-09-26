/**
 * X-29 Page Controller: Login Authentication (login.js)
 *
 * Responsibilities:
 * 1. Checks URL query parameters for error flags (e.g. ?error=denied).
 * 2. Fetches Firebase configuration and initializes Firebase via FirebaseService.
 * 3. Route Guard: checks active admin session (ris2k29@gmail.com) and auto-redirects to index.html.
 * 4. Form Submission: handles credentials authentication via AuthService / FirebaseService.
 * 5. Error Management: displays user-friendly authentication error notifications.
 */

(function (global) {
    'use strict';

    const window = global;

    async function initLoginPage() {
        if (typeof document === 'undefined') return;
        const loginForm = document.getElementById('login-form');
        if (!loginForm) return;

        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const btnSubmit = document.getElementById('btn-submit');
        const spinner = document.getElementById('spinner');
        const errorBanner = document.getElementById('error-banner');
        const errorMessage = document.getElementById('error-message');

        function showError(msg) {
            if (errorMessage) errorMessage.textContent = msg;
            if (errorBanner) errorBanner.classList.remove('hidden');
        }

        function hideError() {
            if (errorBanner) errorBanner.classList.add('hidden');
        }

        // Show error banner if redirected with error flag
        if (typeof window.location !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('error') === 'denied') {
                showError("Access denied. X-29 is private.");
            }
        }

        // Load configurations & Initialize Firebase
        const fbService = (typeof window !== 'undefined' && window.FirebaseService)
            ? window.FirebaseService
            : (typeof FirebaseService !== 'undefined' ? FirebaseService : null);

        if (fbService && typeof fbService.fetchConfig === 'function') {
            try {
                const config = await fbService.fetchConfig();
                if (typeof fbService.init === 'function') {
                    fbService.init(config);
                    console.log("Firebase initialized for login.");
                }
            } catch (e) {
                console.error("Firebase init error:", e);
                showError("Firebase initialization failed.");
                return;
            }
        }

        // Route guard checking if user is already logged in as admin
        const authProvider = (typeof window !== 'undefined' && window.AuthService)
            ? window.AuthService
            : fbService;

        if (authProvider && typeof authProvider.onAuthStateChanged === 'function') {
            authProvider.onAuthStateChanged((user) => {
                if (user && (user.email || '').trim().toLowerCase() === 'ris2k29@gmail.com') {
                    if (typeof window.location !== 'undefined') {
                        window.location.href = 'index.html';
                    }
                }
            });
        }

        // Handle Form Submission
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError();

            const email = emailInput ? emailInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value : '';

            if (btnSubmit) btnSubmit.disabled = true;
            if (spinner) spinner.classList.remove('hidden');

            try {
                if (!authProvider || typeof authProvider.login !== 'function') {
                    throw new Error("Authentication service is unavailable.");
                }

                const userCredential = await authProvider.login(email, password);
                const user = userCredential.user;

                if ((user.email || '').trim().toLowerCase() !== 'ris2k29@gmail.com') {
                    if (typeof authProvider.logout === 'function') {
                        await authProvider.logout();
                    }
                    showError("Access denied. X-29 is private.");
                    if (btnSubmit) btnSubmit.disabled = false;
                    if (spinner) spinner.classList.add('hidden');
                } else {
                    if (typeof window.location !== 'undefined') {
                        window.location.href = 'index.html';
                    }
                }
            } catch (error) {
                console.error("Auth error:", error);
                let friendlyMsg = "Authentication failed. Please check your credentials.";
                if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                    friendlyMsg = "Invalid email or password.";
                } else if (error.code === 'auth/invalid-email') {
                    friendlyMsg = "Invalid email address format.";
                } else if (error.code === 'auth/user-disabled') {
                    friendlyMsg = "This user account has been disabled.";
                }
                showError(friendlyMsg);
                if (btnSubmit) btnSubmit.disabled = false;
                if (spinner) spinner.classList.add('hidden');
            }
        });
    }

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initLoginPage);
        } else {
            initLoginPage();
        }
    }

    if (typeof window !== 'undefined') {
        window.initLoginPage = initLoginPage;
    }
    if (typeof global !== 'undefined') {
        global.initLoginPage = initLoginPage;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { initLoginPage };
    }

})(typeof window !== 'undefined' ? window : global);
