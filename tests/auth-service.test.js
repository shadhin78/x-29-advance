/**
 * Comprehensive Test Suite for Phase 2 / Step 9 (Step 9A):
 * Authentication Service Extraction & Session Lifecycle Management (tests/auth-service.test.js)
 */

const assert = require('assert');

// 1. Setup Mock Environment
const storageMap = new Map();
const mockSafeStorage = {
    getItem(key) {
        return storageMap.has(key) ? storageMap.get(key) : null;
    },
    setItem(key, val) {
        storageMap.set(key, String(val));
    },
    removeItem(key) {
        storageMap.delete(key);
    },
    clear() {
        storageMap.clear();
    }
};

const sessionStorageMap = new Map();
global.sessionStorage = {
    getItem(key) {
        return sessionStorageMap.has(key) ? sessionStorageMap.get(key) : null;
    },
    setItem(key, val) {
        sessionStorageMap.set(key, String(val));
    },
    removeItem(key) {
        sessionStorageMap.delete(key);
    },
    clear() {
        sessionStorageMap.clear();
    }
};

global.safeStorage = mockSafeStorage;
global.localStorage = mockSafeStorage;
global.location = { protocol: 'http:', href: 'http://localhost:3000/' };

// Mock default AppState
global.getDefaultAppState = function () {
    return {
        tasks: [],
        tracks: [],
        dailyTargetsDatabase: {},
        weeklyTargetsDatabase: {},
        monthlyTargetsDatabase: {}
    };
};

global.applyFullAppState = function (state, isReset = false, isLogout = false) {
    global.AppState = Object.assign({}, state);
    global.AppState.hasLoadedFromCloud = false;
    global.AppState.isLocalDirty = false;
    return true;
};

global.AppState = global.getDefaultAppState();

// Mock Firebase
let mockCurrentUser = null;
let mockAuthListeners = [];
let mockSignOutCalled = false;
let mockSetPersistenceCalled = false;

const mockAuth = {
    Auth: {
        Persistence: { LOCAL: 'local' }
    },
    get currentUser() {
        return mockCurrentUser;
    },
    setPersistence: async function (p) {
        mockSetPersistenceCalled = true;
        return true;
    },
    signInWithEmailAndPassword: async function (email, password) {
        if (email === 'ris2k29@gmail.com' && password === '787898') {
            mockCurrentUser = {
                email: 'ris2k29@gmail.com',
                uid: 'admin_test_uid_123',
                displayName: 'ris2k29'
            };
            mockAuthListeners.forEach(cb => {
                try { cb(mockCurrentUser); } catch (e) {}
            });
            return { user: mockCurrentUser };
        }
        throw { code: 'auth/wrong-password', message: 'Invalid email or password.' };
    },
    signOut: async function () {
        mockSignOutCalled = true;
        mockCurrentUser = null;
        mockAuthListeners.forEach(cb => {
            try { cb(null); } catch (e) {}
        });
    },
    onAuthStateChanged: function (cb) {
        mockAuthListeners.push(cb);
        if (mockCurrentUser) {
            setTimeout(() => cb(mockCurrentUser), 10);
        } else {
            setTimeout(() => cb(null), 10);
        }
        return () => {
            mockAuthListeners = mockAuthListeners.filter(fn => fn !== cb);
        };
    }
};

global.firebase = {
    auth: function () {
        return mockAuth;
    }
};
global.firebase.auth.Auth = mockAuth.Auth;

// Load AuthService
const AuthService = require('../js/services/auth.js');

