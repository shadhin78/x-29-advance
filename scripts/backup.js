/**
 * X-29 Advance (x-29-advance) Local Firestore Backup System
 * scripts/backup.js
 * 
 * Performs local manual and automatic backup of X-29 Advance Firebase Cloud Firestore database.
 * Strictly READ-ONLY with respect to Firestore.
 * Saves backups to: D:\X-29-ADVANCE\X-29-advance-backups\
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, Timestamp, GeoPoint, DocumentReference } = require('firebase-admin/firestore');

const CODE_DIR = path.resolve(__dirname, '..');
const X29_ROOT_DIR = path.dirname(CODE_DIR);
const SERVICE_ACCOUNT_PATH = path.join(CODE_DIR, 'firebase-service-account.json');
const BACKUP_BASE_DIR = path.join(X29_ROOT_DIR, 'X-29-advance-backups');
const LOGS_DIR = path.join(BACKUP_BASE_DIR, 'logs');
const EXPECTED_PROJECT_ID = 'x-29-advance';
const DEFAULT_KEEP_DAYS = 30;

// 1. Generate Bangladesh Timezone Timestamp Format: Date (DD MM YYYY) & Time (HH MM AM/PM)
function getBangladeshTimestampFolders() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dhaka',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    const parts = formatter.formatToParts(now);
    const p = {};
    parts.forEach(item => p[item.type] = item.value);

    const day = String(p.day).padStart(2, '0');
    const month = String(p.month).padStart(2, '0');
    const year = p.year;
    let hour = String(p.hour).padStart(2, '0');
    if (hour === '00') hour = '12';
    const minute = String(p.minute).padStart(2, '0');
    const ampm = (p.dayPeriod || 'AM').toUpperCase();

    const dateFolder = `${day} ${month} ${year}`;
    const timeFolder = `${hour} ${minute} ${ampm}`;

    return { dateFolder, timeFolder };
}

// 2. Verify & Load Service Account Credentials
function loadServiceAccount() {
    let serviceAccount;
    const rawEnv = process.env.FIREBASE_SERVICE_ACCOUNT ? process.env.FIREBASE_SERVICE_ACCOUNT.trim() : '';

    if (rawEnv !== '') {
        let jsonStr = rawEnv;
        if (!jsonStr.startsWith('{')) {
            try {
                const decoded = Buffer.from(jsonStr, 'base64').toString('utf8').trim();
                if (decoded.startsWith('{')) {
                    jsonStr = decoded;
                }
            } catch (e) {
                // Fallback to raw string
            }
        }

        try {
            serviceAccount = JSON.parse(jsonStr);
        } catch (err) {
            try {
                const sanitizedStr = jsonStr.replace(/\r?\n/g, '\\n');
                serviceAccount = JSON.parse(sanitizedStr);
            } catch (err2) {
                console.error(`[BACKUP] ❌ ERROR: Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable as JSON.`);
                process.exit(1);
            }
        }
    } else if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
        try {
            const fileContent = fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8');
            serviceAccount = JSON.parse(fileContent);
        } catch (err) {
            console.error(`[BACKUP] ❌ ERROR: Failed to parse service account JSON file at ${SERVICE_ACCOUNT_PATH}: ${err.message}`);
            process.exit(1);
        }
    } else {
        console.error(`[BACKUP] ❌ ERROR: Service account credentials file missing at: ${SERVICE_ACCOUNT_PATH}`);
        console.error(`Please ensure 'firebase-service-account.json' exists in the project root directory.`);
        process.exit(1);
    }

    if (!serviceAccount || typeof serviceAccount !== 'object') {
        console.error(`[BACKUP] ❌ ERROR: Service account payload is not a valid JSON object.`);
        process.exit(1);
    }

    const projectId = serviceAccount.project_id || serviceAccount.projectId;
    if (!projectId) {
        console.error(`[BACKUP] ❌ ERROR: Service account JSON is missing required 'project_id' field.`);
        process.exit(1);
    }

    if (projectId !== EXPECTED_PROJECT_ID) {
        console.error(`[BACKUP] ❌ ERROR: Service account project ID is [${projectId}], expected [${EXPECTED_PROJECT_ID}].`);
        console.error(`Backup aborted to protect wrong project data.`);
        process.exit(1);
    }

    return serviceAccount;
}

// 3. Serialize Firestore Data Types Safely
function serializeFirestoreValue(val) {
    if (val === null || val === undefined) {
        return val;
    }

    // Firestore Timestamp
    if ((Timestamp && val instanceof Timestamp) ||
        (typeof val.toDate === 'function' && typeof val.toMillis === 'function' && typeof val.seconds === 'number')) {
        return {
            __type: 'timestamp',
            seconds: val.seconds,
            nanoseconds: val.nanoseconds || 0,
            iso: val.toDate().toISOString()
        };
    }

    // Firestore GeoPoint
    if ((GeoPoint && val instanceof GeoPoint) ||
        (typeof val.latitude === 'number' && typeof val.longitude === 'number' && val.constructor && val.constructor.name === 'GeoPoint')) {
        return {
            __type: 'geopoint',
            latitude: val.latitude,
            longitude: val.longitude
        };
    }

    // Firestore DocumentReference
    if ((DocumentReference && val instanceof DocumentReference) ||
        (val.path && typeof val.collection === 'function' && typeof val.doc === 'function')) {
        return {
            __type: 'reference',
            path: val.path
        };
    }

    // Firestore Bytes / Buffer
    if (Buffer.isBuffer(val) || (val && typeof val.toBuffer === 'function') || (val && val.constructor && val.constructor.name === 'Bytes')) {
        const buffer = Buffer.isBuffer(val) ? val : (typeof val.toBuffer === 'function' ? val.toBuffer() : Buffer.from(val.toUint8Array ? val.toUint8Array() : val));
        return {
            __type: 'bytes',
            base64: buffer.toString('base64')
        };
    }

    // Array
    if (Array.isArray(val)) {
        return val.map(item => serializeFirestoreValue(item));
    }

    // Plain Object / Map
    if (typeof val === 'object' && val.constructor === Object) {
        const serializedObj = {};
        for (const [key, propVal] of Object.entries(val)) {
            serializedObj[key] = serializeFirestoreValue(propVal);
        }
        return serializedObj;
    }

    // Primitives (string, number, boolean)
    return val;
}

// 4. Recursive Collection Backup Traversal
async function backupCollection(collectionRef, stats) {
    stats.totalCollections++;
    const colPath = collectionRef.path;
    const colId = collectionRef.id;

    const snapshot = await collectionRef.get();
    const documents = [];

    for (const doc of snapshot.docs) {
        stats.totalDocuments++;
        const docData = doc.data();
        const serializedData = serializeFirestoreValue(docData);

        // Discover nested subcollections recursively
        const subcollectionRefs = await doc.ref.listCollections();
        const subcollections = [];

        for (const subColRef of subcollectionRefs) {
            const subColData = await backupCollection(subColRef, stats);
            subcollections.push(subColData);
        }

        documents.push({
            id: doc.id,
            path: doc.ref.path,
            data: serializedData,
            subcollections: subcollections
        });
    }

    return {
        id: colId,
        path: colPath,
        documents: documents
    };
}

// 5. Calculate SHA-256 Checksum
function calculateSHA256(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}

// 6. Validate Backup Files (firestore-backup.json & metadata.json)
function validateBackup(backupJsonPath, metadataJsonPath, stats) {
    console.log(`[BACKUP] Validating JSON...`);

    if (!fs.existsSync(backupJsonPath)) {
        throw new Error(`Backup data file missing at: ${backupJsonPath}`);
    }
    if (!fs.existsSync(metadataJsonPath)) {
        throw new Error(`Backup metadata file missing at: ${metadataJsonPath}`);
    }

    const backupContent = fs.readFileSync(backupJsonPath, 'utf8');
    if (!backupContent || backupContent.trim().length === 0) {
        throw new Error(`Backup file ${backupJsonPath} is empty.`);
    }

    const parsedData = JSON.parse(backupContent);
    const metadataData = JSON.parse(fs.readFileSync(metadataJsonPath, 'utf8'));

    if (!parsedData.metadata) {
        throw new Error(`Missing metadata block in backup file.`);
    }

    const { projectId, createdAt, totalCollections, totalDocuments } = parsedData.metadata;

    if (projectId !== EXPECTED_PROJECT_ID) {
        throw new Error(`Project ID mismatch: [${projectId}] vs expected [${EXPECTED_PROJECT_ID}]`);
    }

    if (!createdAt) {
        throw new Error(`Missing createdAt timestamp in metadata.`);
    }

    if (typeof totalCollections !== 'number' || typeof totalDocuments !== 'number') {
        throw new Error(`Invalid document or collection count in metadata.`);
    }

    if (totalCollections !== stats.totalCollections || totalDocuments !== stats.totalDocuments) {
        throw new Error(`Count mismatch: Metadata reports (${totalCollections} cols, ${totalDocuments} docs), calculated (${stats.totalCollections} cols, ${stats.totalDocuments} docs).`);
    }

    if (!Array.isArray(parsedData.collections)) {
        throw new Error(`Missing or invalid collections array in backup payload.`);
    }

    // Verify SHA-256 hash match
    const computedSHA = calculateSHA256(backupJsonPath);
    console.log(`[BACKUP] SHA-256 generated: ${computedSHA}`);

    if (metadataData.sha256 !== computedSHA) {
        throw new Error(`SHA-256 checksum mismatch: metadata (${metadataData.sha256}) vs calculated (${computedSHA})`);
    }

    console.log(`[BACKUP] Initial file verification successful`);
    return parsedData;
}

// 7. Parse Date from Folder Name
function parseFolderDate(folderName) {
    // Format: "14 08 2026 10 32 AM"
    const parts = folderName.trim().split(/\s+/);
    if (parts.length === 6) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        let hour = parseInt(parts[3], 10);
        const minute = parseInt(parts[4], 10);
        const ampm = parts[5].toUpperCase();

        if (ampm === 'PM' && hour < 12) hour += 12;
        if (ampm === 'AM' && hour === 12) hour = 0;

        return new Date(Date.UTC(year, month, day, hour - 6, minute));
    }

    // Legacy Format: YYYY-MM-DD or YYYY-MM-DD_HH-mm-ss
    const dateParts = folderName.split('_')[0].split('-');
    if (dateParts.length === 3) {
        return new Date(parseInt(dateParts[0], 10), parseInt(dateParts[1], 10) - 1, parseInt(dateParts[2], 10));
    }

    return null;
}

// 8. Retention Policy (Manual Backups & Legacy Backups preserved, no auto-deletion)
function applyRetentionPolicy(baseDir) {
    // Retention policy for manual backups is disabled to ensure no existing or manual backups are deleted automatically.
    return;
}

const LOG_FILE_PATH = path.join(LOGS_DIR, 'backup-log.txt');

function logBackupEvent(event, mode, details = '') {
    try {
        if (!fs.existsSync(LOGS_DIR)) {
            fs.mkdirSync(LOGS_DIR, { recursive: true });
        }
        const nowStr = getBangladeshTimestampFolders();
        const timestamp = `${nowStr.dateFolder} ${nowStr.timeFolder}`;
        const modeUpper = (mode || 'manual').toUpperCase();
        let line = `[${timestamp}] ${modeUpper} BACKUP ${event}`;
        if (details) {
            line += ` - ${details}`;
        }
        line += '\n';
        fs.appendFileSync(LOG_FILE_PATH, line, 'utf8');
    } catch (e) {
        console.error(`[BACKUP] Log write warning: ${e.message}`);
    }
}

// 9. Main Local Backup Function
async function runBackup() {
    const isAutomatic = process.argv.includes('--automatic') || process.argv.includes('-a') || process.env.BACKUP_MODE === 'automatic';
    const backupMode = isAutomatic ? 'automatic' : 'manual';
    const startTime = Date.now();

    logBackupEvent('STARTED', backupMode);

    console.log(`\n==================================================`);
    console.log(` X-29 ADVANCE FIRESTORE LOCAL BACKUP SYSTEM (${backupMode.toUpperCase()} MODE)`);
    console.log(`==================================================\n`);

    try {
        const serviceAccount = loadServiceAccount();

        const apps = getApps ? getApps() : [];
        if (apps.length === 0) {
            initializeApp({
                credential: cert(serviceAccount)
            });
        }

        const db = getFirestore();
        console.log(`[BACKUP] Connected to Firebase (Project: ${EXPECTED_PROJECT_ID})`);

        const stats = {
            totalCollections: 0,
            totalDocuments: 0
        };

        console.log(`[BACKUP] Reading Firestore...`);

        const rootCollections = await db.listCollections();
        const collectionsData = [];

        for (const colRef of rootCollections) {
            console.log(` 📦 Backing up root collection: [${colRef.id}]...`);
            const colData = await backupCollection(colRef, stats);
            collectionsData.push(colData);
        }

        console.log(`[BACKUP] Collections found: ${stats.totalCollections}`);
        console.log(`[BACKUP] Documents found: ${stats.totalDocuments}`);

        // Zero-Document Handling (Supports initial empty database state safely)
        if (stats.totalDocuments === 0) {
            console.log(`[BACKUP] ℹ️ Notice: Firestore currently contains 0 collections/documents (clean initial state).`);
            console.log(`[BACKUP] Creating baseline backup snapshot for X-29 Advance.`);
        }

        console.log(`[BACKUP] Creating JSON...`);

        const { dateFolder, timeFolder } = getBangladeshTimestampFolders();
        const subFolder = isAutomatic ? 'Automatic' : 'Manual';
        const modeBaseDir = path.join(BACKUP_BASE_DIR, subFolder, dateFolder);

        let finalTimeFolder = timeFolder;
        let targetDir = path.join(modeBaseDir, finalTimeFolder);

        let collisionCounter = 1;
        while (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
            finalTimeFolder = `${timeFolder} (${collisionCounter})`;
            targetDir = path.join(modeBaseDir, finalTimeFolder);
            collisionCounter++;
        }

        const backupJsonPath = path.join(targetDir, 'firestore-backup.json');
        const metadataJsonPath = path.join(targetDir, 'metadata.json');

        fs.mkdirSync(targetDir, { recursive: true });

        const nowIso = new Date().toISOString();

        const backupPayload = {
            metadata: {
                project: 'X-29 Advance',
                backupType: backupMode,
                version: '1.0',
                createdAt: nowIso,
                projectId: EXPECTED_PROJECT_ID,
                totalCollections: stats.totalCollections,
                totalDocuments: stats.totalDocuments
            },
            collections: collectionsData
        };

        const jsonStr = JSON.stringify(backupPayload, null, 2);
        fs.writeFileSync(backupJsonPath, jsonStr, 'utf8');

        // Write firestore.json alias for compatibility
        fs.writeFileSync(path.join(targetDir, 'firestore.json'), jsonStr, 'utf8');

        const fileSize = Buffer.byteLength(jsonStr, 'utf8');
        const sha256Hash = calculateSHA256(backupJsonPath);

        const metadataPayload = {
            backupDate: nowIso,
            backupFolderTimestamp: `${dateFolder}\\${finalTimeFolder}`,
            backupMode: backupMode,
            backupType: backupMode,
            firebaseProject: EXPECTED_PROJECT_ID,
            documentCount: stats.totalDocuments,
            collectionCount: stats.totalCollections,
            backupSizeBytes: fileSize,
            sha256: sha256Hash,
            status: 'verified'
        };

        fs.writeFileSync(metadataJsonPath, JSON.stringify(metadataPayload, null, 2), 'utf8');

        // Run local file integrity verification
        try {
            validateBackup(backupJsonPath, metadataJsonPath, stats);
        } catch (valErr) {
            console.error(`[BACKUP] ❌ BACKUP VERIFICATION FAILED: ${valErr.message}`);
            fs.rmSync(targetDir, { recursive: true, force: true });
            throw valErr;
        }

        // Apply retention policy after verification succeeded
        applyRetentionPolicy(BACKUP_BASE_DIR);

        const fileSizeKB = (fileSize / 1024).toFixed(2);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`\n==================================================`);
        console.log(`🎉 X-29 ADVANCE ${backupMode.toUpperCase()} BACKUP SUCCESSFUL!`);
        console.log(`   Project ID:       ${EXPECTED_PROJECT_ID}`);
        console.log(`   Directory:        ${targetDir}`);
        console.log(`   Total Collections:${stats.totalCollections}`);
        console.log(`   Total Documents:  ${stats.totalDocuments}`);
        console.log(`   File Size:        ${fileSizeKB} KB`);
        console.log(`   Duration:         ${duration}s`);
        console.log(`==================================================\n`);

        logBackupEvent('SUCCESS', backupMode, `Folder: ${targetDir}`);

        // AUTOMATIC POST-BACKUP VERIFICATION AGAINST LIVE FIRESTORE
        if (isAutomatic || process.argv.includes('--verify')) {
            console.log(`==================================================`);
            console.log(` AUTOMATIC POST-BACKUP VERIFICATION`);
            console.log(`==================================================\n`);
            console.log(`[BACKUP] 🔍 Verifying newly created backup against LIVE Firestore...`);

            try {
                const { verifySpecificBackup } = require('./verify-backup');
                const verifyResult = await verifySpecificBackup(targetDir, {
                    db,
                    serviceAccount,
                    isAutomatic,
                    logToVerificationFile: true,
                    logToBackupLog: true
                });

                if (!verifyResult.success || !verifyResult.isExactMatch) {
                    console.warn(`\n[BACKUP] ⚠️ Post-backup verification detected ${verifyResult.diffCount !== undefined ? verifyResult.diffCount : 'some'} difference(s).`);
                    console.warn(`[BACKUP] Backup folder is safely preserved at: ${targetDir}`);
                } else {
                    console.log(`\n[BACKUP] ✅ Automatic Post-Backup Verification PASSED (EXACT MATCH).`);
                }
            } catch (verifyErr) {
                console.error(`\n[BACKUP] ❌ Post-backup verification encountered an error:`, verifyErr.message || verifyErr);
                try {
                    const { appendVerificationLog, appendBackupLog, getBangladeshTimestamp } = require('./verify-backup');
                    const ts = getBangladeshTimestamp().formatted;
                    const modeUpper = backupMode.toUpperCase();
                    appendVerificationLog(
                        `[${ts}] ${modeUpper} BACKUP VERIFICATION ERROR\n` +
                        `Backup: ${targetDir}\n` +
                        `Status: ERROR\n` +
                        `Error: ${verifyErr.name || 'Error'}: ${verifyErr.message || String(verifyErr)}\n` +
                        `Result: VERIFICATION ERROR`
                    );
                    appendBackupLog(`[${ts}] ${modeUpper} BACKUP VERIFICATION ERROR - ${verifyErr.message || String(verifyErr)}`);
                } catch (e) {}
            }
        }
    } catch (err) {
        logBackupEvent('FAILED', backupMode, err.message || String(err));
        try {
            const { logBackupFailedInVerificationLog } = require('./verify-backup');
            logBackupFailedInVerificationLog(backupMode, err.message || String(err));
        } catch (e) {}
        throw err;
    }
}

runBackup().catch(err => {
    console.error(`[BACKUP] ❌ BACKUP FAILED WITH EXCEPTION:`, err.message || err);
    process.exit(1);
});
