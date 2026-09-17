/**
 * Test Suite for Phase 2 / Step 13:
 * Application Core Native ES Module Entry Point (js/core/app.js)
 */

const assert = require('assert');

// 1. Mock DOM and Global Environment
class MockElement {
    constructor(id = '', tagName = 'div') {
        this.id = id;
        this.tagName = tagName.toUpperCase();
        this.value = '';
        this.innerHTML = '';
        this.textContent = '';
        this.className = '';
        this.classList = {
            classes: new Set(),
            add(...cls) { cls.forEach(c => this.classes.add(c)); },
            remove(...cls) { cls.forEach(c => this.classes.delete(c)); },
            contains(c) { return this.classes.has(c); },
            toggle(c) { if (this.contains(c)) this.remove(c); else this.add(c); }
        };
        this.style = {};
        this.children = [];
        this.eventListeners = {};
    }

    addEventListener(event, callback) {
        if (!this.eventListeners[event]) this.eventListeners[event] = [];
        this.eventListeners[event].push(callback);
    }

    dispatchEvent(e) {
        if (!e) return true;
        const listeners = this.eventListeners[e.type] || [];
        listeners.forEach(cb => cb(e));
        return true;
    }
}

const elements = new Map();
function getOrCreateElement(id, tagName = 'div') {
    if (!elements.has(id)) {
        elements.set(id, new MockElement(id, tagName));
    }
    return elements.get(id);
}

// Pre-create required shell elements
['app-wrapper', 'auth-loading', 'profile-name', 'profile-email', 'profile-avatar', 'pwa-install-btn'].forEach(id => getOrCreateElement(id));

const documentListeners = {};
global.document = {
    getElementById: (id) => elements.get(id) || null,
    querySelector: (sel) => {
        if (sel.startsWith('#')) return elements.get(sel.slice(1)) || null;
        return null;
    },
    addEventListener: (event, callback) => {
        if (!documentListeners[event]) documentListeners[event] = [];
        documentListeners[event].push(callback);
    },
    readyState: 'complete'
};

const windowListeners = {};
global.window = {
    location: { href: 'index.html' },
    addEventListener: (event, callback) => {
        if (!windowListeners[event]) windowListeners[event] = [];
        windowListeners[event].push(callback);
    },
    document: global.document
};
global.window.window = global.window;

// 2. Load App module
const RawApp = require('../js/core/app.js');
const App = RawApp.App || RawApp.default || RawApp;

let passedTests = 0;
let totalTests = 0;

function it(desc, fn) {
    totalTests++;
    try {
        fn();
        passedTests++;
        console.log(`  ✓ ${desc}`);
    } catch (err) {
        console.error(`  ✗ ${desc}`);
        console.error(err);
    }
}

console.log('\n==================================================');
console.log('RUNNING SUITE: Phase 2 / Step 13 Application Core Module (app.js)');
console.log('==================================================\n');

// ----------------------------------------------------
// 1. Module Definition & Interface
// ----------------------------------------------------
console.log('1. Module Definition & Interface');

it('App object is properly exported with all required lifecycle methods', () => {
    assert(App, 'App module must be defined');
    assert.strictEqual(typeof App.initCoreState, 'function', 'initCoreState must be a function');
    assert.strictEqual(typeof App.initAuth, 'function', 'initAuth must be a function');
    assert.strictEqual(typeof App.initServices, 'function', 'initServices must be a function');
    assert.strictEqual(typeof App.initNavigation, 'function', 'initNavigation must be a function');
    assert.strictEqual(typeof App.initCurrentFeature, 'function', 'initCurrentFeature must be a function');
    assert.strictEqual(typeof App.init, 'function', 'init must be a function');
});

// ----------------------------------------------------
// 2. Core State Initialization
// ----------------------------------------------------
console.log('\n2. Core State Initialization');

it('initCoreState runs legacy migration and resets initialization flag', () => {
    let migrateCalled = 0;
    global.window.migrateLegacyData = () => { migrateCalled++; };
    global.window.AppState = { isAppInitialized: true };

    App.initCoreState();

    assert.strictEqual(migrateCalled, 1, 'migrateLegacyData should be called during initCoreState');
    assert.strictEqual(global.window.AppState.isAppInitialized, false, 'isAppInitialized should be reset to false initially');
});

// ----------------------------------------------------
// 3. Navigation Initialization
// ----------------------------------------------------
console.log('\n3. Navigation & Current Feature');

it('initNavigation initializes Router when available', () => {
    let routerInitCalled = 0;
    global.window.Router = {
        init: () => { routerInitCalled++; }
    };

    App.initNavigation();

    assert.strictEqual(routerInitCalled, 1, 'Router.init must be invoked during initNavigation');
});