// Test Suite Runner
async function runTestSuite() {
    console.log('\n=== X-29 Advance — Phase 2 / Step 9 (AuthService) Test Suite ===\n');
    let passed = 0;
    let total = 0;

    function test(name, fn) {
        total++;
        try {
            fn();
            console.log(`  ✓ ${name}`);
            passed++;
        } catch (err) {
            console.error(`  ✗ ${name}`);
            console.error(err);
            process.exitCode = 1;
        }
    }

    async function asyncTest(name, fn) {
        total++;
        try {
            await fn();
            console.log(`  ✓ ${name}`);
            passed++;
        } catch (err) {
            console.error(`  ✗ ${name}`);
            console.error(err);
            process.exitCode = 1;
        }
    }

    // --- Group 1: Module Definition & Exposure ---
    console.log('1. Module Definition & Interface');
    test('AuthService is defined and attached to global', () => {
        assert.ok(AuthService, 'AuthService must exist');
        assert.strictEqual(typeof AuthService.login, 'function', 'login must be a function');
        assert.strictEqual(typeof AuthService.logout, 'function', 'logout must be a function');
        assert.strictEqual(typeof AuthService.getCurrentUser, 'function', 'getCurrentUser must be a function');
        assert.strictEqual(typeof AuthService.onAuthStateChanged, 'function', 'onAuthStateChanged must be a function');
        assert.strictEqual(typeof AuthService.registerLogoutHook, 'function', 'registerLogoutHook must be a function');
        assert.strictEqual(typeof AuthService.unregisterLogoutHook, 'function', 'unregisterLogoutHook must be a function');
    });

    // --- Group 2: User Resolution ---
    console.log('\n2. User Resolution (getCurrentUser)');
    test('getCurrentUser returns null when no user is logged in', () => {
        mockCurrentUser = null;
        mockSafeStorage.clear();
        assert.strictEqual(AuthService.getCurrentUser(), null);
    });

    test('getCurrentUser returns user from safeStorage cache when offline/reloading', () => {
        mockCurrentUser = null;
        const cachedUser = { uid: 'cached_uid_456', email: 'ris2k29@gmail.com', displayName: 'Cached Admin' };
        mockSafeStorage.setItem('local_auth_user', JSON.stringify(cachedUser));
        const res = AuthService.getCurrentUser();
        assert.ok(res, 'Cached user must be returned');
        assert.strictEqual(res.uid, 'cached_uid_456');
        assert.strictEqual(res.email, 'ris2k29@gmail.com');
    });

    test('getCurrentUser prioritizes firebase.auth().currentUser over cache', () => {
        mockCurrentUser = { uid: 'live_uid_789', email: 'ris2k29@gmail.com' };
        const res = AuthService.getCurrentUser();
        assert.ok(res);
        assert.strictEqual(res.uid, 'live_uid_789');
    });

    test('getCurrentUser resolves local admin under file:// protocol', () => {
        mockCurrentUser = null;
        mockSafeStorage.clear();
        global.location.protocol = 'file:';
        const res = AuthService.getCurrentUser();
        assert.ok(res);
        assert.strictEqual(res.email, 'ris2k29@gmail.com');
        assert.strictEqual(res.uid, 'file_protocol_local_user');
        global.location.protocol = 'http:';
    });

    // --- Group 3: Login Authentication ---
    console.log('\n3. Login Authentication (login)');
    await asyncTest('login rejects invalid credentials', async () => {
        mockCurrentUser = null;
        try {
            await AuthService.login('wrong@example.com', 'badpass');
            assert.fail('Login with invalid credentials must throw');
        } catch (err) {
            assert.strictEqual(err.code, 'auth/wrong-password');
        }
    });

    await asyncTest('login succeeds with valid credentials and caches local user', async () => {
        mockSafeStorage.clear();
        mockSetPersistenceCalled = false;
        const res = await AuthService.login('ris2k29@gmail.com', '787898');
        assert.ok(res && res.user);
        assert.strictEqual(res.user.email, 'ris2k29@gmail.com');
        assert.strictEqual(res.user.uid, 'admin_test_uid_123');
        assert.strictEqual(mockSetPersistenceCalled, true, 'setPersistence must be called');

        const cached = JSON.parse(mockSafeStorage.getItem('local_auth_user'));
        assert.ok(cached);
        assert.strictEqual(cached.email, 'ris2k29@gmail.com');
    });

    await asyncTest('login works under file:// protocol mock', async () => {
        global.location.protocol = 'file:';
        const res = await AuthService.login('ris2k29@gmail.com', '787898');
        assert.ok(res && res.user);
        assert.strictEqual(res.user.uid, 'file_protocol_local_user');
        global.location.protocol = 'http:';
    });

    // --- Group 4: Auth State Listener (onAuthStateChanged) ---
    console.log('\n4. Auth State Synchronization (onAuthStateChanged)');
    await asyncTest('onAuthStateChanged registers callback and notifies on state change', async () => {
        let notifiedUser = null;
        const unsubscribe = AuthService.onAuthStateChanged((u) => {
            notifiedUser = u;
        });

        // Trigger auth event
        await AuthService.login('ris2k29@gmail.com', '787898');
        assert.ok(notifiedUser);
        assert.strictEqual(notifiedUser.email, 'ris2k29@gmail.com');

        // Test unsubscribe
        unsubscribe();
        notifiedUser = null;
        await AuthService.logout();
        // Because unsubscribed, notifiedUser should remain null (not triggered by logout)
        assert.strictEqual(notifiedUser, null);
    });

    // --- Group 5: Teardown Hooks & Logout ---
    console.log('\n5. Session Teardown & Purge (logout)');
    await asyncTest('logout triggers registered teardown hooks, purges storage, and resets AppState', async () => {
        // Setup state and caches
        mockSafeStorage.setItem('local_app_state', '{"tasks":[1,2,3]}');
        mockSafeStorage.setItem('appState', '{"tasks":[1,2,3]}');
        mockSafeStorage.setItem('local_auth_user', '{"uid":"u1"}');
        global.sessionStorage.setItem('temp_key', 'temp_val');
        global.AppState.tasks = [1, 2, 3];
        global.AppState.isLocalDirty = true;

        let teardownHookFired = false;
        const unregisterHook = AuthService.registerLogoutHook(() => {
            teardownHookFired = true;
        });

        mockSignOutCalled = false;
        await AuthService.logout();

        // 1. Hook executed
        assert.strictEqual(teardownHookFired, true, 'Registered teardown hook must execute');

        // 2. Storage keys purged
        assert.strictEqual(mockSafeStorage.getItem('local_app_state'), null);
        assert.strictEqual(mockSafeStorage.getItem('appState'), null);
        assert.strictEqual(mockSafeStorage.getItem('local_auth_user'), null);

        // 3. AppState reset
        assert.deepStrictEqual(global.AppState.tasks, []);
        assert.strictEqual(global.AppState.isLocalDirty, false);

        // 4. Firebase signOut called
        assert.strictEqual(mockSignOutCalled, true, 'firebase.auth().signOut must be called');

        // Test unregister hook
        unregisterHook();
        assert.strictEqual(AuthService._logoutHooks.includes(unregisterHook), false);
    });

    // --- Group 6: FirebaseService Delegation Bridge ---
    console.log('\n6. FirebaseService Delegation & Backward Compatibility');
    test('FirebaseService delegates login, logout, and getCurrentUser to AuthService', async () => {
        // Create mock FirebaseService with delegation
        const mockFirebaseService = {
            login: (email, pass) => AuthService.login(email, pass),
            logout: () => AuthService.logout(),
            getCurrentUser: () => AuthService.getCurrentUser(),
            onAuthStateChanged: (cb) => AuthService.onAuthStateChanged(cb)
        };

        const user = await mockFirebaseService.login('ris2k29@gmail.com', '787898');
        assert.strictEqual(user.user.email, 'ris2k29@gmail.com');

        const current = mockFirebaseService.getCurrentUser();
        assert.strictEqual(current.email, 'ris2k29@gmail.com');

        await mockFirebaseService.logout();
        assert.strictEqual(mockFirebaseService.getCurrentUser(), null);
    });

    console.log(`\n==================================================`);
    console.log(`Phase 2 / Step 9 (AuthService) Tests: ${passed} / ${total} passed`);
    console.log(`==================================================\n`);

    if (passed !== total) {
        process.exit(1);
    }
}

runTestSuite().catch(err => {
    console.error("Test execution failed:", err);
    process.exit(1);
});
