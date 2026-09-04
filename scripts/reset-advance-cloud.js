/**
 * X-29 Advance Cloud Reset Script
 * scripts/reset-advance-cloud.js
 * 
 * Securely resets or deletes contaminated user documents in the x-29-advance Firebase Firestore.
 * Contains strict safety assertions ensuring it will REFUSE to run on any project other than x-29-advance.
 */

const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const EXPECTED_PROJECT_ID = 'x-29-advance';
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'firebase-service-account.json');

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error("❌ Service account file not found at:", SERVICE_ACCOUNT_PATH);
    process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

if (serviceAccount.project_id !== EXPECTED_PROJECT_ID) {
    console.error(`❌ CRITICAL SECURITY ERROR: Expected project '${EXPECTED_PROJECT_ID}', but service account is for '${serviceAccount.project_id}'. Aborting immediately!`);
    process.exit(1);
}

console.log(`[RESET] Connecting to Firebase project: ${serviceAccount.project_id}...`);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function resetWorkspace() {
    try {
        const usersSnapshot = await db.collection('users').get();
        console.log(`[RESET] Found ${usersSnapshot.size} user document(s) in collection 'users'.`);

        for (const doc of usersSnapshot.docs) {
            console.log(`[RESET] Processing document: users/${doc.id}`);
            const data = doc.data();
            const taskCount = Array.isArray(data.tasks) ? data.tasks.length : 0;
            console.log(`[RESET] Document has ${taskCount} task(s). Deleting document to ensure a clean empty workspace...`);
            await db.collection('users').doc(doc.id).delete();
            console.log(`[RESET] Document users/${doc.id} successfully DELETED from x-29-advance.`);
        }

        console.log(`[RESET] Cloud Firestore in '${EXPECTED_PROJECT_ID}' is now 100% EMPTY and ready for fresh use.`);
        process.exit(0);
    } catch (err) {
        console.error("[RESET] ❌ Error resetting cloud workspace:", err);
        process.exit(1);
    }
}

resetWorkspace();
