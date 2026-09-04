/**
 * X-29 Advance Firestore Security Rules Unit Tests
 * Uses @firebase/rules-unit-testing to validate security rules against Firebase Emulator.
 *
 * Requirements:
 *   npm install -D @firebase/rules-unit-testing mocha
 * Run with:
 *   firebase emulators:exec --only firestore "npx mocha tests/firestore-rules.test.js"
 */

const fs = require('fs');
const path = require('path');
const {
    initializeTestEnvironment,
    assertFails,
    assertSucceeds
} = require('@firebase/rules-unit-testing');

const PROJECT_ID = 'x-29-advance';
const RULES_PATH = path.resolve(__dirname, '..', 'firestore.rules');

describe('X-29 Advance Firestore Security Rules', () => {
    let testEnv;

    before(async () => {
        const rules = fs.readFileSync(RULES_PATH, 'utf8');
        testEnv = await initializeTestEnvironment({
            projectId: PROJECT_ID,
            firestore: { rules }
        });
    });

    after(async () => {
        if (testEnv) await testEnv.cleanup();
    });

    beforeEach(async () => {
        if (testEnv) await testEnv.clearFirestore();
    });

    // Helper valid workspace payload
    const getValidWorkspacePayload = (uid) => ({
        tasks: [{ id: 'task-1', title: 'Calculus Review' }],
        tracks: [{ id: 'track-1', title: 'Main Track' }],
        dailyFocusHoursTarget: 6,
        dailyFocusHoursTargetDate: '2026-09-04',
        selectedCountdownExamId: 'auto',
        activeRoutineSet: 1,
        _lastWriteId: 'sess_r1_12345678',
        _clientWriteTimestamp: Date.now(),
        userId: uid,
        uid: uid
    });

    // =========================================================================
    // 1. AUTHENTICATION TESTS
    // =========================================================================
    describe('1. Authentication Verification', () => {
        it('unauthenticated read is denied', async () => {
            const unauthedDb = testEnv.unauthenticatedContext().firestore();
            await assertFails(unauthedDb.collection('users').doc('user_alice').get());
        });

        it('unauthenticated create is denied', async () => {
            const unauthedDb = testEnv.unauthenticatedContext().firestore();
            await assertFails(unauthedDb.collection('users').doc('user_alice').set(getValidWorkspacePayload('user_alice')));
        });

        it('unauthenticated update is denied', async () => {
            // Seed doc via admin context
            await testEnv.withSecurityRulesDisabled(async (context) => {
                await context.firestore().collection('users').doc('user_alice').set(getValidWorkspacePayload('user_alice'));
            });
            const unauthedDb = testEnv.unauthenticatedContext().firestore();
            await assertFails(unauthedDb.collection('users').doc('user_alice').update({ dailyFocusHoursTarget: 8 }));
        });

        it('unauthenticated delete is denied', async () => {
            await testEnv.withSecurityRulesDisabled(async (context) => {
                await context.firestore().collection('users').doc('user_alice').set(getValidWorkspacePayload('user_alice'));
            });
            const unauthedDb = testEnv.unauthenticatedContext().firestore();
            await assertFails(unauthedDb.collection('users').doc('user_alice').delete());
        });
    });

    // =========================================================================
    // 2. OWNERSHIP TESTS
    // =========================================================================
    describe('2. Ownership Verification', () => {
        it('owner can create own workspace document', async () => {
            const aliceDb = testEnv.authenticatedContext('user_alice').firestore();
            await assertSucceeds(aliceDb.collection('users').doc('user_alice').set(getValidWorkspacePayload('user_alice')));
        });

        it('owner can read own workspace document', async () => {
            await testEnv.withSecurityRulesDisabled(async (context) => {
                await context.firestore().collection('users').doc('user_alice').set(getValidWorkspacePayload('user_alice'));
            });
            const aliceDb = testEnv.authenticatedContext('user_alice').firestore();
            await assertSucceeds(aliceDb.collection('users').doc('user_alice').get());
        });

        it('owner can update own workspace document', async () => {
            await testEnv.withSecurityRulesDisabled(async (context) => {
                await context.firestore().collection('users').doc('user_alice').set(getValidWorkspacePayload('user_alice'));
            });
            const aliceDb = testEnv.authenticatedContext('user_alice').firestore();
            await assertSucceeds(aliceDb.collection('users').doc('user_alice').set({
                dailyFocusHoursTarget: 7
            }, { merge: true }));
        });

        it('owner can delete own workspace document (workspace reset)', async () => {
            await testEnv.withSecurityRulesDisabled(async (context) => {
                await context.firestore().collection('users').doc('user_alice').set(getValidWorkspacePayload('user_alice'));
            });
            const aliceDb = testEnv.authenticatedContext('user_alice').firestore();
            await assertSucceeds(aliceDb.collection('users').doc('user_alice').delete());
        });

        it('user CANNOT read another user data', async () => {
            await testEnv.withSecurityRulesDisabled(async (context) => {
                await context.firestore().collection('users').doc('user_alice').set(getValidWorkspacePayload('user_alice'));
            });
            const bobDb = testEnv.authenticatedContext('user_bob').firestore();
            await assertFails(bobDb.collection('users').doc('user_alice').get());
        });

        it('user CANNOT update another user data', async () => {
            await testEnv.withSecurityRulesDisabled(async (context) => {
                await context.firestore().collection('users').doc('user_alice').set(getValidWorkspacePayload('user_alice'));
            });
            const bobDb = testEnv.authenticatedContext('user_bob').firestore();
            await assertFails(bobDb.collection('users').doc('user_alice').update({ dailyFocusHoursTarget: 99 }));
        });

        it('user CANNOT delete another user data', async () => {
            await testEnv.withSecurityRulesDisabled(async (context) => {
                await context.firestore().collection('users').doc('user_alice').set(getValidWorkspacePayload('user_alice'));
            });
            const bobDb = testEnv.authenticatedContext('user_bob').firestore();
            await assertFails(bobDb.collection('users').doc('user_alice').delete());
        });
    });

    // =========================================================================
    // 3. SPOOFING & OWNERSHIP TRANSFER PREVENTION
    // =========================================================================
    describe('3. Spoofing and Ownership Tampering Prevention', () => {
        it('user CANNOT create a document using another user UID in path', async () => {
            const bobDb = testEnv.authenticatedContext('user_bob').firestore();
            await assertFails(bobDb.collection('users').doc('user_alice').set(getValidWorkspacePayload('user_bob')));
        });

        it('user CANNOT create a document in own path with mismatched userId field', async () => {
            const bobDb = testEnv.authenticatedContext('user_bob').firestore();
            const spoofedPayload = getValidWorkspacePayload('user_bob');
            spoofedPayload.userId = 'user_alice'; // Mismatched userId spoofing attempt
            await assertFails(bobDb.collection('users').doc('user_bob').set(spoofedPayload));
        });

        it('user CANNOT transfer ownership by changing userId on update', async () => {
            await testEnv.withSecurityRulesDisabled(async (context) => {
                await context.firestore().collection('users').doc('user_alice').set(getValidWorkspacePayload('user_alice'));
            });
            const aliceDb = testEnv.authenticatedContext('user_alice').firestore();
            await assertFails(aliceDb.collection('users').doc('user_alice').update({
                userId: 'user_bob'
            }));
        });

        it('user CANNOT transfer ownership by changing uid on update', async () => {
            await testEnv.withSecurityRulesDisabled(async (context) => {
                await context.firestore().collection('users').doc('user_alice').set(getValidWorkspacePayload('user_alice'));
            });
            const aliceDb = testEnv.authenticatedContext('user_alice').firestore();
            await assertFails(aliceDb.collection('users').doc('user_alice').update({
                uid: 'user_bob'
            }));
        });
    });

    // =========================================================================
    // 4. PRIVILEGE ESCALATION & PROTECTED FIELDS
    // =========================================================================
    describe('4. Privilege Escalation and Protected Fields', () => {
        it('user CANNOT set isAdmin: true on document creation', async () => {
            const aliceDb = testEnv.authenticatedContext('user_alice').firestore();
            const escalatedPayload = { ...getValidWorkspacePayload('user_alice'), isAdmin: true };
            await assertFails(aliceDb.collection('users').doc('user_alice').set(escalatedPayload));
        });

        it('user CANNOT inject role: "admin" on document creation', async () => {
            const aliceDb = testEnv.authenticatedContext('user_alice').firestore();
            const escalatedPayload = { ...getValidWorkspacePayload('user_alice'), role: 'admin' };
            await assertFails(aliceDb.collection('users').doc('user_alice').set(escalatedPayload));
        });

        it('user CANNOT escalate privileges via update', async () => {
            await testEnv.withSecurityRulesDisabled(async (context) => {
                await context.firestore().collection('users').doc('user_alice').set(getValidWorkspacePayload('user_alice'));
            });
            const aliceDb = testEnv.authenticatedContext('user_alice').firestore();
            await assertFails(aliceDb.collection('users').doc('user_alice').update({ isAdmin: true }));
        });

        it('user can modify only permitted fields', async () => {
            await testEnv.withSecurityRulesDisabled(async (context) => {
                await context.firestore().collection('users').doc('user_alice').set(getValidWorkspacePayload('user_alice'));
            });
            const aliceDb = testEnv.authenticatedContext('user_alice').firestore();
            await assertSucceeds(aliceDb.collection('users').doc('user_alice').update({
                dailyFocusHoursTarget: 8,
                timerAnalyticsRange: 90
            }));
        });
    });

    // =========================================================================
    // 5. QUERY & ENUMERATION PROTECTION
    // =========================================================================
    describe('5. Collection Enumeration & Query Protection', () => {
        it('normal authenticated user CANNOT list or scan the users collection', async () => {
            const aliceDb = testEnv.authenticatedContext('user_alice').firestore();
            await assertFails(aliceDb.collection('users').get());
        });

        it('admin CAN list the users collection', async () => {
            const adminDb = testEnv.authenticatedContext('admin_user', { admin: true }).firestore();
            await assertSucceeds(adminDb.collection('users').get());
        });
    });

    // =========================================================================
    // 6. ADMIN SECURITY
    // =========================================================================
    describe('6. Admin Privileges', () => {
        it('admin with custom claim can read any user document', async () => {
            await testEnv.withSecurityRulesDisabled(async (context) => {
                await context.firestore().collection('users').doc('user_alice').set(getValidWorkspacePayload('user_alice'));
            });
            const adminDb = testEnv.authenticatedContext('admin_user', { admin: true }).firestore();
            await assertSucceeds(adminDb.collection('users').doc('user_alice').get());
        });

        it('admin with verified primary email can read user document', async () => {
            await testEnv.withSecurityRulesDisabled(async (context) => {
                await context.firestore().collection('users').doc('user_alice').set(getValidWorkspacePayload('user_alice'));
            });
            const adminEmailDb = testEnv.authenticatedContext('admin_uid', {
                email: 'ris2k29@gmail.com',
                email_verified: true
            }).firestore();
            await assertSucceeds(adminEmailDb.collection('users').doc('user_alice').get());
        });

        it('admin with unverified email CANNOT use email fallback for admin actions', async () => {
            await testEnv.withSecurityRulesDisabled(async (context) => {
                await context.firestore().collection('users').doc('user_alice').set(getValidWorkspacePayload('user_alice'));
            });
            const unverifiedAdminDb = testEnv.authenticatedContext('impostor_uid', {
                email: 'ris2k29@gmail.com',
                email_verified: false
            }).firestore();
            await assertFails(unverifiedAdminDb.collection('users').doc('user_alice').get());
        });
    });

    // =========================================================================
    // 7. EDGE CASES & SCHEMA INTEGRITY
    // =========================================================================
    describe('7. Edge Cases and Data Integrity', () => {
        it('denies write containing unauthorized arbitrary root keys', async () => {
            const aliceDb = testEnv.authenticatedContext('user_alice').firestore();
            const malformed = {
                ...getValidWorkspacePayload('user_alice'),
                arbitraryHackerKey: 'payload injection'
            };
            await assertFails(aliceDb.collection('users').doc('user_alice').set(malformed));
        });

        it('denies write containing invalid data type for dailyFocusHoursTarget (string instead of number)', async () => {
            const aliceDb = testEnv.authenticatedContext('user_alice').firestore();
            const invalidTypePayload = {
                ...getValidWorkspacePayload('user_alice'),
                dailyFocusHoursTarget: 'not_a_number'
            };
            await assertFails(aliceDb.collection('users').doc('user_alice').set(invalidTypePayload));
        });

        it('denies write containing negative focus hours target', async () => {
            const aliceDb = testEnv.authenticatedContext('user_alice').firestore();
            const negativePayload = {
                ...getValidWorkspacePayload('user_alice'),
                dailyFocusHoursTarget: -5
            };
            await assertFails(aliceDb.collection('users').doc('user_alice').set(negativePayload));
        });

        it('denies writes to unauthorized root collections (e.g., /system, /configs)', async () => {
            const aliceDb = testEnv.authenticatedContext('user_alice').firestore();
            await assertFails(aliceDb.collection('system').doc('config').set({ maintenance: false }));
            await assertFails(aliceDb.collection('appState').doc('user_alice').set({ data: 123 }));
            await assertFails(aliceDb.collection('backups').doc('latest').get());
        });

        it('permits valid diagnostic ping (_syncDiagnostic)', async () => {
            const aliceDb = testEnv.authenticatedContext('user_alice').firestore();
            await assertSucceeds(aliceDb.collection('users').doc('user_alice').set({
                _syncDiagnostic: {
                    id: 'ping_12345',
                    message: 'SYNC_TEST',
                    timestamp: Date.now()
                }
            }, { merge: true }));
        });
    });
});