it('initCurrentFeature switches to dashboard', () => {
    let switchedPage = null;
    global.window.switchPage = (page) => { switchedPage = page; };

    App.initCurrentFeature();

    assert.strictEqual(switchedPage, 'dashboard', 'initCurrentFeature must switch to dashboard');
});

// ----------------------------------------------------
// 4. Services Initialization
// ----------------------------------------------------
console.log('\n4. Services Initialization');

it('initServices registers TimerService, visibility, and PWA listeners', () => {
    let timerInitCalled = 0;
    global.window.TimerService = {
        init: () => { timerInitCalled++; }
    };

    App.initServices();

    assert.strictEqual(timerInitCalled, 1, 'TimerService.init must be called during initServices');
    assert(windowListeners['beforeinstallprompt'], 'beforeinstallprompt listener must be registered');
    assert(windowListeners['appinstalled'], 'appinstalled listener must be registered');
    assert(documentListeners['visibilitychange'], 'visibilitychange listener must be registered');
    assert(documentListeners['click'], 'click listener for tooltip dismissals must be registered');
});

// ----------------------------------------------------
// 5. Authentication Lifecycle & Route Guard
// ----------------------------------------------------
console.log('\n5. Authentication Lifecycle & Route Guard');

it('initAuth sets up admin session, populates profile, and loads from cloud', async () => {
    let authCallback = null;
    let cloudLoaded = 0;

    global.window.AuthService = {
        onAuthStateChanged: (cb) => { authCallback = cb; }
    };
    global.window.FirebaseService = {
        fetchConfig: async () => ({ apiKey: 'mock' }),
        init: () => {},
        loadFromCloud: () => { cloudLoaded++; }
    };

    await App.initAuth();
    assert(typeof authCallback === 'function', 'onAuthStateChanged callback must be registered');

    // Simulate authenticated admin
    const adminUser = {
        email: 'ris2k29@gmail.com',
        displayName: 'RIS Admin'
    };

    await authCallback(adminUser);

    assert.strictEqual(global.window.currentUser, adminUser, 'currentUser should be set to admin user');
    assert.strictEqual(elements.get('profile-name').textContent, 'RIS Admin', 'Profile name should be updated');
    assert.strictEqual(elements.get('profile-email').textContent, 'ris2k29@gmail.com', 'Profile email should be updated');
    assert.strictEqual(cloudLoaded, 1, 'loadFromCloud should be called for authorized admin');
    assert.strictEqual(global.window.AppState.isAppInitialized, true, 'isAppInitialized should be true after authorized auth');
});

it('initAuth redirects unauthorized user to login.html?error=denied', async () => {
    let authCallback = null;
    let logoutCalled = 0;

    global.window.AuthService = {
        onAuthStateChanged: (cb) => { authCallback = cb; },
        logout: async () => { logoutCalled++; }
    };

    await App.initAuth();

    const unauthorizedUser = {
        email: 'intruder@test.com',
        displayName: 'Intruder'
    };

    await authCallback(unauthorizedUser);

    assert.strictEqual(logoutCalled, 1, 'Unauthorized user should be logged out');
    assert.strictEqual(global.window.location.href, 'login.html?error=denied', 'Unauthorized user should be redirected');
});

it('initAuth redirects unauthenticated session to login.html', async () => {
    let authCallback = null;

    global.window.AuthService = {
        onAuthStateChanged: (cb) => { authCallback = cb; }
    };

    await App.initAuth();
    await authCallback(null);

    assert.strictEqual(global.window.location.href, 'login.html', 'Null session should redirect to login.html');
});

// ----------------------------------------------------
// 6. Bootstrapper Idempotency
// ----------------------------------------------------
console.log('\n6. Bootstrapper Idempotency');

it('App.init() is idempotent and avoids redundant execution', async () => {
    App.isInitialized = true;
    let coreStateRun = 0;
    const origInitCoreState = App.initCoreState;
    App.initCoreState = () => { coreStateRun++; };

    await App.init();

    assert.strictEqual(coreStateRun, 0, 'App.init must not re-execute when already initialized');
    App.initCoreState = origInitCoreState;
});

console.log('\n==================================================');
console.log(`TEST RESULTS: ${passedTests}/${totalTests} tests passed`);
console.log('==================================================\n');

if (passedTests === totalTests) {
    console.log('All tests passed successfully!');
    process.exit(0);
} else {
    console.error(`Failed ${totalTests - passedTests} tests.`);
    process.exit(1);
}
