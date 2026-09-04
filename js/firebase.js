/**
 * X-29 Firebase & Data Layer Module
 * Established in window.FirebaseService namespace.
 */

// Private internal helper function to update DOM sync status indicator
function showSync(state) {
    const el = document.getElementById('sync-status');
    const icon = document.getElementById('sync-icon');
    const text = document.getElementById('sync-text');
    if (!el || !icon || !text) return;

    el.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
    el.classList.add('opacity-100', 'scale-100');

    if (state === 'saving') {
        icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />`;
        icon.classList.add('animate-spin', 'text-blue-500');
        icon.classList.remove('text-emerald-500', 'text-red-500', 'text-amber-500', 'text-rose-500');
        text.textContent = 'Saving...'; text.className = 'text-[9px] font-black uppercase tracking-widest text-blue-500';
    } else if (state === 'saved') {
        icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />`;
        icon.classList.remove('animate-spin', 'text-blue-500', 'text-red-500', 'text-amber-500', 'text-rose-500');
        icon.classList.add('text-emerald-500');
        text.textContent = 'Saved'; text.className = 'text-[9px] font-black uppercase tracking-widest text-emerald-500';
        if (window._syncFadeTimer) clearTimeout(window._syncFadeTimer);
        window._syncFadeTimer = setTimeout(() => {
            el.classList.remove('opacity-100', 'scale-100');
            el.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
        }, 1200);
    } else if (state === 'local') {
        icon.innerHTML = `<circle cx="12" cy="12" r="4" fill="currentColor" />`;
        icon.classList.remove('animate-spin', 'text-red-500', 'text-amber-500', 'text-rose-500');
        icon.classList.add('text-blue-400');
        text.textContent = 'Saved Locally'; text.className = 'text-[9px] font-black uppercase tracking-widest text-blue-400';
    } else if (state === 'offline') {
        icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m-2.828-2.828a5 5 0 000-7.072m-2.828 2.828a1 1 0 010 1.414M3 3l18 18" />`;
        icon.classList.remove('animate-spin', 'text-blue-500', 'text-emerald-500', 'text-red-500', 'text-rose-500');
        icon.classList.add('text-amber-500');
        text.textContent = 'Offline (Queued)'; text.className = 'text-[9px] font-black uppercase tracking-widest text-amber-500';
    } else if (state === 'error') {
        icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />`;
        icon.classList.remove('animate-spin', 'text-blue-500', 'text-emerald-500', 'text-amber-500', 'text-rose-500');
        icon.classList.add('text-red-500');
        text.textContent = 'Sync Error'; text.className = 'text-[9px] font-black uppercase tracking-widest text-red-500';
    } else if (state === 'uninitialized') {
        icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />`;
        icon.classList.remove('animate-spin', 'text-blue-500', 'text-emerald-500', 'text-red-500', 'text-rose-500');
        icon.classList.add('text-amber-500');
        text.textContent = 'Not Initialized'; text.className = 'text-[9px] font-black uppercase tracking-widest text-amber-500';
    } else if (state === 'conflict') {
        icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`;
        icon.classList.remove('animate-spin', 'text-blue-500', 'text-emerald-500', 'text-red-500', 'text-amber-500');
        icon.classList.add('text-rose-500');
        text.textContent = 'Sync Conflict'; text.className = 'text-[9px] font-black uppercase tracking-widest text-rose-500';
    }
}

function hasUserData(payload) {
    if (!payload || typeof payload !== 'object') return false;

    if (Array.isArray(payload.tracks) && payload.tracks.length > 0) return true;
    if (Array.isArray(payload.tasks) && payload.tasks.length > 0) return true;
    if (payload.customPrograms && typeof payload.customPrograms === 'object' && Object.keys(payload.customPrograms).length > 0) return true;
    if (payload.syllabusStructure && typeof payload.syllabusStructure === 'object' && Object.keys(payload.syllabusStructure).length > 0) return true;
    if (Array.isArray(payload.customActions) && payload.customActions.length > 0) return true;
    if (Array.isArray(payload.paceGoals) && payload.paceGoals.length > 0) return true;
    if (Array.isArray(payload.examSessions) && payload.examSessions.length > 0) return true;
    if (Array.isArray(payload.examRoutine) && payload.examRoutine.length > 0) return true;
    if (Array.isArray(payload.scheduleBlocks) && payload.scheduleBlocks.length > 0) return true;
    if (Array.isArray(payload.scheduleBlocks2) && payload.scheduleBlocks2.length > 0) return true;
    if (Array.isArray(payload.timerLogs) && payload.timerLogs.length > 0) return true;
    if (Array.isArray(payload.successResults) && payload.successResults.length > 0) return true;
    if (payload.fiscalLedger && (
        (Array.isArray(payload.fiscalLedger.transactions) && payload.fiscalLedger.transactions.length > 0) ||
        (Array.isArray(payload.fiscalLedger.budgets) && payload.fiscalLedger.budgets.length > 0) ||
        (Array.isArray(payload.fiscalLedger.vaults) && payload.fiscalLedger.vaults.length > 0)
    )) return true;
    if (payload.passedItems && (
        (Array.isArray(payload.passedItems.programs) && payload.passedItems.programs.length > 0) ||
        (Array.isArray(payload.passedItems.subjects) && payload.passedItems.subjects.length > 0)
    )) return true;
    if (payload.revisionData && (
        (Array.isArray(payload.revisionData.active) && payload.revisionData.active.length > 0) ||
        (payload.revisionData.progress && typeof payload.revisionData.progress === 'object' && Object.keys(payload.revisionData.progress).length > 0)
    )) return true;
    if (payload.dailyFocusHoursTarget && payload.dailyFocusHoursTarget > 0) return true;
    if (payload.dailyFocusHoursTargetHistory && Array.isArray(payload.dailyFocusHoursTargetHistory) && payload.dailyFocusHoursTargetHistory.length > 0) return true;

    return false;
}

const firebaseConfig = {
    apiKey: "AIzaSyD7kXQe7ovTuBlcWYGJpi678idYFdSHUWs",
    authDomain: "x-29-advance.firebaseapp.com",
    projectId: "x-29-advance",
    storageBucket: "x-29-advance.firebasestorage.app",
    messagingSenderId: "277295985303",
    appId: "1:277295985303:web:4c36a1105fa16e8aa16fd2"
};
window.firebaseConfig = firebaseConfig;

window.FirebaseService = {
    _saveDebounceTimer: null,
    _unsubscribeSnapshot: null,
    _authListeners: [],
    _firestoreInitialized: false,
    _isSaving: false,
    _hasPendingWriteInFlight: false,
    _lastCommittedRevision: 0,
    _inFlightWriteId: "",
    _lastCommittedWriteId: "",
    _debounceDurationMs: 180,
    _retryCount: 0,
    _retryTimer: null,
    _lastLocalEditTime: 0,
    cloudDocumentExists: null,

    notifyLocalMutation: function(reason = "") {
        this._lastLocalEditTime = Date.now() + (window.serverTimeOffset || 0);
        AppState.isLocalDirty = true;
        AppState.saveStatus = 'local';
        this._fastPersistLocalStorage();
    },

    _buildCurrentStatePayload: function(customTombstones = null) {
        const tombstones = customTombstones || AppState._tombstones || {};
        return {
            tasks: AppState.tasks || window.tasks || [],
            tracks: AppState.tracks || window.tracks || [],
            customSyllabus: AppState.syllabusStructure || window.syllabusStructure || {},
            syllabusStructure: AppState.syllabusStructure || window.syllabusStructure || {},
            customPrograms: AppState.customPrograms || window.customPrograms || {},
            customActions: AppState.customActions || window.customActions || [],
            paceGoals: AppState.paceGoals || window.paceGoals || [],
            passedItems: AppState.passedItems || window.passedItems || { programs: [], subjects: [] },
            celebrationTargets: AppState.celebrationTargets || window.celebrationTargets || { programs: [], subjects: [] },
            revisionData: AppState.revisionData || window.revisionData || { active: [], progress: {} },
            programVisibility: AppState.programVisibility || window.programVisibility || {},
            subjectTimeLinks: AppState.subjectTimeLinks || window.subjectTimeLinks || {},
            successResults: AppState.successResults || window.successResults || [],
            timerLogs: AppState.timerLogs || window.timerLogs || [],
            dailyFocusHoursTarget: AppState.dailyFocusHoursTarget !== undefined ? AppState.dailyFocusHoursTarget : (window.dailyFocusHoursTarget !== undefined ? window.dailyFocusHoursTarget : 0),
            dailyFocusHoursTargetDate: AppState.dailyFocusHoursTargetDate || window.dailyFocusHoursTargetDate || "",
            dailyFocusHoursTargetHistory: AppState.dailyFocusHoursTargetHistory || window.dailyFocusHoursTargetHistory || [],
            timerAnalyticsRange: AppState.timerAnalyticsRange || window.timerAnalyticsRange || 180,
            timerAnalyticsGrouping: AppState.timerAnalyticsGrouping || window.timerAnalyticsGrouping || 'daily',
            timerAnalyticsChartStyle: AppState.timerAnalyticsChartStyle || window.timerAnalyticsChartStyle || 'combo',
            spectraHeatmapRange: AppState.spectraHeatmapRange || window.spectraHeatmapRange || 365,
            sessionHistoryFilter: AppState.sessionHistoryFilter || window.sessionHistoryFilter || 'all',
            subjectFocusTargets: AppState.subjectFocusTargets || window.subjectFocusTargets || {},
            dashboardConfig: AppState.dashboardConfig || window.dashboardConfig || {},
            weeklyTargetsDatabase: AppState.weeklyTargetsDatabase || window.weeklyTargetsDatabase || {},
            monthlyTargetsDatabase: AppState.monthlyTargetsDatabase || window.monthlyTargetsDatabase || {},
            dailyTargetsDatabase: AppState.dailyTargetsDatabase || window.dailyTargetsDatabase || {},
            scheduleBlocks: AppState.scheduleBlocks || window.scheduleBlocks || [],
            scheduleBlocks2: AppState.scheduleBlocks2 || window.scheduleBlocks2 || [],
            scheduleGroups: AppState.scheduleGroups || window.scheduleGroups || [],
            fiscalLedger: AppState.fiscalLedger || { transactions: [], budgets: [], vaults: [] },
            examSessions: AppState.examSessions || window.examSessions || [],
            examRoutine: AppState.examRoutine || window.examRoutine || [],
            selectedCountdownExamId: AppState.selectedCountdownExamId || window.selectedCountdownExamId || 'auto',
            activeTimerState: AppState.activeTimerState || window.activeTimerState || {},
            activeRoutineSet: AppState.activeRoutineSet || window.activeRoutineSet || 1,
            subjectColors: AppState.subjectColors || window.subjectColors || {},
            _tombstones: tombstones
        };
    },

    _fastPersistLocalStorage: function() {
        try {
            const currentCache = this._buildCurrentStatePayload();
            const jsonStr = JSON.stringify(currentCache);
            safeStorage.setItem('local_app_state', jsonStr);
            safeStorage.setItem('appState', jsonStr);
            AppState.lastLocalPersistTime = Date.now();
        } catch(e) {}
    },

    // 1. Fetch Firebase Configuration from API, fallback to .env or cached settings
    fetchConfig: async function() {
        if (typeof performance !== 'undefined' && performance.mark) {
            performance.mark('x29-boot-start');
        }
        if (window.location.protocol === 'file:') {
            console.log("file:// protocol detected in fetchConfig. Using offline fallback config.");
            return firebaseConfig;
        }

        // Fast local return: use cached or static config to unblock app boot synchronously
        let config;
        const cachedConfig = safeStorage.getItem('firebaseConfig');
        if (cachedConfig) {
            try {
                const parsed = JSON.parse(cachedConfig);
                if (parsed && parsed.apiKey) {
                    config = parsed;
                }
            } catch(e) {}
        }
        if (!config) {
            config = firebaseConfig;
            safeStorage.setItem('firebaseConfig', JSON.stringify(config));
        }

        // Non-blocking background fetch for clock offset & fresh credentials
        fetch('/api/config').then(async res => {
            if (!res.ok) return;
            const freshConfig = await res.json();
            if (freshConfig && freshConfig.apiKey) {
                safeStorage.setItem('firebaseConfig', JSON.stringify(freshConfig));
            }
            const serverDateStr = res.headers.get('Date');
            if (serverDateStr) {
                const serverTime = new Date(serverDateStr).getTime();
                window.serverTimeOffset = serverTime - Date.now();
            }
        }).catch(err => {
            console.warn("Background config fetch notice:", err);
        });

        return config || firebaseConfig;
    },

    // 2. Initialize Firebase Client App and Firestore reference
    init: function(config) {
        const finalConfig = config || firebaseConfig;
        if (window.location.protocol === 'file:') {
            AppState.db = null;
            console.log("Firebase initialized in mock mode for file:// protocol.");
            return;
        }
        if (typeof firebase !== 'undefined') {
            try {
                if (!firebase.apps.length) {
                    firebase.initializeApp(finalConfig);
                }
                if (typeof firebase.firestore === 'function') {
                    AppState.db = firebase.firestore();
                    if (!this._firestoreInitialized) {
                        try {
                            AppState.db.enablePersistence({ synchronizeTabs: true }).catch(err => {
                                console.warn("Firestore persistence notice:", err.code);
                            });
                            this._firestoreInitialized = true;
                        } catch (e) {
                            console.warn("Could not set Firestore settings:", e);
                        }
                    }
                }
                console.log("Firebase initialized successfully with project:", finalConfig.projectId);
            } catch (initErr) {
                console.warn("Firebase initializeApp caught error:", initErr);
                AppState.db = null;
            }
        }
    },

    // 3. Authenticate with Email / Password
    login: async function(email, password) {
        const cleanEmail = (email || '').trim().toLowerCase();

        if (window.location.protocol === 'file:') {
            console.log("Firebase login mocked under file:// protocol.");
            if (cleanEmail === 'ris2k29@gmail.com' && password === '787898') {
                const localUser = { email: 'ris2k29@gmail.com', uid: 'file_protocol_local_user', displayName: 'ris2k29 (Local)' };
                safeStorage.setItem('local_auth_user', JSON.stringify(localUser));
                this._notifyAuthListeners(localUser);
                return { user: localUser };
            }
            throw { code: 'auth/wrong-password', message: 'Invalid email or password.' };
        }

        if (typeof firebase !== 'undefined' && firebase.auth) {
            try {
                await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
                const res = await firebase.auth().signInWithEmailAndPassword(cleanEmail, password);
                if (res && res.user) {
                    const userObj = {
                        email: res.user.email,
                        uid: res.user.uid,
                        displayName: res.user.displayName || res.user.email
                    };
                    safeStorage.setItem('local_auth_user', JSON.stringify(userObj));
                    this._notifyAuthListeners(res.user);
                }
                return res;
            } catch (fbErr) {
                console.warn("Firebase Auth sign-in failed:", fbErr);
                throw fbErr;
            }
        }

        throw { code: 'auth/wrong-password', message: 'Invalid email or password.' };
    },

    _notifyAuthListeners: function(user) {
        if (this._authListeners && this._authListeners.length > 0) {
            this._authListeners.forEach(cb => {
                try { cb(user); } catch(e) {}
            });
        }
    },

    bumpSyncGeneration: function(reason) {
        if (!AppState.syncGeneration) AppState.syncGeneration = 0;
        AppState.syncGeneration++;
        AppState.syncSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        console.log(`SYNC_DEBUG GENERATION_CHANGED: (${reason}) -> New Gen: ${AppState.syncGeneration}`);
        console.log(`SYNC_DEBUG SESSION_CHANGED: (${reason}) -> New SessionID: ${AppState.syncSessionId}`);
        return AppState.syncGeneration;
    },

    // 4. Log out the current session (CRITICAL FIX #5 & #6)
    logout: async function() {
        console.log("SYNC: LOGOUT_INITIATED");
        this.stopSnapshotListener("logout");
        this.bumpSyncGeneration("logout");

        if (this._saveDebounceTimer) {
            clearTimeout(this._saveDebounceTimer);
            this._saveDebounceTimer = null;
            console.log("SYNC: SAVE_CANCELLED (logout)");
        }

        // Purge ALL user-specific application data from browser storage
        const keysToRemove = [
            'local_app_state',
            'appState',
            'cached_fullAppState',
            'cached_examSessions',
            'cached_examRoutine',
            'cached_selectedCountdownExamId',
            'local_auth_user'
        ];
        keysToRemove.forEach(k => safeStorage.removeItem(k));

        try {
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.clear();
            }
        } catch(e) {}

        // Reset memory AppState to clean empty default
        if (typeof window.applyFullAppState === 'function' && typeof window.getDefaultAppState === 'function') {
            window.applyFullAppState(window.getDefaultAppState(), false, true);
        }

        this.cloudDocumentExists = null;
        if (window.AppState) {
            window.AppState.cloudDocumentExists = null;
            window.AppState.hasLoadedFromCloud = false;
            window.AppState.isLocalDirty = false;
        }

        console.log("SYNC: LOGOUT_CACHE_CLEARED - All user cache and memory state purged.");
        this._notifyAuthListeners(null);

        if (window.location.protocol === 'file:') {
            console.log("Firebase logout mocked under file:// protocol.");
            return;
        }
        if (typeof firebase !== 'undefined' && firebase.auth) {
            try {
                await firebase.auth().signOut();
            } catch (e) {
                console.warn("Firebase signOut error:", e);
            }
        }
    },

    // 5. Expose current authenticated user reference
    getCurrentUser: function() {
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
            return firebase.auth().currentUser;
        }
        const cached = safeStorage.getItem('local_auth_user');
        if (cached) {
            try {
                const user = JSON.parse(cached);
                if (user && user.uid && user.uid !== 'mock-local-user-id') {
                    return user;
                }
            } catch(e) {}
        }
        if (window.location.protocol === 'file:') {
            return { email: 'ris2k29@gmail.com', uid: 'file_protocol_local_user', displayName: 'ris2k29 (Local)' };
        }
        return null;
    },

    // 6. Auth State Changes Listener
    onAuthStateChanged: function(callback) {
        if (!this._authListeners) this._authListeners = [];
        this._authListeners.push(callback);

        if (window.location.protocol === 'file:') {
            console.log("file:// protocol detected in onAuthStateChanged.");
            setTimeout(() => {
                callback({
                    email: 'ris2k29@gmail.com',
                    uid: 'file_protocol_local_user',
                    displayName: 'ris2k29 (Local)'
                });
            }, 100);
            return () => {
                this._authListeners = this._authListeners.filter(cb => cb !== callback);
            };
        }

        if (typeof firebase !== 'undefined' && firebase.auth) {
            const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    safeStorage.setItem('local_auth_user', JSON.stringify({
                        email: user.email,
                        uid: user.uid,
                        displayName: user.displayName || user.email
                    }));
                    callback(user);
                } else {
                    safeStorage.removeItem('local_auth_user');
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

    stopSnapshotListener: function(reason = "manual") {
        if (this._unsubscribeSnapshot) {
            const user = this.getCurrentUser();
            const uid = user ? user.uid : 'unknown';
            console.log(`SYNC_DEBUG LISTENER_STOP: UID=${uid}, Reason=${reason}, Timestamp=${Date.now()}`);
            try { this._unsubscribeSnapshot(); } catch(e) {}
            this._unsubscribeSnapshot = null;
        }
    },

    // 7. Register Firestore Real-time Snapshot Listener
    startSnapshotListener: function(uid, onData, onError) {
        this.stopSnapshotListener("startNewListener");

        let activeUid = null;
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
            activeUid = firebase.auth().currentUser.uid;
        } else if (uid && uid !== 'mock-local-user-id') {
            activeUid = uid;
        }

        if (!AppState.db || !activeUid || window.location.protocol === 'file:') {
            console.warn(`SYNC_DEBUG SNAPSHOT_REJECTED: reason=DB_NULL_OR_UNAUTH UID=${activeUid}`);
            return function unsubscribe() {};
        }

        const captureGen = AppState.syncGeneration || 0;
        const captureSessionId = AppState.syncSessionId || "";
        console.log(`SYNC: FIREBASE_PROJECT: ${firebaseConfig.projectId}`);
        console.log(`SYNC: AUTH_UID: ${activeUid}`);
        console.log(`SYNC: FIRESTORE_CONNECTED: true`);
        console.log(`SYNC_DEBUG FIRESTORE_PATH: users/${activeUid}`);
        console.log(`SYNC_DEBUG LISTENER_START: UID=${activeUid}`);
        console.log(`SYNC: LISTENER_START - UID: ${activeUid}, Generation: ${captureGen}, SessionID: ${captureSessionId}, Timestamp: ${Date.now()}`);
        console.log(`SYNC_DEBUG LISTENER_UID: ${activeUid}`);
        console.log(`SYNC_DEBUG LISTENER_GENERATION: ${captureGen}`);
        console.log(`SYNC: LISTENER_GENERATION - Active Generation: ${captureGen}, Current AppState Gen: ${AppState.syncGeneration}, Timestamp: ${Date.now()}`);
        console.log(`SYNC_DEBUG LISTENER_SESSION: ${captureSessionId}`);

        try {
            const userDocRef = AppState.db.collection('users').doc(activeUid);

            const unsubscribe = userDocRef.onSnapshot((docSnapshot) => {
                console.log(`SYNC_DEBUG SNAPSHOT_RECEIVED: UID=${activeUid}, Gen=${captureGen}, Timestamp=${Date.now()}`);

                if (captureGen !== (AppState.syncGeneration || 0)) {
                    console.warn(`SYNC_DEBUG SNAPSHOT_REJECTED: reason=STALE_GENERATION (Captured: ${captureGen}, Current: ${AppState.syncGeneration})`);
                    return;
                }

                if (captureSessionId && captureSessionId !== AppState.syncSessionId) {
                    console.warn(`SYNC_DEBUG SNAPSHOT_REJECTED: reason=SESSION_MISMATCH (Captured: ${captureSessionId}, Current: ${AppState.syncSessionId})`);
                    return;
                }

                const hasPending = docSnapshot.metadata && docSnapshot.metadata.hasPendingWrites;
                const fromCache = docSnapshot.metadata && docSnapshot.metadata.fromCache;
                console.log(`SYNC_DEBUG SNAPSHOT_PENDING_WRITES: ${hasPending}`);
                console.log(`SYNC_DEBUG SNAPSHOT_FROM_CACHE: ${fromCache}`);

                if (hasPending) {
                    console.log(`SYNC_DEBUG SNAPSHOT_REJECTED: reason=PENDING_WRITE (Local echo write in flight)`);
                    this.cloudDocumentExists = true;
                    if (window.AppState) window.AppState.cloudDocumentExists = true;
                    return;
                }

                if (docSnapshot.exists) {
                    console.log(`SYNC_DEBUG SNAPSHOT_EXISTS: true`);
                    this.cloudDocumentExists = true;
                    if (window.AppState) window.AppState.cloudDocumentExists = true;

                    const cloudData = docSnapshot.data();
                    let cloudTime = 0;
                    if (cloudData && cloudData.updatedAt) {
                        if (typeof cloudData.updatedAt === 'number') {
                            cloudTime = cloudData.updatedAt;
                        } else if (typeof cloudData.updatedAt.toMillis === 'function') {
                            cloudTime = cloudData.updatedAt.toMillis();
                        } else if (cloudData.updatedAt.seconds !== undefined) {
                            cloudTime = cloudData.updatedAt.seconds * 1000;
                        }
                    }
                    console.log(`SYNC_DEBUG SNAPSHOT_UPDATED_AT: ${cloudTime}`);

                    // SELF-WRITE ECHO GUARD: If this snapshot represents our own write that just committed,
                    // acknowledge it instantly without re-parsing, reconciling, or re-rendering the DOM!
                    if (AppState.hasLoadedFromCloud && cloudData && cloudData._lastWriteId && (cloudData._lastWriteId === this._lastCommittedWriteId || cloudData._lastWriteId === this._inFlightWriteId)) {
                        console.log(`SYNC_DEBUG SNAPSHOT_SELF_ECHO_ACKNOWLEDGED: WriteId=${cloudData._lastWriteId}`);
                        if (cloudTime > 0) {
                            AppState.lastAppliedCloudTimestamp = Math.max(AppState.lastAppliedCloudTimestamp || 0, cloudTime);
                        }
                        if (AppState.saveStatus === 'saving') {
                            AppState.saveStatus = 'saved';
                        }
                        showSync('saved');
                        return;
                    }

                    const incomingTaskIds = Array.isArray(cloudData.tasks) ? cloudData.tasks.map(t => window.generateItemId(t, 'tasks')) : [];
                    console.log(`SYNC_DEBUG INCOMING_TASK_IDS: ${JSON.stringify(incomingTaskIds)}`);
                    console.log(`SYNC_DEBUG SNAPSHOT_ARRAY_LENGTHS: ${JSON.stringify({
                        tasks: (cloudData.tasks || []).length,
                        tracks: (cloudData.tracks || []).length,
                        customActions: (cloudData.customActions || []).length,
                        paceGoals: (cloudData.paceGoals || []).length,
                        timerLogs: (cloudData.timerLogs || []).length,
                        scheduleBlocks: (cloudData.scheduleBlocks || []).length,
                        examSessions: (cloudData.examSessions || []).length
                    })}`);

                    if (AppState.isLocalDirty) {
                        const lastApplied = AppState.lastAppliedCloudTimestamp || 0;
                        if (cloudTime > 0 && lastApplied > 0 && cloudTime <= lastApplied && AppState.hasLoadedFromCloud) {
                            console.warn(`SYNC_DEBUG SNAPSHOT_REJECTED: reason=OLD_TIMESTAMP (cloudTime: ${cloudTime} <= lastApplied: ${lastApplied})`);
                            showSync('saved');
                            return;
                        }

                        console.log(`SYNC_DEBUG RECONCILE_START: Merging local dirty state with incoming cloud snapshot`);
                        console.warn(`SYNC: CONFLICT_DETECTED - Remote cloud snapshot timestamp (${cloudTime}) > last applied (${AppState.lastAppliedCloudTimestamp || 0}) while local client state is dirty.`);
                        const tombstones = Object.assign({}, AppState._tombstones || {}, cloudData._tombstones || {});
                        AppState._tombstones = tombstones;

                        ['tasks', 'tracks', 'customActions', 'paceGoals', 'timerLogs', 'scheduleBlocks', 'scheduleBlocks2', 'scheduleGroups', 'examSessions', 'examRoutine', 'successResults'].forEach(key => {
                            const localCount = (AppState[key] || []).length;
                            const cloudCount = (cloudData[key] || []).length;
                            if (Array.isArray(cloudData[key]) || Array.isArray(AppState[key])) {
                                cloudData[key] = window.reconcileArrays(AppState[key] || [], cloudData[key] || [], tombstones, key);
                            }
                            const resultCount = (cloudData[key] || []).length;
                            console.log(`SYNC_DEBUG RECONCILE_RESULT (${key}): Local=${localCount}, Cloud=${cloudCount}, Result=${resultCount}`);
                        });

                        if (cloudData.passedItems || AppState.passedItems) {
                            if (AppState.passedItems && AppState.isLocalDirty) {
                                cloudData.passedItems = {
                                    programs: Array.isArray(AppState.passedItems.programs) ? [...AppState.passedItems.programs] : [],
                                    subjects: Array.isArray(AppState.passedItems.subjects) ? [...AppState.passedItems.subjects] : []
                                };
                            }
                        }

                        if (cloudData.celebrationTargets || AppState.celebrationTargets) {
                            if (AppState.celebrationTargets && AppState.isLocalDirty) {
                                cloudData.celebrationTargets = {
                                    programs: Array.isArray(AppState.celebrationTargets.programs) ? [...AppState.celebrationTargets.programs] : [],
                                    subjects: Array.isArray(AppState.celebrationTargets.subjects) ? [...AppState.celebrationTargets.subjects] : []
                                };
                            }
                        }

                        if (cloudData.fiscalLedger || AppState.fiscalLedger) {
                            const flLocal = AppState.fiscalLedger || { transactions: [], budgets: [], vaults: [] };
                            const flCloud = cloudData.fiscalLedger || { transactions: [], budgets: [], vaults: [] };
                            cloudData.fiscalLedger = {
                                transactions: window.reconcileArrays(flLocal.transactions || [], flCloud.transactions || [], tombstones, 'fiscal_transactions'),
                                budgets: window.reconcileArrays(flLocal.budgets || [], flCloud.budgets || [], tombstones, 'fiscal_budgets'),
                                vaults: window.reconcileArrays(flLocal.vaults || [], flCloud.vaults || [], tombstones, 'fiscal_vaults')
                            };
                        }

                        ['monthlyTargetsDatabase', 'weeklyTargetsDatabase', 'dailyTargetsDatabase'].forEach(dbKey => {
                            if (cloudData[dbKey] || AppState[dbKey]) {
                                const localDb = AppState[dbKey] || {};
                                const cloudDb = cloudData[dbKey] || {};
                                const mergedDb = {};
                                const allKeys = new Set([...Object.keys(localDb), ...Object.keys(cloudDb)]);

                                allKeys.forEach(groupKey => {
                                    const localList = Array.isArray(localDb[groupKey]) ? localDb[groupKey] : [];
                                    const cloudList = Array.isArray(cloudDb[groupKey]) ? cloudDb[groupKey] : [];
                                    mergedDb[groupKey] = window.reconcileArrays(localList, cloudList, tombstones, `${dbKey}_${groupKey}`);
                                });

                                cloudData[dbKey] = mergedDb;
                                console.log(`SYNC_DEBUG RECONCILE_RESULT (${dbKey}): Reconciled target database across ${allKeys.size} date groups`);
                            }
                        });

                        if (cloudData.subjectFocusTargets || AppState.subjectFocusTargets) {
                            const cloudSft = cloudData.subjectFocusTargets || {};
                            const localSft = AppState.subjectFocusTargets || {};
                            const mergedSft = {};
                            const allSubs = new Set([...Object.keys(cloudSft), ...Object.keys(localSft)]);

                            allSubs.forEach(sub => {
                                const tombstoneVal = tombstones[`subjectFocusTargets_${sub}`] || tombstones[sub];
                                const tombstoneTime = (typeof tombstoneVal === 'number') ? tombstoneVal : (tombstoneVal === true ? Number.MAX_SAFE_INTEGER : 0);

                                const cloudItem = cloudSft[sub];
                                const cloudTime = cloudItem ? (cloudItem.updatedAt || (cloudItem.createdAt ? new Date(cloudItem.createdAt).getTime() : 0)) : 0;

                                const localItem = localSft[sub];
                                const localTime = localItem ? (localItem.updatedAt || (localItem.createdAt ? new Date(localItem.createdAt).getTime() : 0)) : 0;

                                const latestItem = (localItem && localTime > cloudTime && AppState.isLocalDirty) ? localItem : (cloudItem || localItem);
                                const latestTime = Math.max(localTime, cloudTime);

                                if (latestItem && latestTime > tombstoneTime) {
                                    mergedSft[sub] = latestItem;
                                    delete tombstones[`subjectFocusTargets_${sub}`];
                                    delete tombstones[sub];
                                    if (cloudData._tombstones) {
                                        delete cloudData._tombstones[`subjectFocusTargets_${sub}`];
                                        delete cloudData._tombstones[sub];
                                    }
                                }
                            });
                            cloudData.subjectFocusTargets = mergedSft;
                        }

                        if (cloudData.activeTimerState || AppState.activeTimerState) {
                            const localTimer = AppState.activeTimerState;
                            const cloudTimer = cloudData.activeTimerState;
                            const localTime = (localTimer && (localTimer.updatedAt || localTimer._localTimestamp)) || 0;
                            const cloudTime = (cloudTimer && (cloudTimer.updatedAt || cloudTimer._localTimestamp)) || 0;
                            const isRunning = (typeof window.isAnyTimerRunning === 'function') ? window.isAnyTimerRunning() : (localTimer && localTimer.isRunning);

                            if (localTimer && localTime > cloudTime && (AppState.isLocalDirty || isRunning)) {
                                cloudData.activeTimerState = localTimer;
                                console.log(`SYNC_DEBUG RECONCILE_RESULT (activeTimerState): Preserving newer local timer state (${localTime} > ${cloudTime})`);
                            } else if (cloudTimer) {
                                cloudData.activeTimerState = cloudTimer;
                            }
                        }

                        if ((AppState.localRevision || 0) <= (AppState.lastCommittedRevision || 0)) {
                            if (this._saveDebounceTimer) {
                                clearTimeout(this._saveDebounceTimer);
                                this._saveDebounceTimer = null;
                            }
                        }
                        console.log(`SYNC_DEBUG SNAPSHOT_APPLYING: Reconciled dirty state`);
                        showSync('saved');
                        if (typeof onData === 'function') {
                            onData(cloudData, { exists: true, reconciled: true });
                        }
                    } else {
                        if ((AppState.localRevision || 0) <= (AppState.lastCommittedRevision || 0)) {
                            if (this._saveDebounceTimer) {
                                clearTimeout(this._saveDebounceTimer);
                                this._saveDebounceTimer = null;
                            }
                        }
                        console.log(`SYNC_DEBUG SNAPSHOT_APPLYING: Clean state raw payload`);
                        showSync('saved');
                        if (typeof onData === 'function') {
                            onData(cloudData, { exists: true });
                        }
                    }
                    console.log(`SYNC_DEBUG SNAPSHOT_APPLIED: UID=${activeUid}`);
                } else {
                    console.warn(`SYNC_DEBUG SNAPSHOT_REJECTED: reason=CLOUD_DOCUMENT_MISSING UID=${activeUid}`);
                    if (this._saveDebounceTimer) {
                        clearTimeout(this._saveDebounceTimer);
                        this._saveDebounceTimer = null;
                    }
                    this.cloudDocumentExists = false;
                    if (window.AppState) window.AppState.cloudDocumentExists = false;
                    showSync('uninitialized');
                    if (typeof onData === 'function') {
                        onData(null, { exists: false });
                    }
                }
            }, (error) => {
                console.error(`SYNC_DEBUG SNAPSHOT_REJECTED: reason=FIRESTORE_ERROR UID=${activeUid}`, error);
                showSync('error');
                if (typeof onError === 'function') {
                    onError(error);
                }
            });

            this._unsubscribeSnapshot = unsubscribe;
            console.log(`SYNC_DEBUG ACTIVE_LISTENER=true`);
            return unsubscribe;
        } catch (e) {
            console.error("SYNC_DEBUG SNAPSHOT_REJECTED: reason=REGISTRATION_EXCEPTION", e);
            return function unsubscribe() {};
        }
    },

    _syncDiagnostic: async function() {
        const user = this.getCurrentUser();
        if (!user || !user.uid || !AppState.db) {
            console.warn("SYNC_DEBUG DIAGNOSTIC_ABORTED: No authenticated user or DB instance");
            return null;
        }
        const diagnosticPayload = {
            _syncDiagnostic: {
                id: `ping_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                message: "SYNC_TEST",
                timestamp: Date.now()
            }
        };
        console.log(`SYNC_DEBUG DIAGNOSTIC_WRITE_START: UID=${user.uid}`);
        await AppState.db.collection('users').doc(user.uid).set(diagnosticPayload, { merge: true });
        console.log(`SYNC_DEBUG DIAGNOSTIC_WRITE_SUCCESS: UID=${user.uid}`);
        return diagnosticPayload._syncDiagnostic;
    },

    // 8. Save AppState to Cloud & Local Storage (Centralized SaveQueue & Coalescing Engine)
    saveToCloud: async function(immediate = false, isExplicitInitialization = false, isUserInitiated = false) {
        if (!AppState.localRevision) AppState.localRevision = 0;
        AppState.localRevision++;
        AppState.isLocalDirty = true;
        this._lastLocalEditTime = Date.now() + (window.serverTimeOffset || 0);

        const user = this.getCurrentUser();
        const gen = AppState.syncGeneration || 0;

        // Missing Document Protection: If no authenticated user exists, block save.
        // If authenticated user exists and document does not exist yet in cloud, auto-initialize on first write.
        if (this.cloudDocumentExists === false && !isExplicitInitialization) {
            if (!user || !user.uid) {
                if (this._saveDebounceTimer) {
                    clearTimeout(this._saveDebounceTimer);
                    this._saveDebounceTimer = null;
                }
                console.warn(`SYNC: SAVE_BLOCKED_NO_CLOUD_DOCUMENT - UID: none, SaveGen: ${gen}, Timestamp: ${Date.now()}`);
                console.warn("SYNC: WRITE_BLOCKED", { reason: "NO_AUTH_USER", uid: null });
                showSync('uninitialized');
                return;
            } else {
                console.log(`SYNC: FIRST_WRITE_AUTO_INIT - Document users/${user.uid} will be created on save.`);
                isExplicitInitialization = true;
            }
        }

        // Fast synchronous local storage persist (0ms latency local safety)
        this._fastPersistLocalStorage();

        if (immediate) {
            if (this._saveDebounceTimer) {
                clearTimeout(this._saveDebounceTimer);
                this._saveDebounceTimer = null;
            }
            if (this._isSaving) {
                this._hasPendingWriteInFlight = true;
                return;
            }
            // Execute save non-blocking in background
            this._executeSave(isExplicitInitialization, isUserInitiated, gen);
        } else {
            if (this._saveDebounceTimer) {
                clearTimeout(this._saveDebounceTimer);
                this._saveDebounceTimer = null;
            }
            if (this._isSaving) {
                this._hasPendingWriteInFlight = true;
                return;
            }
            this._saveDebounceTimer = setTimeout(() => {
                this._saveDebounceTimer = null;
                this._executeSave(isExplicitInitialization, isUserInitiated, gen);
            }, this._debounceDurationMs);
        }
    },

    _executeSave: async function(isExplicitInitialization = false, isUserInitiated = false, captureGen = null) {
        if (captureGen === null) captureGen = AppState.syncGeneration || 0;
        const captureSessionId = AppState.syncSessionId || "";
        const targetRevision = AppState.localRevision || 0;

        console.log(`SYNC_DEBUG SAVE_START: Gen=${captureGen}, Session=${captureSessionId}, Rev=${targetRevision}`);

        // GUARD 1: Verify sync generation
        if (captureGen !== (AppState.syncGeneration || 0)) {
            console.warn(`SYNC_DEBUG SAVE_ABORTED: reason=STALE_GENERATION (Capture: ${captureGen}, Current: ${AppState.syncGeneration})`);
            showSync('saved');
            return;
        }

        // GUARD 2: Verify authenticated user
        const user = this.getCurrentUser();
        if (!user || !user.uid) {
            console.warn("SYNC_DEBUG SAVE_ABORTED: reason=NO_AUTH_UID");
            console.warn("SYNC: WRITE_BLOCKED", { reason: "NO_AUTH_UID", uid: null });
            showSync('saved');
            return;
        }

        this._isSaving = true;
        AppState.saveStatus = 'saving';
        showSync('saving');

        const clientWriteId = `${captureSessionId || 'sess'}_r${targetRevision}_${Date.now()}`;
        this._inFlightWriteId = clientWriteId;

        try {
            const tombstones = Object.assign({}, AppState._tombstones || {});

            const payload = this._buildCurrentStatePayload(tombstones);
            payload._lastWriteId = clientWriteId;
            payload._clientWriteTimestamp = Date.now() + (window.serverTimeOffset || 0);

            if (payload.subjectFocusTargets && tombstones) {
                Object.keys(payload.subjectFocusTargets).forEach(k => {
                    if (tombstones[`subjectFocusTargets_${k}`]) {
                        delete payload.subjectFocusTargets[k];
                    }
                });
            }
            if (payload.subjectTimeLinks && tombstones) {
                Object.keys(payload.subjectTimeLinks).forEach(k => {
                    if (tombstones[k] || tombstones[`subjectTimeLinks_${k}`]) {
                        delete payload.subjectTimeLinks[k];
                    }
                });
            }

            // Fast single-pass local storage persist
            window.appState = payload;
            let jsonStr = '';
            try {
                jsonStr = JSON.stringify(payload);
                safeStorage.setItem('local_app_state', jsonStr);
                safeStorage.setItem('appState', jsonStr);
                AppState.lastLocalPersistTime = Date.now();
            } catch(e) {}

            if (AppState.db && user && user.uid && window.location.protocol !== 'file:') {
                const cleanPayload = jsonStr ? JSON.parse(jsonStr) : JSON.parse(JSON.stringify(payload));
                if (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) {
                    cleanPayload.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
                    if (tombstones && typeof tombstones === 'object') {
                        if (!cleanPayload.subjectFocusTargets) cleanPayload.subjectFocusTargets = {};
                        if (!cleanPayload._tombstones) cleanPayload._tombstones = tombstones;

                        // Process subjectFocusTargets tombstones vs active targets based on timestamps
                        Object.keys(cleanPayload.subjectFocusTargets).forEach(sub => {
                            const target = cleanPayload.subjectFocusTargets[sub];
                            if (target && target !== firebase.firestore.FieldValue.delete()) {
                                const targetTime = target.updatedAt || (target.createdAt ? new Date(target.createdAt).getTime() : 0);
                                const tombstoneVal = tombstones[`subjectFocusTargets_${sub}`] || tombstones[sub];
                                const tombstoneTime = (typeof tombstoneVal === 'number') ? tombstoneVal : (tombstoneVal === true ? Number.MAX_SAFE_INTEGER : 0);

                                if (targetTime > tombstoneTime) {
                                    delete tombstones[`subjectFocusTargets_${sub}`];
                                    delete tombstones[sub];
                                    delete cleanPayload._tombstones[`subjectFocusTargets_${sub}`];
                                    delete cleanPayload._tombstones[sub];
                                    if (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) {
                                        cleanPayload._tombstones[`subjectFocusTargets_${sub}`] = firebase.firestore.FieldValue.delete();
                                        cleanPayload._tombstones[sub] = firebase.firestore.FieldValue.delete();
                                    }
                                } else {
                                    delete cleanPayload.subjectFocusTargets[sub];
                                    if (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) {
                                        cleanPayload.subjectFocusTargets[sub] = firebase.firestore.FieldValue.delete();
                                    }
                                }
                            }
                        });

                        Object.keys(tombstones).forEach(tKey => {
                            if (tKey.startsWith('subjectFocusTargets_')) {
                                const subKey = tKey.substring('subjectFocusTargets_'.length);
                                if (!cleanPayload.subjectFocusTargets[subKey] || cleanPayload.subjectFocusTargets[subKey] === firebase.firestore.FieldValue.delete()) {
                                    if (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) {
                                        cleanPayload.subjectFocusTargets[subKey] = firebase.firestore.FieldValue.delete();
                                    } else {
                                        delete cleanPayload.subjectFocusTargets[subKey];
                                    }
                                }
                            }
                        });
                    }
                } else {
                    cleanPayload.updatedAt = Date.now();
                }

                console.log(`SYNC: WRITE_ATTEMPT - UID: ${user.uid}, SaveGen: ${captureGen}, Rev: ${targetRevision}, WriteId: ${clientWriteId}`);
                await AppState.db.collection('users').doc(user.uid).set(cleanPayload, { merge: true });

                // Re-verify generation after async write
                if (captureGen !== (AppState.syncGeneration || 0)) {
                    console.warn(`SYNC_DEBUG SAVE_COMMITTED_BUT_GENERATION_STALE: Capture=${captureGen}, Current=${AppState.syncGeneration}`);
                    return;
                }

                this.cloudDocumentExists = true;
                if (window.AppState) {
                    window.AppState.cloudDocumentExists = true;
                }
                this._lastCommittedWriteId = clientWriteId;
                AppState.lastCommittedWriteId = clientWriteId;
                AppState._lastWriteId = clientWriteId;
                this._lastCommittedRevision = targetRevision;
                AppState.lastCommittedRevision = targetRevision;
                this._retryCount = 0;

                // Check if new local edits arrived while the write was in-flight
                if ((AppState.localRevision || 0) > targetRevision || this._hasPendingWriteInFlight) {
                    this._hasPendingWriteInFlight = false;
                    AppState.isLocalDirty = true;
                    console.log(`SYNC: COALESCED_NEXT_WRITE - Scheduling follow-up write for Revision ${AppState.localRevision}`);
                    setTimeout(() => {
                        this._executeSave(isExplicitInitialization, isUserInitiated, captureGen);
                    }, 60);
                } else {
                    AppState.isLocalDirty = false;
                    AppState.saveStatus = 'saved';
                    showSync('saved');
                    console.log(`SYNC: WRITE_SUCCESS - Revision ${targetRevision} committed cleanly.`);
                }
            } else {
                if (window.AppState) window.AppState.isLocalDirty = false;
                AppState.saveStatus = 'saved';
                showSync('saved');
            }
        } catch (err) {
            console.error("SYNC: WRITE_FAILED", { uid: user.uid, error: err });
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                AppState.saveStatus = 'offline';
                showSync('offline');
            } else {
                AppState.saveStatus = 'error';
                showSync('error');
                this._retryCount++;
                const delay = Math.min(30000, Math.pow(2, this._retryCount) * 1000);
                console.log(`SYNC: AUTO_RETRY_SCHEDULED in ${delay}ms (Attempt ${this._retryCount})`);
                if (this._retryTimer) clearTimeout(this._retryTimer);
                this._retryTimer = setTimeout(() => {
                    this._executeSave(isExplicitInitialization, isUserInitiated, captureGen);
                }, delay);
            }
        } finally {
            this._isSaving = false;
        }
    },

    initializeCloudWorkspace: async function() {
        console.log("SYNC: CLOUD_WORKSPACE_INITIALIZED - Explicit user creation requested.");
        this.stopSnapshotListener("initializeCloudWorkspace");
        this.bumpSyncGeneration("initializeCloudWorkspace");
        this.cloudDocumentExists = true;
        if (window.AppState) window.AppState.cloudDocumentExists = true;
        await this._executeSave(true, true);
        console.log("SYNC: CLOUD_WORKSPACE_INITIALIZED - Save complete.");
    },

    resetLocalWorkspace: function(confirmReset = true) {
        if (confirmReset && typeof window !== 'undefined' && window.confirm) {
            const ok = window.confirm("Are you sure you want to reset your local X-29 workspace?\nThis will clear locally cached app state without modifying Cloud Firestore.");
            if (!ok) return false;
        }
        this.stopSnapshotListener("resetLocalWorkspace");
        this.bumpSyncGeneration("resetLocalWorkspace");
        if (this._saveDebounceTimer) {
            clearTimeout(this._saveDebounceTimer);
            this._saveDebounceTimer = null;
            console.log("SYNC: SAVE_CANCELLED (resetLocalWorkspace)");
        }

        const keysToRemove = [
            'local_app_state',
            'appState',
            'cached_fullAppState',
            'cached_examSessions',
            'cached_examRoutine',
            'cached_selectedCountdownExamId'
        ];
        keysToRemove.forEach(k => safeStorage.removeItem(k));

        try {
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.clear();
            }
        } catch(e) {}

        this.cloudDocumentExists = false;
        if (window.AppState) {
            window.AppState.cloudDocumentExists = false;
            window.AppState.isLocalDirty = false;
        }

        if (typeof window.applyFullAppState === 'function' && typeof window.getDefaultAppState === 'function') {
            window.applyFullAppState(window.getDefaultAppState(), false, true);
        }
        console.log("SYNC: RESET_COMPLETED - Local workspace reset to clean empty slate.");
        return true;
    },

    wipeCloudWorkspace: async function() {
        this.stopSnapshotListener("wipeCloudWorkspace");
        this.bumpSyncGeneration("wipeCloudWorkspace");
        if (this._saveDebounceTimer) {
            clearTimeout(this._saveDebounceTimer);
            this._saveDebounceTimer = null;
            console.log("SYNC: SAVE_CANCELLED (wipeCloudWorkspace)");
        }

        const user = this.getCurrentUser();
        if (AppState.db && user && user.uid && window.location.protocol !== 'file:') {
            try {
                await AppState.db.collection('users').doc(user.uid).delete();
                console.log("SYNC: CLOUD_DOCUMENT_DELETED for UID:", user.uid);
            } catch(e) {
                console.warn("Failed to delete Firestore cloud document:", e);
            }
        }
        this.cloudDocumentExists = false;
        if (window.AppState) {
            window.AppState.cloudDocumentExists = false;
            window.AppState.isLocalDirty = false;
        }

        safeStorage.removeItem('local_app_state');
        safeStorage.removeItem('appState');

        if (typeof window.applyFullAppState === 'function' && typeof window.getDefaultAppState === 'function') {
            window.applyFullAppState(window.getDefaultAppState(), false, true);
        }
        console.log("SYNC: RESET_COMPLETED - Cloud workspace wiped to clean empty slate.");
    },

    saveTimerToCloud: async function() {
        this.saveToCloud(true);
    },

    // 9. Load workspace from Cloud with real-time Firestore sync (BOOT / LOCAL STORAGE RULE FIX)
    loadFromCloud: function() {
        const user = this.getCurrentUser();

        this.stopSnapshotListener("loadFromCloud");
        this.bumpSyncGeneration("loadFromCloud");

        if (this._saveDebounceTimer) {
            clearTimeout(this._saveDebounceTimer);
            this._saveDebounceTimer = null;
        }

        // FAST CACHE-FIRST: Restore local cached state immediately for sub-50ms rendering
        let hasValidCache = false;
        const cachedStr = safeStorage.getItem('local_app_state') || safeStorage.getItem('appState');
        if (cachedStr) {
            try {
                const cachedData = JSON.parse(cachedStr);
                if (cachedData) {
                    window.applyFullAppState(cachedData, false);
                    hasValidCache = hasUserData(cachedData) || hasUserData(AppState);
                    console.log("SYNC: FAST_CACHE_LOADED - Initial state restored from localStorage.");
                }
            } catch (e) {
                console.warn("Failed to parse cached local app state:", e);
            }
        }

        if (typeof window.ensureConfigDefaults === 'function') window.ensureConfigDefaults();
        if (typeof window.migrateLegacyData === 'function') window.migrateLegacyData();
        if (typeof window.sortAllCustomData === 'function') window.sortAllCustomData();
        if (typeof recalculateTotals === 'function') recalculateTotals();

        // If local cache was restored, dismiss loading screen and render UI shell IMMEDIATELY!
        if (hasValidCache && AppState.isInitialLoad) {
            console.log("SYNC: UNBLOCKING_UI_IMMEDIATELY - Cache-first rendering complete.");
            window.dismissLoadingScreen();
            if (typeof renderUI === 'function') renderUI();
            showSync('saving'); // Non-blocking background sync indicator
        }

        const handleDataLoad = (data, meta = { exists: true }) => {
            if (meta && meta.exists === false) {
                // DATA SAFETY GUARD: Retain valid local workspace if cloud document is missing/uninitialized
                if (hasUserData(AppState) || hasUserData(safeStorage.getItem('local_app_state'))) {
                    console.warn("SYNC: CLOUD_DOC_MISSING_BUT_LOCAL_DATA_EXISTS - Retaining local cached workspace.");
                    this.cloudDocumentExists = false;
                    if (window.AppState) window.AppState.cloudDocumentExists = false;
                    showSync('uninitialized');
                } else {
                    console.log("SYNC: LOCAL_CACHE_DISCARDED - Cloud document does not exist & local workspace empty.");
                    safeStorage.removeItem('local_app_state');
                    safeStorage.removeItem('appState');
                    this.cloudDocumentExists = false;
                    if (window.AppState) {
                        window.AppState.cloudDocumentExists = false;
                        window.AppState.isLocalDirty = false;
                    }
                    if (typeof window.applyFullAppState === 'function' && typeof window.getDefaultAppState === 'function') {
                        window.applyFullAppState(window.getDefaultAppState(), false, true);
                    }
                    showSync('uninitialized');
                }
            } else if (data) {
                this.cloudDocumentExists = true;
                if (window.AppState) {
                    window.AppState.cloudDocumentExists = true;
                    if (!meta.reconciled && (AppState.localRevision || 0) <= (AppState.lastCommittedRevision || 0)) {
                        window.AppState.isLocalDirty = false;
                    }
                }
                // DATA SAFETY GUARD: Prevent empty cloud payload from overwriting valid local data during initial bootstrap
                if (hasUserData(AppState) && !hasUserData(data) && !AppState.hasLoadedFromCloud) {
                    console.warn("SYNC: EMPTY_CLOUD_PAYLOAD_REJECTED - Remote cloud payload is empty during boot, keeping local state.");
                } else {
                    window.applyFullAppState(data, false, false, true);
                    try {
                        const jsonStr = JSON.stringify(data);
                        safeStorage.setItem('local_app_state', jsonStr);
                        safeStorage.setItem('appState', jsonStr);
                    } catch (e) {}
                    console.log("SYNC: CLOUD_STATE_APPLIED");
                }
                showSync('saved');
            }

            AppState.hasLoadedFromCloud = true;
            if (typeof window.ensureConfigDefaults === 'function') window.ensureConfigDefaults();
            if (typeof window.migrateLegacyData === 'function') window.migrateLegacyData();
            if (typeof window.sortAllCustomData === 'function') window.sortAllCustomData();
            if (typeof recalculateTotals === 'function') recalculateTotals();

            if (AppState.isInitialLoad) {
                window.dismissLoadingScreen();
                if (typeof renderUI === 'function') renderUI();
            } else {
                requestAnimationFrame(() => {
                    const contentPanel = document.getElementById('main-content-panel');
                    const contentScrollPos = contentPanel ? contentPanel.scrollTop : 0;
                    const scrollPos = window.scrollY;

                    if (typeof renderUI === 'function') renderUI();

                    if (contentPanel) {
                        contentPanel.scrollTop = contentScrollPos;
                    }
                    window.scrollTo(0, scrollPos);
                });
            }
        };

        if (AppState.db && user && user.uid && window.location.protocol !== 'file:') {
            this._unsubscribeSnapshot = this.startSnapshotListener(user.uid, (cloudData, meta) => {
                handleDataLoad(cloudData, meta);
            }, (err) => {
                console.warn("Falling back to local storage due to Firestore listener error:", err);
                const localData = safeStorage.getItem('local_app_state') || safeStorage.getItem('appState');
                if (localData && this.cloudDocumentExists !== false) {
                    try { handleDataLoad(JSON.parse(localData), { exists: true, isErrorFallback: true }); } catch(e) { handleDataLoad(null, { exists: false }); }
                } else {
                    handleDataLoad(null, { exists: false });
                }
            });
        } else {
            const localData = safeStorage.getItem('local_app_state') || safeStorage.getItem('appState');
            if (localData && this.cloudDocumentExists !== false) {
                try { handleDataLoad(JSON.parse(localData), { exists: true, isErrorFallback: true }); } catch(e) { handleDataLoad(null, { exists: false }); }
            } else {
                handleDataLoad(null, { exists: false });
            }
        }
    }
};

