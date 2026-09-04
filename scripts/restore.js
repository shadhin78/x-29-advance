/**
 * X-29 Advance (x-29-advance) Local Firestore Restore System
 * scripts/restore.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, GeoPoint, DocumentReference, Bytes } = require('firebase-admin/firestore');

const CODE_DIR = path.resolve(__dirname, '..');
const X29_ROOT_DIR = path.dirname(CODE_DIR);
const SERVICE_ACCOUNT_PATH = path.join(CODE_DIR, 'firebase-service-account.json');
const BACKUP_BASE_DIR = path.join(X29_ROOT_DIR, 'X-29-advance-backups');
const MANUAL_BACKUPS_DIR = path.join(BACKUP_BASE_DIR, 'Manual');
const LOGS_DIR = path.join(BACKUP_BASE_DIR, 'logs');
const RESTORE_LOG_PATH = path.join(LOGS_DIR, 'restore-log.txt');
const EXPECTED_PROJECT_ID = 'x-29-advance';
const MAX_BATCH_SIZE = 400;

// Helper to handle CLI user input
function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => rl.question(query, answer => {
        rl.close();
        resolve(answer.trim());
    }));
}

// 1. Verify Service Account File & Project ID
function loadServiceAccount() {
    let serviceAccount;

    if (process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_SERVICE_ACCOUNT.trim() !== '') {
        try {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        } catch (err) {
            console.error(`\n❌ ERROR: Failed to parse FIREBASE_SERVICE_ACCOUNT env variable JSON: ${err.message}`);
            process.exit(1);
        }
    } else if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
        try {
            const fileContent = fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8');
            serviceAccount = JSON.parse(fileContent);
        } catch (err) {
            console.error(`\n❌ ERROR: Failed to parse service account JSON file: ${err.message}\n`);
            process.exit(1);
        }
    } else {
        console.error(`\n❌ ERROR: Service account file not found at: ${SERVICE_ACCOUNT_PATH}`);
        console.error(`Please place your 'firebase-service-account.json' in the project root directory.\n`);
        process.exit(1);
    }

    const projectId = serviceAccount.project_id || serviceAccount.projectId;
    if (projectId !== EXPECTED_PROJECT_ID) {
        console.error(`\n❌ ERROR: Service account project ID is [${projectId}], expected [${EXPECTED_PROJECT_ID}].`);
        console.error(`Restore aborted to protect wrong project data.\n`);
        process.exit(1);
    }

    return serviceAccount;
}

// Helper to discover all backups across Manual, Automatic, and Legacy directories
function scanAvailableBackupsForRestore() {
    const results = [];
    const seenPaths = new Set();

    if (!fs.existsSync(BACKUP_BASE_DIR)) return results;

    function findBackupFolders(dir, depth = 0) {
        if (depth > 5 || !fs.existsSync(dir)) return [];
        const found = [];
        let entries = [];
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch (e) {
            return [];
        }

        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            const fullPath = path.join(dir, entry.name);
            const jsonPath = fs.existsSync(path.join(fullPath, 'firestore-backup.json'))
                ? path.join(fullPath, 'firestore-backup.json')
                : fs.existsSync(path.join(fullPath, 'firestore.json'))
                    ? path.join(fullPath, 'firestore.json')
                    : null;

            if (jsonPath) {
                found.push({ fullPath, jsonPath });
            } else {
                found.push(...findBackupFolders(fullPath, depth + 1));
            }
        }
        return found;
    }

    const backupDirs = findBackupFolders(BACKUP_BASE_DIR);

    for (const { fullPath, jsonPath } of backupDirs) {
        if (seenPaths.has(jsonPath)) continue;
        seenPaths.add(jsonPath);

        let stats = { size: 0, mtimeMs: 0 };
        try {
            stats = fs.statSync(jsonPath);
        } catch (e) {}

        let meta = { projectId: EXPECTED_PROJECT_ID, createdAt: null, totalDocuments: 0, totalCollections: 0 };

        try {
            const content = fs.readFileSync(jsonPath, 'utf8');
            const parsed = JSON.parse(content);
            if (parsed && parsed.metadata) {
                meta = parsed.metadata;
            }
        } catch (e) {}

        let createdAtMs = stats.mtimeMs || 0;
        if (meta.createdAt) {
            const t = new Date(meta.createdAt).getTime();
            if (!isNaN(t) && t > 0) createdAtMs = t;
        }

        const relPath = path.relative(BACKUP_BASE_DIR, fullPath);
        let backupType = 'LOCAL';
        let relSource = 'X-29-advance-backups';

        if (relPath.startsWith('Manual') || relPath.startsWith('manual') || relPath.startsWith('Manual' + path.sep) || relPath.startsWith('manual' + path.sep)) {
            backupType = 'MANUAL';
            relSource = 'X-29-advance-backups\\Manual';
        } else if (relPath.startsWith('Automatic') || relPath.startsWith('daily') || relPath.startsWith('Automatic' + path.sep) || relPath.startsWith('daily' + path.sep)) {
            backupType = 'AUTOMATIC';
            relSource = 'X-29-advance-backups\\Automatic';
        }

        let folderName = relPath;
        if (meta.backupFolderTimestamp) {
            folderName = meta.backupFolderTimestamp;
        } else if (relPath.startsWith('Manual' + path.sep)) {
            folderName = relPath.substring(7);
        } else if (relPath.startsWith('manual' + path.sep)) {
            folderName = relPath.substring(7);
        } else if (relPath.startsWith('Automatic' + path.sep)) {
            folderName = relPath.substring(10);
        } else if (relPath.startsWith('daily' + path.sep)) {
            folderName = relPath.substring(6);
        }

        results.push({
            folderName,
            fullPath,
            jsonPath,
            backupType,
            relSource,
            createdAtMs,
            fileSizeBytes: stats.size,
            fileSizeKB: (stats.size / 1024).toFixed(2),
            totalDocuments: meta.totalDocuments || 0,
            totalCollections: meta.totalCollections || 0,
            projectId: meta.projectId || EXPECTED_PROJECT_ID
        });
    }

    // Sort newest first
    results.sort((a, b) => b.createdAtMs - a.createdAtMs);

    return results;
}

// 2. Deserialize Firestore Data Types safely
function deserializeFirestoreValue(val, db) {
    if (val === null || val === undefined) {
        return val;
    }

    if (typeof val === 'object' && !Array.isArray(val) && val.__type) {
        switch (val.__type) {
            case 'timestamp':
                return new Timestamp(val.seconds || 0, val.nanoseconds || 0);
            case 'geopoint':
                return new GeoPoint(val.latitude || 0, val.longitude || 0);
            case 'reference':
                return db.doc(val.path);
            case 'bytes':
                const buf = Buffer.from(val.base64 || '', 'base64');
                if (Bytes && typeof Bytes.fromUint8Array === 'function') {
                    return Bytes.fromUint8Array(buf);
                }
                return buf;
            default:
                break;
        }
    }

    if (Array.isArray(val)) {
        return val.map(item => deserializeFirestoreValue(item, db));
    }

    if (typeof val === 'object' && val.constructor === Object) {
        const deserializedObj = {};
        for (const [key, propVal] of Object.entries(val)) {
            deserializedObj[key] = deserializeFirestoreValue(propVal, db);
        }
        return deserializedObj;
    }

    return val;
}

// 3. Batched Execution Handler
class BatchQueue {
    constructor(db) {
        this.db = db;
        this.batch = db.batch();
        this.opCount = 0;
        this.totalOps = 0;
    }

    async set(docRef, data, options = {}) {
        this.batch.set(docRef, data, options);
        this.opCount++;
        this.totalOps++;
        if (this.opCount >= MAX_BATCH_SIZE) {
            await this.flush();
        }
    }

    async delete(docRef) {
        this.batch.delete(docRef);
        this.opCount++;
        this.totalOps++;
        if (this.opCount >= MAX_BATCH_SIZE) {
            await this.flush();
        }
    }

    async flush() {
        if (this.opCount > 0) {
            await this.batch.commit();
            this.batch = this.db.batch();
            this.opCount = 0;
        }
    }
}

// 4. Recursive Collection Document Restoration
async function restoreCollectionNode(colData, batchQueue, db, stats, isMergeMode) {
    stats.restoredCollections++;

    if (!Array.isArray(colData.documents)) return;

    for (const docNode of colData.documents) {
        stats.restoredDocuments++;
        const docRef = db.doc(docNode.path);
        const deserializedData = deserializeFirestoreValue(docNode.data || {}, db);

        await batchQueue.set(docRef, deserializedData, { merge: isMergeMode });

        if (Array.isArray(docNode.subcollections)) {
            for (const subColData of docNode.subcollections) {
                await restoreCollectionNode(subColData, batchQueue, db, stats, isMergeMode);
            }
        }
    }
}

// 5. Recursive Collection Wiping for Full Restore
async function recursiveWipeCollection(colRef, batchQueue, stats) {
    if (!colRef || typeof colRef.get !== 'function') {
        return;
    }

    try {
        stats.deletedCollections = (stats.deletedCollections || 0) + 1;

        let snapshot;
        try {
            snapshot = await colRef.get();
        } catch (err) {
            console.error(`\n❌ ERROR: Failed to fetch documents in collection [${colRef.path}]: ${err.message}`);
            throw new Error(`Failed to read collection [${colRef.path}]: ${err.message}`);
        }

        for (const doc of snapshot.docs) {
            let subcollections = [];
            try {
                subcollections = await doc.ref.listCollections();
            } catch (err) {
                console.error(`\n❌ ERROR: Failed to list subcollections for document [${doc.ref.path}]: ${err.message}`);
                throw new Error(`Failed to list subcollections for document [${doc.ref.path}]: ${err.message}`);
            }

            for (const subCol of subcollections) {
                await recursiveWipeCollection(subCol, batchQueue, stats);
            }

            try {
                await batchQueue.delete(doc.ref);
                stats.deletedDocuments = (stats.deletedDocuments || 0) + 1;
            } catch (err) {
                console.error(`\n❌ ERROR: Failed to delete document [${doc.ref.path}]: ${err.message}`);
                throw new Error(`Failed to delete document [${doc.ref.path}]: ${err.message}`);
            }
        }
    } catch (err) {
        throw err;
    }
}

// Alias for backwards compatibility
const wipeCollectionNode = recursiveWipeCollection;

function logRestoreEvent(mode, backupName, stats, error = null) {
    try {
        if (!fs.existsSync(LOGS_DIR)) {
            fs.mkdirSync(LOGS_DIR, { recursive: true });
        }
        const now = new Date().toISOString();
        const status = error ? `FAILED: ${error.message || error}` : `SUCCESS (Restored ${stats ? stats.restoredDocuments : 0} docs, ${stats ? stats.restoredCollections : 0} collections)`;
        const entry = `[${now}] RESTORE [${mode}] - Backup: ${backupName} - Status: ${status}\n`;
        fs.appendFileSync(RESTORE_LOG_PATH, entry, 'utf8');
    } catch (e) {}
}

// 6. Main Restore Execution Function
async function runRestore() {
    const serviceAccount = loadServiceAccount();

    console.log(`\n==================================================`);
    console.log(` X-29 ADVANCE FIRESTORE RESTORE SYSTEM`);
    console.log(` Connected to X-29 Advance Firebase Project: [${EXPECTED_PROJECT_ID}]`);
    console.log(`==================================================\n`);

    const availableBackups = scanAvailableBackupsForRestore();

    if (availableBackups.length === 0) {
        console.error(`❌ ERROR: No valid timestamped backups found in ${MANUAL_BACKUPS_DIR} or ${BACKUP_BASE_DIR}`);
        process.exit(1);
    }

    console.log(`📂 Available Local Firestore Backups:\n`);
    availableBackups.forEach((bItem, index) => {
        const typeTag = `[${bItem.backupType}]`.padEnd(11, ' ');
        console.log(` [${index + 1}] ${typeTag} ${bItem.folderName}`);
        console.log(`     Source: ${bItem.relSource}\n`);
    });

    const selectedIdxStr = await askQuestion(`Select a backup to restore (1-${availableBackups.length}) [or ENTER to cancel]: `);
    if (!selectedIdxStr) {
        console.log(`\nOperation cancelled.`);
        process.exit(0);
    }

    const selectedIdx = parseInt(selectedIdxStr, 10) - 1;
    if (isNaN(selectedIdx) || selectedIdx < 0 || selectedIdx >= availableBackups.length) {
        console.error(`\n❌ Invalid selection. Aborting.`);
        process.exit(1);
    }

    const selectedBackup = availableBackups[selectedIdx];
    const backupFolderName = selectedBackup.folderName;
    const backupFilePath = selectedBackup.jsonPath;

    // Verify backup integrity and parse payload
    const backupRaw = fs.readFileSync(backupFilePath, 'utf8');
    let backupPayload;
    try {
        backupPayload = JSON.parse(backupRaw);
    } catch (e) {
        console.error(`\n❌ ERROR: Backup file is corrupted JSON.`);
        process.exit(1);
    }

    if (!backupPayload.metadata || backupPayload.metadata.projectId !== EXPECTED_PROJECT_ID) {
        console.error(`\n❌ ERROR: Backup belongs to project [${backupPayload.metadata?.projectId}], expected [${EXPECTED_PROJECT_ID}].`);
        process.exit(1);
    }

    // Display Restore Confirmation Summary (Requirement 5)
    console.log(`\n==================================================`);
    console.log(` RESTORE CONFIRMATION`);
    console.log(`==================================================\n`);
    console.log(` Backup Type: [${selectedBackup.backupType}]`);
    console.log(` Backup Date: ${selectedBackup.folderName}`);
    console.log(` Source:`);
    console.log(` ${selectedBackup.fullPath}\n`);
    console.log(` Project ID:  ${EXPECTED_PROJECT_ID}`);
    console.log(` Collections: ${selectedBackup.totalCollections}`);
    console.log(` Documents:   ${selectedBackup.totalDocuments}`);
    console.log(` Backup Size: ${selectedBackup.fileSizeKB} KB\n`);
    console.log(` WARNING:`);
    console.log(` This operation will WRITE data to Firebase.\n`);

    const confirmAnswer = await askQuestion(`Are you sure you want to continue? (YES/NO): `);
    const cleanAnswer = (confirmAnswer || '').trim().toUpperCase();

    if (cleanAnswer !== 'YES' && cleanAnswer !== 'Y') {
        console.log(`\nOperation cancelled. No changes were made to Firebase.\n`);
        process.exit(0);
    }

    console.log(`\nSelect Restore Mode:`);
    console.log(`   [1] SAFE RESTORE (Merge backup into Firestore, preserve non-conflicting documents)`);
    console.log(`   [2] FULL RESTORE (DESTRUCTIVE: Wipe existing Firestore data then restore backup)`);
    
    const modeInput = await askQuestion(`\nEnter mode (1 or 2) [default 1]: `);
    const mode = modeInput === '2' ? 'FULL' : 'SAFE';

    initializeApp({
        credential: cert(serviceAccount)
    });

    const db = getFirestore();
    const batchQueue = new BatchQueue(db);

    if (mode === 'FULL') {
        console.log(`\n--------------------------------------------------`);
        console.log(`⚠️  WARNING: FULL RESTORE IS DESTRUCTIVE!`);
        console.log(`This will recursively DELETE ALL existing Firestore collections and documents in project [${EXPECTED_PROJECT_ID}] before restoring!`);
        console.log(`--------------------------------------------------`);
        
        const confirmStr = await askQuestion(`To confirm, type "RESTORE" exactly: `);
        if (confirmStr !== 'RESTORE') {
            console.log(`\n❌ Confirmation failed ("${confirmStr}" !== "RESTORE"). Full Restore CANCELLED. No changes were made.`);
            process.exit(0);
        }

        console.log(`\n🔥 Discovering existing Firestore collections to wipe...`);
        const wipeStats = { deletedCollections: 0, deletedDocuments: 0 };
        const rootColsToWipe = await db.listCollections();

        for (const rootColRef of rootColsToWipe) {
            console.log(`   - Wiping collection: [${rootColRef.id}]...`);
            await recursiveWipeCollection(rootColRef, batchQueue, wipeStats);
        }

        try {
            await batchQueue.flush();
        } catch (err) {
            console.error(`\n❌ ERROR: Failed to flush wipe operations: ${err.message}`);
            throw new Error(`Wipe flush failed: ${err.message}`);
        }
        console.log(`🧹 Firestore database wiped. Deleted ${wipeStats.deletedDocuments} documents across ${wipeStats.deletedCollections} collections.`);
    }

    console.log(`\n🚀 Restoring data from backup [${backupFolderName}] (${mode} RESTORE)...`);
    const restoreStats = { restoredCollections: 0, restoredDocuments: 0 };
    const isMergeMode = (mode === 'SAFE');

    if (Array.isArray(backupPayload.collections)) {
        for (const colData of backupPayload.collections) {
            console.log(` 📦 Restoring collection: [${colData.id}]...`);
            await restoreCollectionNode(colData, batchQueue, db, restoreStats, isMergeMode);
        }
    }

    try {
        await batchQueue.flush();
    } catch (err) {
        console.error(`\n❌ ERROR: Failed to flush restore operations: ${err.message}`);
        throw new Error(`Restore flush failed: ${err.message}`);
    }

    console.log(`\n==================================================`);
    console.log(`🎉 X-29 ADVANCE RESTORE SUCCESSFUL!`);
    console.log(`   Project ID:          ${EXPECTED_PROJECT_ID}`);
    console.log(`   Restore Mode:        ${mode} RESTORE`);
    console.log(`   Source Backup:       X-29-advance-backups/${backupFolderName}`);
    console.log(`   Restored Collections:${restoreStats.restoredCollections}`);
    console.log(`   Restored Documents:  ${restoreStats.restoredDocuments}`);
    console.log(`==================================================\n`);

    logRestoreEvent(mode, backupFolderName, restoreStats);
}

runRestore().catch(err => {
    console.error(`\n❌ RESTORE FAILED WITH EXCEPTION:`, err);
    logRestoreEvent('UNKNOWN', 'NONE', null, err);
    process.exit(1);
});
