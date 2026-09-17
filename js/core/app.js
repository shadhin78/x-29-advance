/**
 * X-29 Application Core Entry Point (js/core/app.js)
 * Native ES Module bootstrapper and lifecycle orchestrator.
 *
 * Responsibilities:
 * 1. Initialize core state: AppState verification, hydration, and migration
 * 2. Initialize authentication: Firebase configuration and admin auth route guard
 * 3. Initialize required services: Focus Timer, PWA installation lifecycle, date rollover monitor
 * 4. Initialize navigation: Router binding and page switching
 * 5. Initialize current feature: Initial view mount (Dashboard)
 */

import '../state.js';
import '../services/auth.js';
import '../firebase.js';
import '../../shared/services/timerService.js';
import '../../router/router.js';
import '../features/dashboard/dashboard.js';
import './rollover.js';

export const App = {
    isInitialized: false,

    /**
     * 1. Initialize core state
     */
    initCoreState() {
        if (typeof window !== 'undefined' && typeof window.migrateLegacyData === 'function') {
            window.migrateLegacyData();
        }
        if (typeof window !== 'undefined' && window.AppState) {
            window.AppState.isAppInitialized = false;
        }
    },

    /**
     * 2. Initialize authentication and cloud synchronization
     */
    async initAuth() {
        const authProvider = (typeof window !== 'undefined' && window.AuthService)
            ? window.AuthService
            : (typeof window !== 'undefined' ? window.FirebaseService : null);

        if (!authProvider) {
            console.warn('[App] AuthService / FirebaseService unavailable.');
            return;
        }

        // Fetch config & initialize Firebase
        try {
            if (typeof window !== 'undefined' && window.FirebaseService && typeof window.FirebaseService.fetchConfig === 'function') {
                const config = await window.FirebaseService.fetchConfig();
                if (typeof window.setLoadingProgress === 'function') {
                    window.setLoadingProgress(40, 'Connecting to server...');
                }
                window.FirebaseService.init(config);
                if (typeof window.setLoadingProgress === 'function') {
                    window.setLoadingProgress(55, 'Authenticating session...');
                }
            }
        } catch (e) {
            console.error('[App] Firebase init failed:', e);
        }

        // Auth state observer / Route guard
        if (typeof authProvider.onAuthStateChanged === 'function') {
            authProvider.onAuthStateChanged(async (user) => {
                if (!user) {
                    if (typeof window !== 'undefined' && window.location) {
                        window.location.href = 'login.html';
                    }
                    return;
                }

                const userEmail = (user.email || '').trim().toLowerCase();
                if (userEmail !== 'ris2k29@gmail.com') {
                    if (typeof authProvider.logout === 'function') {
                        await authProvider.logout();
                    }
                    if (typeof window !== 'undefined' && window.location) {
                        window.location.href = 'login.html?error=denied';
                    }
                    return;
                }

                // Authorized admin session
                console.log('[App] Admin authorized:', user.email);
                if (typeof window !== 'undefined') {
                    window.currentUser = user;
                }
                if (typeof window !== 'undefined' && typeof window.setLoadingProgress === 'function') {
                    window.setLoadingProgress(70, 'Loading cloud workspace...');
                }

                // Update user profile DOM elements
                if (typeof document !== 'undefined') {
                    const displayName = user.displayName || 'ris2k29';
                    const displayEmail = user.email;

                    const profileNameEl = document.getElementById('profile-name');
                    const profileEmailEl = document.getElementById('profile-email');
                    const profileAvatarEl = document.getElementById('profile-avatar');
                    if (profileNameEl) profileNameEl.textContent = displayName;
                    if (profileEmailEl) profileEmailEl.textContent = displayEmail;
                    if (profileAvatarEl) {
                        profileAvatarEl.textContent = displayName.charAt(0).toUpperCase();
                    }

                    // Dismiss loading overlay
                    if (typeof window !== 'undefined' && typeof window.dismissLoadingScreen === 'function') {
                        window.dismissLoadingScreen();
                    } else {
                        const loadingEl = document.getElementById('auth-loading');
                        const wrapperEl = document.getElementById('app-wrapper');
                        if (loadingEl) loadingEl.remove();
                        if (wrapperEl) wrapperEl.classList.remove('hidden');
                    }
                }

                // Subscribe and sync from cloud
                if (typeof window !== 'undefined' && window.FirebaseService && typeof window.FirebaseService.loadFromCloud === 'function') {
                    window.FirebaseService.loadFromCloud();
                }

                if (typeof window !== 'undefined' && window.AppState) {
                    window.AppState.isAppInitialized = true;
                }

                // Mount current / initial feature
                this.initCurrentFeature();
            });
        }
    },

    /**
     * 3. Initialize required services (Timer, PWA, Rollover, Tooltips)
     */
    initServices() {
        if (typeof window === 'undefined' || typeof document === 'undefined') return;

        // Loading screen safety fallback timer (3s max)
        setTimeout(() => {
            if (typeof window.dismissLoadingScreen === 'function') {
                window.dismissLoadingScreen();
            } else {
                const loadingEl = document.getElementById('auth-loading');
                const wrapperEl = document.getElementById('app-wrapper');
                if (loadingEl) loadingEl.remove();
                if (wrapperEl) wrapperEl.classList.remove('hidden');
            }
        }, 3000);

        // Focus Timer Service
        if (window.TimerService && typeof window.TimerService.init === 'function') {
            window.TimerService.init();
        }

        // Global tooltips dismissal on click
        document.addEventListener('click', () => {
            if (typeof window.hideChapterTooltip === 'function') window.hideChapterTooltip();
            if (typeof window.hideSubjectChapterTooltip === 'function') window.hideSubjectChapterTooltip();
            if (typeof window.hideSpectraChapterTooltip === 'function') window.hideSpectraChapterTooltip();
        });

        // PWA Installation Lifecycle
        let deferredPrompt = null;
        const installBtn = document.getElementById('pwa-install-btn');

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            if (installBtn) {
                installBtn.classList.remove('hidden');
                installBtn.classList.add('flex');
            }
            console.log('[PWA] beforeinstallprompt event fired.');
        });

        if (installBtn) {
            installBtn.addEventListener('click', async () => {
                if (!deferredPrompt) return;
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`[PWA] User response to install prompt: ${outcome}`);
                if (outcome === 'accepted') {
                    installBtn.classList.add('hidden');
                    installBtn.classList.remove('flex');
                }
                deferredPrompt = null;
            });
        }

        window.addEventListener('appinstalled', () => {
            console.log('[PWA] X-29 was installed successfully!');
            if (installBtn) {
                installBtn.classList.add('hidden');
                installBtn.classList.remove('flex');
            }
            if (typeof window.showToast === 'function') {
                window.showToast('X-29 Installed Successfully!', 'success');
            }
        });

        // Date rollover monitor & cross-tab synchronization
        if (typeof window !== 'undefined' && typeof window.initRollover === 'function') {
            window.initRollover();
        } else if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible' && typeof window.checkAndRefreshDateChange === 'function') {
                    window.checkAndRefreshDateChange();
                }
            });
        }
    },

    /**
     * 4. Initialize navigation & Router
     */
    initNavigation() {
        if (typeof window !== 'undefined' && window.Router && typeof window.Router.init === 'function') {
            window.Router.init();
        }
    },

    /**
     * 5. Initialize current feature
     */
    initCurrentFeature() {
        if (typeof window !== 'undefined') {
            if (typeof window.switchPage === 'function') {
                window.switchPage('dashboard');
            } else if (window.Router && typeof window.Router.loadPage === 'function') {
                window.Router.loadPage('dashboard');
            }
        }
    },

    /**
     * Master Bootstrapper
     */
    async init() {
        if (typeof document !== 'undefined' && !document.getElementById('app-wrapper')) return;
        if (this.isInitialized) return;
        this.isInitialized = true;

        if (typeof window !== 'undefined' && typeof window.setLoadingProgress === 'function') {
            window.setLoadingProgress(15, 'Initializing workspace...');
        }

        this.initCoreState();
        this.initServices();
        this.initNavigation();
        await this.initAuth();
    }
};

// Global environment attachment
if (typeof window !== 'undefined') {
    window.App = App;
}

// Auto-boot on DOM readiness
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => App.init());
    } else {
        App.init();
    }
}

// CommonJS compatibility for test runners
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}

export default App;
