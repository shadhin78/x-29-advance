/**
 * X-29 Module: utils/storage.js
 * Safe wrapper for LocalStorage with dedicated namespace isolation ('x29_adv_')
 * and in-memory fallback to prevent cross-contamination and storage errors.
 */

export const safeStorage = {
    PREFIX: 'x29_adv_',
    fallbackStore: {},

    _k: function(key) {
        return String(key).startsWith(this.PREFIX) ? key : this.PREFIX + key;
    },

    getItem: function(key) {
        const namespacedKey = this._k(key);
        try {
            return localStorage.getItem(namespacedKey);
        } catch (e) {
            console.warn(`localStorage.getItem failed for key "${namespacedKey}":`, e);
            return this.fallbackStore[namespacedKey] || null;
        }
    },

    setItem: function(key, value) {
        const namespacedKey = this._k(key);
        try {
            localStorage.setItem(namespacedKey, value);
        } catch (e) {
            console.warn(`localStorage.setItem failed for key "${namespacedKey}":`, e);
            this.fallbackStore[namespacedKey] = String(value);
        }
    },

    removeItem: function(key) {
        const namespacedKey = this._k(key);
        try {
            localStorage.removeItem(namespacedKey);
        } catch (e) {
            console.warn(`localStorage.removeItem failed for key "${namespacedKey}":`, e);
            delete this.fallbackStore[namespacedKey];
        }
    },

    clearNamespace: function() {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith(this.PREFIX)) {
                    keysToRemove.push(k);
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
        } catch (e) {
            console.warn("localStorage clearNamespace failed:", e);
        }
        this.fallbackStore = {};
    }
};

// Global window compatibility bridge
if (typeof window !== 'undefined') {
    window.safeStorage = safeStorage;
}