window.dismissLoadingScreen = function() {
    if (window.setLoadingProgress) window.setLoadingProgress(100, 'Workspace ready!');
    const loadingEl = document.getElementById('auth-loading');
    const wrapperEl = document.getElementById('app-wrapper');
    if (loadingEl) {
        loadingEl.classList.add('transition-all', 'duration-500', 'opacity-0', 'pointer-events-none');
        setTimeout(() => {
            try { loadingEl.remove(); } catch(e){}
        }, 600);
    }
    if (wrapperEl) wrapperEl.classList.remove('hidden');
    AppState.isInitialLoad = false;

    if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark('x29-ui-ready');
        try {
            performance.measure('x29-time-to-ui', 'x29-boot-start', 'x29-ui-ready');
            const measures = performance.getEntriesByName('x29-time-to-ui');
            if (measures && measures.length > 0) {
                console.log(`⚡ X-29 Mobile Performance: UI Interactive in ${measures[0].duration.toFixed(1)}ms`);
            }
        } catch(e) {}
    }
};

// Global compatibility aliases
window.saveToCloud = window.FirebaseService.saveToCloud.bind(window.FirebaseService);
window.loadFromCloud = window.FirebaseService.loadFromCloud.bind(window.FirebaseService);
window.saveTimerToCloud = window.FirebaseService.saveTimerToCloud.bind(window.FirebaseService);
window.initializeCloudWorkspace = window.FirebaseService.initializeCloudWorkspace.bind(window.FirebaseService);
window.resetLocalWorkspace = window.FirebaseService.resetLocalWorkspace.bind(window.FirebaseService);
window.showSync = showSync;

// Cross-tab real-time state synchronization listener
window.addEventListener('storage', (e) => {
    if ((e.key === 'local_app_state' || e.key === 'appState') && e.newValue) {
        try {
            const data = JSON.parse(e.newValue);
            if (data && typeof data === 'object' && typeof window.applyFullAppState === 'function') {
                window.applyFullAppState(data, false, false, true);
            }
        } catch (err) {
            console.warn("Cross-tab storage synchronization notice:", err);
        }
    }
});

