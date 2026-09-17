/**
 * X-29 Service Module: services/auth.js
 * Decoupled Authentication Service & Session Lifecycle Management
 *
 * Responsibilities:
 * 1. User Authentication:
 *    - Email/password credential authentication (`login`).
 *    - Persistence configuration (LOCAL persistence).
 *    - Mock credentials fallback for offline/file:// runtime.
 * 2. Session Teardown & Purge:
 *    - Clean sign-out (`logout`).
 *    - Executes registered listener and persistence teardown hooks.
 *    - Purges user caches from browser storage (localStorage & sessionStorage).
 *    - Resets in-memory workspace AppState to empty default.
 * 3. User Resolution:
 *    - `getCurrentUser()` via Firebase Auth instance, storage cache, or mock provider.
 * 4. Auth State Synchronization:
 *    - `onAuthStateChanged()` observer with subscriber registry and cleanup tokens.
 *    - Syncs `local_auth_user` cache for instant boot restoration.
 */

(function (global) {
    'use strict';

    function getStorage() {
        if (typeof global.safeStorage !== 'undefined') return global.safeStorage;
        if (typeof safeStorage !== 'undefined') return safeStorage;
        return {
            getItem: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
            setItem: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
            removeItem: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
        };
    }

    const AuthService = {
        _authListeners: [],
        _logoutHooks: [],

        /**
         * Registers a teardown hook to execute during logout (e.g. listener stops, timer clears).
         * @param {Function} hookFn
         * @returns {Function} Unregister function
         */
        registerLogoutHook: function (hookFn) {
            if (typeof hookFn === 'function' && !this._logoutHooks.includes(hookFn)) {
                this._logoutHooks.push(hookFn);
            }
            return () => {
                this.unregisterLogoutHook(hookFn);
            };
        },

        /**
         * Unregisters a previously registered logout teardown hook.
         * @param {Function} hookFn
         */
        unregisterLogoutHook: function (hookFn) {
            this._logoutHooks = this._logoutHooks.filter(fn => fn !== hookFn);
        },

        /**
         * Resolves the current authenticated user reference.
         * @returns {Object|null}
         */
        getCurrentUser: function () {
            const fb = typeof global.firebase !== 'undefined' ? global.firebase : (typeof firebase !== 'undefined' ? firebase : null);
            if (fb && fb.auth && fb.auth().currentUser) {
                return fb.auth().currentUser;
            }

            const storage = getStorage();
            const cached = storage.getItem('local_auth_user');
            if (cached) {
                try {
                    const user = JSON.parse(cached);
                    if (user && user.uid && user.uid !== 'mock-local-user-id') {
                        return user;
                    }
                } catch (e) {}
            }

            if (typeof location !== 'undefined' && location.protocol === 'file:') {
                return { email: 'ris2k29@gmail.com', uid: 'file_protocol_local_user', displayName: 'ris2k29 (Local)' };
            }

            return null;
        },

        /**
         * Authenticates user using email and password credentials.
         * @param {string} email
         * @param {string} password
         * @returns {Promise<Object>}
         */
        login: async function (email, password) {
            const cleanEmail = (email || '').trim().toLowerCase();
            const storage = getStorage();

            if (typeof location !== 'undefined' && location.protocol === 'file:') {
                console.log("[AuthService] Firebase login mocked under file:// protocol.");
                if (cleanEmail === 'ris2k29@gmail.com' && password === '787898') {
                    const localUser = { email: 'ris2k29@gmail.com', uid: 'file_protocol_local_user', displayName: 'ris2k29 (Local)' };
                    storage.setItem('local_auth_user', JSON.stringify(localUser));
                    this._notifyAuthListeners(localUser);
                    return { user: localUser };
                }
                throw { code: 'auth/wrong-password', message: 'Invalid email or password.' };
            }

            const fb = typeof global.firebase !== 'undefined' ? global.firebase : (typeof firebase !== 'undefined' ? firebase : null);
            if (fb && fb.auth) {
                try {
                    await fb.auth().setPersistence(fb.auth.Auth.Persistence.LOCAL);
                    const res = await fb.auth().signInWithEmailAndPassword(cleanEmail, password);
                    if (res && res.user) {
                        const userObj = {
                            email: res.user.email,
                            uid: res.user.uid,
                            displayName: res.user.displayName || res.user.email
                        };
                        storage.setItem('local_auth_user', JSON.stringify(userObj));
                        this._notifyAuthListeners(res.user);
                    }
                    return res;
                } catch (fbErr) {
                    console.warn("[AuthService] Sign-in failed:", fbErr);
                    throw fbErr;
                }
            }

            throw { code: 'auth/wrong-password', message: 'Invalid email or password.' };
        },

        /**
         * Dispatches current user status to all active listeners.
         * @param {Object|null} user
         * @private
         */
        _notifyAuthListeners: function (user) {
            if (this._authListeners && this._authListeners.length > 0) {
                this._authListeners.forEach(cb => {
                    try { cb(user); } catch (e) {
                        console.warn("[AuthService] Listener notification error:", e);
                    }
                });
            }
        },

        /**
         * Logs out current session, triggers teardown hooks, purges storage, and resets state.
         * @returns {Promise<void>}
         */
        logout: async function () {
            console.log("[AuthService] LOGOUT_INITIATED");

            // 1. Execute all registered teardown hooks (e.g. stop Firestore snapshot listeners, clear debounce timers)
            if (Array.isArray(this._logoutHooks)) {
                this._logoutHooks.forEach(hook => {
                    try { hook(); } catch (e) {
                        console.warn("[AuthService] Error in logout teardown hook:", e);
                    }
                });
            }

            // 2. Purge user-specific application data from browser storage
            const storage = getStorage();
            const keysToRemove = [
                'local_app_state',
                'appState',
                'cached_fullAppState',
                'cached_examSessions',
                'cached_examRoutine',
                'cached_selectedCountdownExamId',
                'local_auth_user'
            ];
            keysToRemove.forEach(k => storage.removeItem(k));

            try {
                if (typeof sessionStorage !== 'undefined') {
                    sessionStorage.clear();
                }
            } catch (e) {}

            // 3. Reset in-memory AppState to clean empty default
            if (typeof global.applyFullAppState === 'function' && typeof global.getDefaultAppState === 'function') {
                global.applyFullAppState(global.getDefaultAppState(), false, true);
            }

            const appState = global.AppState || (typeof AppState !== 'undefined' ? AppState : null);
            if (appState) {
                appState.cloudDocumentExists = null;
                appState.hasLoadedFromCloud = false;
                appState.isLocalDirty = false;
            }

            console.log("[AuthService] LOGOUT_CACHE_CLEARED - User cache and memory state purged.");
            this._notifyAuthListeners(null);

            if (typeof location !== 'undefined' && location.protocol === 'file:') {
                console.log("[AuthService] Logout completed under file:// protocol.");
                return;
            }

            const fb = typeof global.firebase !== 'undefined' ? global.firebase : (typeof firebase !== 'undefined' ? firebase : null);
            if (fb && fb.auth) {
                try {
                    await fb.auth().signOut();
                } catch (e) {
                    console.warn("[AuthService] Firebase signOut error:", e);
                }
            }
        },

        /**
         * Subscribes to authentication state changes.
         * @param {Function} callback
         * @returns {Function} Unsubscribe function
         */
        onAuthStateChanged: function (callback) {
            if (!this._authListeners) this._authListeners = [];
            this._authListeners.push(callback);

            const storage = getStorage();

            if (typeof location !== 'undefined' && location.protocol === 'file:') {
                setTimeout(() => {
                    callback({
                        email: 'ris2k29@gmail.com',
                        uid: 'file_protocol_local_user',
                        displayName: 'ris2k29 (Local)'
                    });
                }, 50);
                return () => {
                    this._authListeners = this._authListeners.filter(cb => cb !== callback);
                };
            }

            const fb = typeof global.firebase !== 'undefined' ? global.firebase : (typeof firebase !== 'undefined' ? firebase : null);
            if (fb && fb.auth) {
                const unsubscribe = fb.auth().onAuthStateChanged((user) => {
                    if (user) {
                        storage.setItem('local_auth_user', JSON.stringify({
                            email: user.email,
                            uid: user.uid,
                            displayName: user.displayName || user.email
                        }));
                        callback(user);
                    } else {
                        storage.removeItem('local_auth_user');
                        callback(null);
                    }
                });
                return () => {
                    this._authListeners = this._authListeners.filter(cb => cb !== callback);
                    if (typeof unsubscribe === 'function') unsubscribe();
                };
            } else {
                const localUser = this.getCurrentUser();
                setTimeout(() => callback(localUser), 50);
                return () => {
                    this._authListeners = this._authListeners.filter(cb => cb !== callback);
                };
            }
        },

        /**
         * Populates and opens the Account Settings modal.
         */
        openAccountSettingsModal: function () {
            const user = (typeof this.getCurrentUser === 'function' && this.getCurrentUser()) || global.currentUser || { displayName: 'ris2k29', email: 'ris2k29@gmail.com' };
            const nameInput = document.getElementById('account-input-name');
            const emailInput = document.getElementById('account-input-email');

            if (nameInput) nameInput.value = user.displayName || '';
            if (emailInput) emailInput.value = user.email || '';

            if (typeof global.openModal === 'function') {
                global.openModal('account-settings-modal');
            }
        },

        /**
         * Validates, saves, and syncs account settings updates.
         */
        submitAccountUpdate: function () {
            const nameInput = document.getElementById('account-input-name');
            const emailInput = document.getElementById('account-input-email');
            if (!nameInput || !emailInput) return;

            const newName = nameInput.value.trim();
            const newEmail = emailInput.value.trim();

            const toast = typeof global.showToast === 'function' ? global.showToast : console.log;

            if (!newName) {
                toast("Display Name cannot be empty.", "error");
                return;
            }
            if (!newEmail || !newEmail.includes('@')) {
                toast("Please enter a valid email address.", "error");
                return;
            }

            if (global.currentUser) {
                global.currentUser.displayName = newName;
                global.currentUser.email = newEmail;
            } else {
                global.currentUser = { displayName: newName, email: newEmail };
            }

            const profileNameEl = document.getElementById('profile-name');
            const profileEmailEl = document.getElementById('profile-email');
            const profileAvatarEl = document.getElementById('profile-avatar');
            if (profileNameEl) profileNameEl.textContent = newName;
            if (profileEmailEl) profileEmailEl.textContent = newEmail;
            if (profileAvatarEl) {
                profileAvatarEl.textContent = newName.charAt(0).toUpperCase();
            }

            const fbUser = typeof this.getCurrentUser === 'function' ? this.getCurrentUser() : null;
            if (fbUser && typeof fbUser.updateProfile === 'function') {
                fbUser.updateProfile({
                    displayName: newName
                }).catch(err => console.warn("Firebase updateProfile failed:", err));
            }

            const storage = getStorage();
            storage.setItem('local_auth_user', JSON.stringify({
                email: newEmail,
                uid: fbUser ? fbUser.uid : 'local-user',
                displayName: newName
            }));

            if (typeof global.closeModal === 'function') {
                global.closeModal('account-settings-modal');
            }
            toast("Account settings updated successfully.", "success");
        },

        handleLogout: async function () {
            try {
                await this.logout();
            } catch (e) {
                console.warn("[AuthService] Error during logout:", e);
            } finally {
                if (typeof window !== 'undefined' && window.location) {
                    window.location.href = 'login.html';
                }
            }
        },

        initAuthEventListeners: function () {
            if (typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;
            if (global._authListenersInitialized) return;
            global._authListenersInitialized = true;

            document.addEventListener('click', (e) => {
                if (e.target.closest('#btn-logout, #btn-logout-relocated, [data-logout-btn]')) {
                    e.preventDefault();
                    this.handleLogout();
                    return;
                }
                if (e.target.closest('#profile-card-btn, [data-account-settings-trigger]')) {
                    e.preventDefault();
                    this.openAccountSettingsModal();
                    return;
                }
                if (e.target.closest('#btn-submit-account-update, #asm-save-btn, [data-submit-account-update]')) {
                    e.preventDefault();
                    this.submitAccountUpdate();
                    return;
                }
            });
        }
    };

    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => AuthService.initAuthEventListeners());
        } else {
            AuthService.initAuthEventListeners();
        }
    }

    function setLoadingProgress(pct, statusText) {
        if (typeof document === 'undefined') return;
        const bar = document.getElementById('auth-loading-bar');
        const text = document.getElementById('auth-loading-text');
        if (bar) bar.style.width = pct + '%';
        if (text) text.textContent = statusText || 'Loading Application...';
    }

    // Global window attachment
    global.AuthService = AuthService;
    global.setLoadingProgress = setLoadingProgress;
    global.openAccountSettingsModal = function () {
        return AuthService.openAccountSettingsModal();
    };
    global.submitAccountUpdate = function () {
        return AuthService.submitAccountUpdate();
    };
    global.handleLogout = function () {
        return AuthService.handleLogout();
    };

    // Node / CommonJS module export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = AuthService;
    }
})(typeof window !== 'undefined' ? window : globalThis);
