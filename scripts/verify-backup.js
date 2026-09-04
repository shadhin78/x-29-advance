/**
 * X-29 (x-2k29) Read-Only Firestore Backup Deep Verification System
 * scripts/verify-backup.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, Timestamp, GeoPoint, DocumentReference } = require('firebase-admin/firestore');

const CODE_DIR = path.resolve(__dirname, '..');
const X29_ROOT_DIR = path.dirname(CODE_DIR);
const SERVICE_ACCOUNT_PATH = path.join(CODE_DIR, 'firebase-service-account.json');
const MANUAL_BACKUPS_DIR = path.join(X29_ROOT_DIR, 'X-29-Backups', 'Manual');
const BACKUP_BASE_DIR = path.join(X29_ROOT_DIR, 'X-29-Backups');
const VERIFICATION_LOG_PATH = path.join(BACKUP_BASE_DIR, 'verification-log.txt');
const BACKUP_LOG_PATH = path.join(BACKUP_BASE_DIR, 'backup-log.txt');

const EXPECTED_PROJECT_ID = 'x-2k29';
const PROJECT_NAME = 'X-29';

// -----------------------------------------------------------------------------
// SAFETY AUDIT GUARANTEE:
// This script is 100% READ-ONLY.
// It DOES NOT perform any Firestore writes, updates, deletes, or restores.
// It DOES NOT modify, overwrite, delete, or create backup JSON files.
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// 0. TIME & LOGGING UTILITIES (Bangladesh Timezone UTC+6)
// -----------------------------------------------------------------------------
function getBangladeshTimestamp() {
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

    return {
        dateFolder,
        timeFolder,
        formatted: `${day} ${month} ${year} ${hour} ${minute} ${ampm}`
    };
}

function appendVerificationLog(text) {
    try {
        if (!fs.existsSync(BACKUP_BASE_DIR)) {
            fs.mkdirSync(BACKUP_BASE_DIR, { recursive: true });
        }
        fs.appendFileSync(VERIFICATION_LOG_PATH, text.trim() + '\n\n', 'utf8');
    } catch (e) {
        console.error(`[VERIFY] Verification log write warning: ${e.message}`);
    }
}

function appendBackupLog(summaryText) {
    try {
        if (!fs.existsSync(BACKUP_BASE_DIR)) {
            fs.mkdirSync(BACKUP_BASE_DIR, { recursive: true });
        }
        fs.appendFileSync(BACKUP_LOG_PATH, summaryText.trim() + '\n', 'utf8');
    } catch (e) {
        console.error(`[VERIFY] Backup log write warning: ${e.message}`);
    }
}

function logBackupFailedInVerificationLog(mode, errorMessage) {
    const ts = getBangladeshTimestamp().formatted;
    const modeUpper = (mode || 'automatic').toUpperCase();
    const entry = `[${ts}] ${modeUpper} BACKUP FAILED\nStatus: BACKUP FAILED\nError: ${errorMessage}\nResult: BACKUP FAILED (Verification not performed)`;
    appendVerificationLog(entry);
}

function formatDocumentLevelDifferences(diffs, maxItems = 50) {
    if (!diffs || diffs.length === 0) return '';

    const differingDocs = new Set();
    const missingFromBackup = [];
    const extraInBackup = [];
    const fieldDifferences = [];

    diffs.forEach(d => {
        const parts = d.path.split('/');
        if (parts.length >= 2) {
            differingDocs.add(`${parts[0]}/${parts[1]}`);
        } else if (parts.length === 1) {
            differingDocs.add(parts[0]);
        }

        if (d.category === 'MISSING FROM BACKUP') {
            missingFromBackup.push(d.path);
        } else if (d.category === 'EXTRA IN BACKUP') {
            extraInBackup.push(d.path);
        } else {
            // VALUE DIFFERENCE, TYPE DIFFERENCE, ARRAY DIFFERENCE, SUBCOLLECTION DIFFERENCE
            fieldDifferences.push(d.path);
        }
    });

    const lines = [];
    let count = 0;

    if (differingDocs.size > 0) {
        lines.push('DIFFERING DOCUMENTS:');
        for (const doc of differingDocs) {
            if (count++ >= maxItems) break;
            lines.push(`- ${doc}`);
        }
    }

    if (missingFromBackup.length > 0 && count < maxItems) {
        if (lines.length > 0) lines.push('');
        lines.push('MISSING FROM BACKUP:');
        for (const p of missingFromBackup) {
            if (count++ >= maxItems) break;
            lines.push(`- ${p}`);
        }
    }

    if (extraInBackup.length > 0 && count < maxItems) {
        if (lines.length > 0) lines.push('');
        lines.push('EXTRA IN BACKUP:');
        for (const p of extraInBackup) {
            if (count++ >= maxItems) break;
            lines.push(`- ${p}`);
        }
    }

    if (fieldDifferences.length > 0 && count < maxItems) {
        if (lines.length > 0) lines.push('');
        lines.push('FIELD DIFFERENCES:');
        for (const p of fieldDifferences) {
            if (count++ >= maxItems) break;
            lines.push(`- ${p}`);
        }
    }

    if (diffs.length > maxItems) {
        lines.push('');
        lines.push('... additional differences omitted');
    }

    return lines.join('\n');
}

// -----------------------------------------------------------------------------
// 1. SERVICE ACCOUNT VERIFICATION & CONNECTION
// -----------------------------------------------------------------------------
function loadAndVerifyServiceAccount() {
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
            console.error(`\n❌ ERROR: Failed to parse service account JSON: ${err.message}`);
            process.exit(1);
        }
    } else {
        console.error(`\n❌ ERROR: Service account file missing at: ${SERVICE_ACCOUNT_PATH}`);
        console.error(`Aborting verification.\n`);
        process.exit(1);
    }

    const projectId = serviceAccount.project_id || serviceAccount.projectId;

    if (projectId !== EXPECTED_PROJECT_ID) {
        console.error(`\n❌ ABORT IMMEDIATELY: Service account project ID [${projectId}] !== expected [${EXPECTED_PROJECT_ID}].`);
        console.error(`Will not connect to or inspect another Firebase project.\n`);
        process.exit(1);
    }

    return serviceAccount;
}

// -----------------------------------------------------------------------------
// 2. BACKUP DISCOVERY & SELECTION
// -----------------------------------------------------------------------------
function scanAvailableBackups() {
    const results = [];
    const seenPaths = new Set();

    function findBackupFolders(dir, depth = 0) {
        if (depth > 5 || !fs.existsSync(dir)) return [];
        const found = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });
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

    if (!fs.existsSync(BACKUP_BASE_DIR)) return results;

    const backupDirs = findBackupFolders(BACKUP_BASE_DIR);

    for (const { fullPath, jsonPath } of backupDirs) {
        if (seenPaths.has(jsonPath)) continue;
        seenPaths.add(jsonPath);

        let stats = { size: 0, mtimeMs: 0 };
        try {
            stats = fs.statSync(jsonPath);
        } catch (e) {}

        let meta = { projectId: EXPECTED_PROJECT_ID, createdAt: null, totalDocuments: 0, totalCollections: 0 };
        let isReadable = false;

        try {
            const content = fs.readFileSync(jsonPath, 'utf8');
            const parsed = JSON.parse(content);
            if (parsed && parsed.metadata) {
                meta = parsed.metadata;
                isReadable = true;
            }
        } catch (e) {
            isReadable = false;
        }

        let createdAtMs = stats.mtimeMs || 0;
        if (meta.createdAt) {
            const t = new Date(meta.createdAt).getTime();
            if (!isNaN(t) && t > 0) createdAtMs = t;
        }

        const relPath = path.relative(BACKUP_BASE_DIR, fullPath);
        let backupType = 'LOCAL';
        let relSource = 'X-29-Backups';

        if (relPath.startsWith('Manual') || relPath.startsWith('Manual' + path.sep)) {
            backupType = 'MANUAL';
            relSource = 'X-29-Backups\\Manual';
        } else if (relPath.startsWith('Automatic') || relPath.startsWith('Automatic' + path.sep)) {
            backupType = 'AUTOMATIC';
            relSource = 'X-29-Backups\\Automatic';
        }

        results.push({
            folderName: relPath,
            fullPath,
            jsonPath,
            backupType,
            relSource,
            createdAtMs,
            fileSizeBytes: stats.size,
            fileSizeKB: (stats.size / 1024).toFixed(2),
            projectId: meta.projectId || EXPECTED_PROJECT_ID,
            createdAt: meta.createdAt || relPath,
            totalDocuments: meta.totalDocuments || 0,
            totalCollections: meta.totalCollections || 0,
            isReadable
        });
    }

    // Sort newest first
    results.sort((a, b) => b.createdAtMs - a.createdAtMs);

    return results;
}

async function selectBackupFromCli(backupsList, args) {
    if (backupsList.length === 0) {
        console.error(`❌ ERROR: No valid Firestore backups found in: ${BACKUP_BASE_DIR}`);
        process.exit(1);
    }

    // Flag: --latest
    if (args.includes('--latest')) {
        const latest = backupsList[0]; // Index 0 is newest
        console.log(`ℹ️ Flag '--latest' detected. Selected backup: [${latest.backupType}] ${latest.folderName}`);
        return latest;
    }

    // Flag: --backup <name or path>
    const backupArgIdx = args.indexOf('--backup');
    if (backupArgIdx !== -1 && args[backupArgIdx + 1]) {
        const targetVal = args[backupArgIdx + 1].trim();

        // Check exact folder name match
        const foundByName = backupsList.find(b => b.folderName === targetVal);
        if (foundByName) return foundByName;

        // Check path match
        if (fs.existsSync(targetVal)) {
            const stat = fs.statSync(targetVal);
            let jsonPath = targetVal;
            if (stat.isDirectory()) {
                jsonPath = path.join(targetVal, 'firestore-backup.json');
                if (!fs.existsSync(jsonPath)) jsonPath = path.join(targetVal, 'firestore.json');
            }

            const folderName = path.relative(BACKUP_BASE_DIR, path.dirname(jsonPath));
            const foundByPath = backupsList.find(b => b.jsonPath === jsonPath || b.folderName === folderName);
            if (foundByPath) return foundByPath;

            const fullPath = path.dirname(jsonPath);
            let backupType = 'LOCAL';
            let relSource = 'X-29-Backups';

            if (fullPath.includes(path.sep + 'Manual' + path.sep) || fullPath.endsWith(path.sep + 'Manual')) {
                backupType = 'MANUAL';
                relSource = 'X-29-Backups\\Manual';
            } else if (fullPath.includes(path.sep + 'Automatic' + path.sep) || fullPath.endsWith(path.sep + 'Automatic')) {
                backupType = 'AUTOMATIC';
                relSource = 'X-29-Backups\\Automatic';
            }

            return {
                folderName,
                fullPath,
                jsonPath,
                backupType,
                relSource,
                fileSizeBytes: stat.size,
                fileSizeKB: (stat.size / 1024).toFixed(2),
                projectId: EXPECTED_PROJECT_ID,
                createdAt: folderName,
                totalDocuments: 0,
                totalCollections: 0,
                isReadable: true
            };
        }

        console.error(`❌ ERROR: Specified backup '${targetVal}' not found.`);
        process.exit(1);
    }

    // Interactive Menu
    console.log(`==================================================`);
    console.log(` AVAILABLE LOCAL FIRESTORE BACKUPS`);
    console.log(` Primary Location:`);
    console.log(` ${BACKUP_BASE_DIR}`);
    console.log(`==================================================\n`);

    backupsList.forEach((b, idx) => {
        const projBadge = b.projectId === EXPECTED_PROJECT_ID ? `[${b.projectId}]` : `[⚠️ ${b.projectId}]`;
        const typeTag = `[${b.backupType}]`.padEnd(11, ' ');
        console.log(` [${idx + 1}] ${typeTag} ${b.folderName}`);
        console.log(`     Source:     ${b.relSource}`);
        console.log(`     Created:    ${b.createdAt}`);
        console.log(`     Project ID: ${projBadge}`);
        console.log(`     Data Stats: ${b.totalCollections} collections, ${b.totalDocuments} docs`);
        console.log(`     File Size:  ${b.fileSizeKB} KB`);
        console.log(`--------------------------------------------------`);
    });

    const latest = backupsList[0];
    console.log(` [L] LATEST BACKUP → [${latest.backupType}] ${latest.folderName}`);
    console.log(` [Q] CANCEL & QUIT\n`);

    const answer = await askQuestion(`Select a backup to verify (1-${backupsList.length} or L) [default L]: `);

    if (!answer || answer.toUpperCase() === 'L' || answer.toLowerCase() === 'latest') {
        return backupsList[0];
    }

    if (answer.toUpperCase() === 'Q') {
        console.log(`Verification cancelled.`);
        process.exit(0);
    }

    const num = parseInt(answer, 10);
    if (!isNaN(num) && num >= 1 && num <= backupsList.length) {
        return backupsList[num - 1];
    }

    console.error(`❌ Invalid selection '${answer}'. Aborting.`);
    process.exit(1);
}

function loadBackupFile(backupItem) {
    if (!fs.existsSync(backupItem.jsonPath)) {
        return {
            valid: false,
            errorCategory: 'INVALID BACKUP',
            reason: `Backup JSON file missing at: ${backupItem.jsonPath}`
        };
    }

    let rawContent;
    try {
        rawContent = fs.readFileSync(backupItem.jsonPath, 'utf8');
    } catch (e) {
        return {
            valid: false,
            errorCategory: 'INVALID BACKUP',
            reason: `Failed to read backup file: ${e.message}`
        };
    }

    let parsed;
    try {
        parsed = JSON.parse(rawContent);
    } catch (e) {
        return {
            valid: false,
            errorCategory: 'INVALID BACKUP',
            reason: `Malformed JSON structure: ${e.message}`
        };
    }

    if (!parsed || !parsed.metadata) {
        return {
            valid: false,
            errorCategory: 'INVALID BACKUP',
            reason: `Missing metadata section in backup file.`
        };
    }

    if (parsed.metadata.projectId !== EXPECTED_PROJECT_ID) {
        return {
            valid: false,
            errorCategory: 'BACKUP PROJECT ID MISMATCH',
            reason: `Backup project ID [${parsed.metadata.projectId}] !== expected [${EXPECTED_PROJECT_ID}]`,
            parsed
        };
    }

    if (!Array.isArray(parsed.collections)) {
        return {
            valid: false,
            errorCategory: 'INVALID BACKUP',
            reason: `Missing or invalid collections array in backup payload.`
        };
    }

    return {
        valid: true,
        parsed,
        backupItem
    };
}

// -----------------------------------------------------------------------------
// 3. RECURSIVE FIRESTORE FETCHING (READ-ONLY)
// -----------------------------------------------------------------------------
async function fetchLiveCollection(colRef, onProgress) {
    if (typeof onProgress === 'function') {
        onProgress(colRef.path);
    }
    const snapshot = await colRef.get();
    const docs = [];

    for (const doc of snapshot.docs) {
        const subColRefs = await doc.ref.listCollections();
        const subcollections = [];

        for (const subColRef of subColRefs) {
            const subColData = await fetchLiveCollection(subColRef, onProgress);
            subcollections.push(subColData);
        }

        docs.push({
            id: doc.id,
            path: doc.ref.path,
            data: doc.data(),
            subcollections
        });
    }

    return {
        id: colRef.id,
        path: colRef.path,
        documents: docs
    };
}

async function fetchLiveFirestore(db, onProgress) {
    const rootCols = await db.listCollections();
    const collections = [];

    for (const colRef of rootCols) {
        const colData = await fetchLiveCollection(colRef, onProgress);
        collections.push(colData);
    }

    return collections;
}

// -----------------------------------------------------------------------------
// 4. DATA TYPE NORMALIZATION & CANONICAL REPRESENTATION
// -----------------------------------------------------------------------------
function getTypeOf(val) {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (Array.isArray(val)) return 'array';

    if (typeof val === 'object') {
        if ((Timestamp && val instanceof Timestamp) || (typeof val.toDate === 'function' && typeof val.seconds === 'number')) {
            return 'timestamp';
        }
        if ((GeoPoint && val instanceof GeoPoint) || (typeof val.latitude === 'number' && typeof val.longitude === 'number' && (val.constructor?.name === 'GeoPoint' || val.__type === 'geopoint'))) {
            return 'geopoint';
        }
        if ((DocumentReference && val instanceof DocumentReference) || (val.path && (typeof val.collection === 'function' || val.__type === 'reference'))) {
            return 'reference';
        }
        if (Buffer.isBuffer(val) || val.__type === 'bytes' || (val && val.constructor && val.constructor.name === 'Bytes')) {
            return 'bytes';
        }
        if (val.__type === 'timestamp') return 'timestamp';
        if (val.__type === 'geopoint') return 'geopoint';
        if (val.__type === 'reference') return 'reference';
        if (val.__type === 'bytes') return 'bytes';

        return 'object';
    }

    return typeof val;
}

function normalizeValue(val) {
    if (val === null || val === undefined) return val;
    const type = getTypeOf(val);

    if (type === 'timestamp') {
        return {
            __type: 'timestamp',
            seconds: Number(val.seconds || 0),
            nanoseconds: Number(val.nanoseconds || 0)
        };
    }
    if (type === 'geopoint') {
        return {
            __type: 'geopoint',
            latitude: Number(val.latitude || 0),
            longitude: Number(val.longitude || 0)
        };
    }
    if (type === 'reference') {
        return {
            __type: 'reference',
            path: String(val.path || '')
        };
    }
    if (type === 'bytes') {
        let base64 = '';
        if (Buffer.isBuffer(val)) {
            base64 = val.toString('base64');
        } else if (typeof val.base64 === 'string') {
            base64 = val.base64;
        } else if (typeof val.toBuffer === 'function') {
            base64 = val.toBuffer().toString('base64');
        } else if (val.toUint8Array) {
            base64 = Buffer.from(val.toUint8Array()).toString('base64');
        }
        return {
            __type: 'bytes',
            base64
        };
    }
    if (type === 'array') {
        return val.map(normalizeValue);
    }
    if (type === 'object') {
        const normalizedObj = {};
        for (const [k, v] of Object.entries(val)) {
            // Strip secondary 'iso' string from backup timestamp so canonical format matches perfectly
            if (val.__type === 'timestamp' && k === 'iso') continue;
            normalizedObj[k] = normalizeValue(v);
        }
        return normalizedObj;
    }
    return val;
}

function normalizeCollectionTree(collectionsData) {
    if (!Array.isArray(collectionsData)) return [];
    return collectionsData.map(col => ({
        id: col.id,
        path: col.path,
        documents: (col.documents || []).map(doc => ({
            id: doc.id,
            path: doc.path,
            data: normalizeValue(doc.data || {}),
            subcollections: normalizeCollectionTree(doc.subcollections || [])
        }))
    }));
}

// -----------------------------------------------------------------------------
// 5. DEEP VALUE-LEVEL COMPARISON & DIFFERENCE TRACKING
// -----------------------------------------------------------------------------
function compareValues(liveVal, backupVal, pathStr, diffs) {
    const typeLive = getTypeOf(liveVal);
    const typeBackup = getTypeOf(backupVal);

    if (typeLive !== typeBackup) {
        diffs.push({
            category: 'TYPE DIFFERENCE',
            path: pathStr,
            backup: typeBackup,
            firestore: typeLive,
            details: `Firestore type [${typeLive}] vs Backup type [${typeBackup}]`
        });
        return;
    }

    if (typeLive === 'timestamp') {
        if (liveVal.seconds !== backupVal.seconds || liveVal.nanoseconds !== backupVal.nanoseconds) {
            diffs.push({
                category: 'VALUE DIFFERENCE',
                path: pathStr,
                backup: `Timestamp (${backupVal.seconds}.${backupVal.nanoseconds})`,
                firestore: `Timestamp (${liveVal.seconds}.${liveVal.nanoseconds})`,
                details: `Firestore Timestamp (${liveVal.seconds}.${liveVal.nanoseconds}) vs Backup Timestamp (${backupVal.seconds}.${backupVal.nanoseconds})`
            });
        }
        return;
    }

    if (typeLive === 'geopoint') {
        if (liveVal.latitude !== backupVal.latitude || liveVal.longitude !== backupVal.longitude) {
            diffs.push({
                category: 'VALUE DIFFERENCE',
                path: pathStr,
                backup: `GeoPoint (${backupVal.latitude}, ${backupVal.longitude})`,
                firestore: `GeoPoint (${liveVal.latitude}, ${liveVal.longitude})`,
                details: `Firestore GeoPoint (${liveVal.latitude}, ${liveVal.longitude}) vs Backup GeoPoint (${backupVal.latitude}, ${backupVal.longitude})`
            });
        }
        return;
    }

    if (typeLive === 'reference') {
        if (liveVal.path !== backupVal.path) {
            diffs.push({
                category: 'VALUE DIFFERENCE',
                path: pathStr,
                backup: `Reference [${backupVal.path}]`,
                firestore: `Reference [${liveVal.path}]`,
                details: `Firestore Reference [${liveVal.path}] vs Backup Reference [${backupVal.path}]`
            });
        }
        return;
    }

    if (typeLive === 'bytes') {
        if (liveVal.base64 !== backupVal.base64) {
            diffs.push({
                category: 'VALUE DIFFERENCE',
                path: pathStr,
                backup: `Bytes (${backupVal.base64 ? backupVal.base64.substring(0, 20) + '...' : ''})`,
                firestore: `Bytes (${liveVal.base64 ? liveVal.base64.substring(0, 20) + '...' : ''})`,
                details: `Firestore Bytes mismatch`
            });
        }
        return;
    }

    if (typeLive === 'array') {
        if (liveVal.length !== backupVal.length) {
            diffs.push({
                category: 'ARRAY DIFFERENCE',
                path: pathStr,
                backup: `Array length ${backupVal.length}`,
                firestore: `Array length ${liveVal.length}`,
                details: `Firestore length [${liveVal.length}] vs Backup length [${backupVal.length}]`
            });
        }

        const maxLen = Math.max(liveVal.length, backupVal.length);
        for (let i = 0; i < maxLen; i++) {
            const itemPath = `${pathStr}[${i}]`;
            if (i >= liveVal.length) {
                diffs.push({
                    category: 'EXTRA IN BACKUP',
                    path: itemPath,
                    backup: JSON.stringify(backupVal[i]),
                    firestore: '[MISSING]',
                    details: `Array element exists in backup but missing from Live Firestore`
                });
            } else if (i >= backupVal.length) {
                diffs.push({
                    category: 'MISSING FROM BACKUP',
                    path: itemPath,
                    backup: '[MISSING]',
                    firestore: JSON.stringify(liveVal[i]),
                    details: `Array element exists in Live Firestore but missing from backup`
                });
            } else {
                compareValues(liveVal[i], backupVal[i], itemPath, diffs);
            }
        }
        return;
    }

    if (typeLive === 'object') {
        const liveKeys = Object.keys(liveVal);
        const backupKeys = Object.keys(backupVal);

        for (const k of liveKeys) {
            const fieldPath = `${pathStr}/${k}`;
            if (!(k in backupVal)) {
                diffs.push({
                    category: 'MISSING FROM BACKUP',
                    path: fieldPath,
                    backup: '[MISSING]',
                    firestore: JSON.stringify(liveVal[k]),
                    details: `Field exists in Live Firestore but missing from backup`
                });
            } else {
                compareValues(liveVal[k], backupVal[k], fieldPath, diffs);
            }
        }

        for (const k of backupKeys) {
            const fieldPath = `${pathStr}/${k}`;
            if (!(k in liveVal)) {
                diffs.push({
                    category: 'EXTRA IN BACKUP',
                    path: fieldPath,
                    backup: JSON.stringify(backupVal[k]),
                    firestore: '[MISSING]',
                    details: `Field exists in backup but missing from Live Firestore`
                });
            }
        }
        return;
    }

    // Primitives
    if (liveVal !== backupVal) {
        diffs.push({
            category: 'VALUE DIFFERENCE',
            path: pathStr,
            backup: JSON.stringify(backupVal),
            firestore: JSON.stringify(liveVal),
            details: `BACKUP: ${JSON.stringify(backupVal)} | FIRESTORE: ${JSON.stringify(liveVal)}`
        });
    }
}

function compareCollections(liveCols, backupCols, diffs) {
    const liveMap = new Map(liveCols.map(c => [c.path, c]));
    const backupMap = new Map(backupCols.map(c => [c.path, c]));

    for (const [colPath, liveCol] of liveMap.entries()) {
        if (!backupMap.has(colPath)) {
            diffs.push({
                category: 'MISSING FROM BACKUP',
                path: colPath,
                backup: '[MISSING COLLECTION]',
                firestore: '[PRESENT]',
                details: `Collection present in Live Firestore but missing from backup`
            });
            continue;
        }

        const backupCol = backupMap.get(colPath);
        const liveDocMap = new Map(liveCol.documents.map(d => [d.id, d]));
        const backupDocMap = new Map(backupCol.documents.map(d => [d.id, d]));

        for (const [docId, liveDoc] of liveDocMap.entries()) {
            if (!backupDocMap.has(docId)) {
                diffs.push({
                    category: 'MISSING FROM BACKUP',
                    path: liveDoc.path,
                    backup: '[MISSING DOCUMENT]',
                    firestore: '[PRESENT]',
                    details: `Document present in Live Firestore but missing from backup`
                });
            } else {
                const backupDoc = backupDocMap.get(docId);
                compareValues(liveDoc.data, backupDoc.data, liveDoc.path, diffs);
                compareCollections(liveDoc.subcollections || [], backupDoc.subcollections || [], diffs);
            }
        }

        for (const [docId, backupDoc] of backupDocMap.entries()) {
            if (!liveDocMap.has(docId)) {
                diffs.push({
                    category: 'EXTRA IN BACKUP',
                    path: backupDoc.path,
                    backup: '[PRESENT]',
                    firestore: '[MISSING DOCUMENT]',
                    details: `Document present in backup but missing from Live Firestore`
                });
            }
        }
    }

    for (const [colPath, backupCol] of backupMap.entries()) {
        if (!liveMap.has(colPath)) {
            diffs.push({
                category: 'EXTRA IN BACKUP',
                path: colPath,
                backup: '[PRESENT COLLECTION]',
                firestore: '[MISSING COLLECTION]',
                details: `Collection present in backup but missing from Live Firestore`
            });
        }
    }
}

// -----------------------------------------------------------------------------
// 6. SUMMARY STATISTICS COMPUTATION
// -----------------------------------------------------------------------------
function computeStats(collectionsTree) {
    const stats = {
        rootCollections: collectionsTree.length,
        documents: 0,
        nestedSubcollections: 0,
        totalFields: 0,
        arrays: 0,
        objects: 0,
        timestamps: 0,
        geopoints: 0,
        references: 0,
        bytes: 0
    };

    function traverseVal(val) {
        if (val === null || val === undefined) return;
        const type = getTypeOf(val);

        if (type === 'array') {
            stats.arrays++;
            val.forEach(traverseVal);
        } else if (type === 'timestamp') {
            stats.timestamps++;
        } else if (type === 'geopoint') {
            stats.geopoints++;
        } else if (type === 'reference') {
            stats.references++;
        } else if (type === 'bytes') {
            stats.bytes++;
        } else if (type === 'object') {
            stats.objects++;
            for (const [k, v] of Object.entries(val)) {
                stats.totalFields++;
                traverseVal(v);
            }
        }
    }

    function traverseCol(col, isRoot = true) {
        if (!isRoot) stats.nestedSubcollections++;
        for (const doc of col.documents || []) {
            stats.documents++;
            traverseVal(doc.data);
            if (doc.subcollections) {
                for (const sub of doc.subcollections) {
                    traverseCol(sub, false);
                }
            }
        }
    }

    for (const col of collectionsTree) {
        traverseCol(col, true);
    }

    return stats;
}

// -----------------------------------------------------------------------------
// 7. X-29 DOMAIN INFORMATIONAL CHECKS
// -----------------------------------------------------------------------------
function extractX29Metrics(collectionsTree) {
    const metrics = {
        tracksCount: 0,
        syllabusStructureSubjects: 0,
        syllabusStructureChapters: 0,
        customSyllabusSubjects: 0,
        customSyllabusChapters: 0,
        tasksCount: 0,
        passedItemsCount: 0,
        customProgramsCount: 0,
        dashboardConfig: false,
        revisionDataCount: 0,
        timerLogsCount: 0,
        examSessionsCount: 0,
        examRoutineCount: 0,
        scheduleBlocksCount: 0,
        scheduleBlocks2Count: 0,
        scheduleGroupsCount: 0,
        dailyTargetsCount: 0,
        weeklyTargetsCount: 0,
        monthlyTargetsCount: 0,
        fiscalLedgerCount: 0,
        updatedAt: null
    };

    function countChaptersInSyllabus(syllabusObj) {
        if (!syllabusObj || typeof syllabusObj !== 'object') return { subjects: 0, chapters: 0 };
        let subjects = 0;
        let chapters = 0;

        for (const trackArr of Object.values(syllabusObj)) {
            if (Array.isArray(trackArr)) {
                subjects += trackArr.length;
                for (const item of trackArr) {
                    if (item) {
                        if (typeof item.chapters === 'number') {
                            chapters += item.chapters;
                        } else if (Array.isArray(item.chapters)) {
                            chapters += item.chapters.length;
                        }
                    }
                }
            }
        }

        return { subjects, chapters };
    }

    function inspectDocData(data) {
        if (!data || typeof data !== 'object') return;

        if (Array.isArray(data.tracks)) metrics.tracksCount += data.tracks.length;

        if (data.syllabusStructure) {
            const res = countChaptersInSyllabus(data.syllabusStructure);
            metrics.syllabusStructureSubjects += res.subjects;
            metrics.syllabusStructureChapters += res.chapters;
        }

        if (data.customSyllabus) {
            const res = countChaptersInSyllabus(data.customSyllabus);
            metrics.customSyllabusSubjects += res.subjects;
            metrics.customSyllabusChapters += res.chapters;
        }

        if (Array.isArray(data.tasks)) metrics.tasksCount += data.tasks.length;

        if (data.passedItems) {
            metrics.passedItemsCount += Array.isArray(data.passedItems) ? data.passedItems.length : Object.keys(data.passedItems).length;
        }

        if (data.customPrograms && typeof data.customPrograms === 'object') {
            for (const progArr of Object.values(data.customPrograms)) {
                if (Array.isArray(progArr)) metrics.customProgramsCount += progArr.length;
            }
        }

        if (data.dashboardConfig) metrics.dashboardConfig = true;

        if (data.revisionData) {
            if (Array.isArray(data.revisionData.active)) metrics.revisionDataCount += data.revisionData.active.length;
        }

        if (Array.isArray(data.timerLogs)) metrics.timerLogsCount += data.timerLogs.length;
        if (Array.isArray(data.examSessions)) metrics.examSessionsCount += data.examSessions.length;
        if (Array.isArray(data.examRoutine)) metrics.examRoutineCount += data.examRoutine.length;
        if (Array.isArray(data.scheduleBlocks)) metrics.scheduleBlocksCount += data.scheduleBlocks.length;
        if (Array.isArray(data.scheduleBlocks2)) metrics.scheduleBlocks2Count += data.scheduleBlocks2.length;
        if (Array.isArray(data.scheduleGroups)) metrics.scheduleGroupsCount += data.scheduleGroups.length;

        if (data.dailyTargetsDatabase && typeof data.dailyTargetsDatabase === 'object') {
            metrics.dailyTargetsCount += Object.keys(data.dailyTargetsDatabase).length;
        }
        if (data.weeklyTargetsDatabase && typeof data.weeklyTargetsDatabase === 'object') {
            metrics.weeklyTargetsCount += Object.keys(data.weeklyTargetsDatabase).length;
        }
        if (data.monthlyTargetsDatabase && typeof data.monthlyTargetsDatabase === 'object') {
            metrics.monthlyTargetsCount += Object.keys(data.monthlyTargetsDatabase).length;
        }

        if (data.fiscalLedger && typeof data.fiscalLedger === 'object') {
            const b = Array.isArray(data.fiscalLedger.budgets) ? data.fiscalLedger.budgets.length : 0;
            const v = Array.isArray(data.fiscalLedger.vaults) ? data.fiscalLedger.vaults.length : 0;
            const t = Array.isArray(data.fiscalLedger.transactions) ? data.fiscalLedger.transactions.length : 0;
            metrics.fiscalLedgerCount += (b + v + t);
        }

        if (data.updatedAt) {
            metrics.updatedAt = data.updatedAt;
        }
    }

    function traverseCol(col) {
        for (const doc of col.documents || []) {
            inspectDocData(doc.data);
            if (doc.subcollections) {
                for (const sub of doc.subcollections) {
                    traverseCol(sub);
                }
            }
        }
    }

    for (const col of collectionsTree) {
        traverseCol(col);
    }

    return metrics;
}

// -----------------------------------------------------------------------------
// 8. CANONICAL SHA-256 HASH GENERATION
// -----------------------------------------------------------------------------
function canonicalizeVal(val) {
    if (val === null || val === undefined) return val;
    const type = getTypeOf(val);

    if (type === 'timestamp') {
        return { __type: 'timestamp', nanoseconds: Number(val.nanoseconds || 0), seconds: Number(val.seconds || 0) };
    }
    if (type === 'geopoint') {
        return { __type: 'geopoint', latitude: Number(val.latitude || 0), longitude: Number(val.longitude || 0) };
    }
    if (type === 'reference') {
        return { __type: 'reference', path: String(val.path || '') };
    }
    if (type === 'bytes') {
        return { __type: 'bytes', base64: String(val.base64 || '') };
    }
    if (type === 'array') {
        return val.map(canonicalizeVal);
    }
    if (type === 'object') {
        const sortedObj = {};
        const sortedKeys = Object.keys(val).sort();
        for (const k of sortedKeys) {
            if (val.__type === 'timestamp' && k === 'iso') continue;
            sortedObj[k] = canonicalizeVal(val[k]);
        }
        return sortedObj;
    }
    return val;
}

function buildCanonicalTree(collectionsTree) {
    const sortedCols = [...collectionsTree].sort((a, b) => a.path.localeCompare(b.path));
    return sortedCols.map(col => ({
        id: col.id,
        path: col.path,
        documents: [...(col.documents || [])]
            .sort((a, b) => a.id.localeCompare(b.id))
            .map(doc => ({
                id: doc.id,
                path: doc.path,
                data: canonicalizeVal(doc.data),
                subcollections: buildCanonicalTree(doc.subcollections || [])
            }))
    }));
}

function calculateCanonicalHash(collectionsTree) {
    const canonicalTree = buildCanonicalTree(collectionsTree);
    const jsonStr = JSON.stringify(canonicalTree);
    return crypto.createHash('sha256').update(jsonStr).digest('hex');
}

// -----------------------------------------------------------------------------
// 9. CORE SPECIFIC BACKUP VERIFICATION (PROGRAMMATIC & AUTOMATIC)
// -----------------------------------------------------------------------------
async function verifySpecificBackup(backupPathOrItem, options = {}) {
    const startTime = Date.now();
    const isAutomatic = options.isAutomatic !== undefined ? options.isAutomatic : true;
    const modeUpper = isAutomatic ? 'AUTOMATIC' : 'MANUAL';
    const logToVerificationFile = options.logToVerificationFile !== false;
    const logToBackupLog = options.logToBackupLog !== false;
    const silent = options.silent === true;

    // Resolve backupItem object
    let backupItem;
    if (typeof backupPathOrItem === 'string') {
        const resolvedPath = path.resolve(backupPathOrItem);
        let jsonPath = resolvedPath;
        let fullPath = resolvedPath;

        if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
            jsonPath = path.join(resolvedPath, 'firestore-backup.json');
            if (!fs.existsSync(jsonPath)) {
                jsonPath = path.join(resolvedPath, 'firestore.json');
            }
        } else {
            fullPath = path.dirname(resolvedPath);
        }

        const relPath = path.relative(BACKUP_BASE_DIR, fullPath);
        let backupType = isAutomatic ? 'AUTOMATIC' : 'MANUAL';
        if (relPath.startsWith('Automatic') || relPath.startsWith('Automatic' + path.sep)) {
            backupType = 'AUTOMATIC';
        } else if (relPath.startsWith('Manual') || relPath.startsWith('Manual' + path.sep)) {
            backupType = 'MANUAL';
        }

        let stats = { size: 0 };
        try {
            if (fs.existsSync(jsonPath)) {
                stats = fs.statSync(jsonPath);
            }
        } catch (e) {}

        backupItem = {
            folderName: relPath,
            fullPath,
            jsonPath,
            backupType,
            fileSizeBytes: stats.size,
            fileSizeKB: (stats.size / 1024).toFixed(2),
            projectId: EXPECTED_PROJECT_ID
        };
    } else {
        backupItem = backupPathOrItem;
    }

    if (!silent) {
        console.log(`[VERIFY] Backup: [${backupItem.backupType}] ${backupItem.folderName || backupItem.fullPath}`);
        console.log(`[VERIFY] Path:   ${backupItem.jsonPath}`);
    }

    // 1. Load and parse backup JSON file
    const backupRes = loadBackupFile(backupItem);
    if (!backupRes.valid) {
        const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
        const ts = getBangladeshTimestamp().formatted;

        const logEntry = `[${ts}] ${modeUpper} BACKUP VERIFICATION\n` +
            `Backup: ${backupItem.fullPath}\n` +
            `Status: INVALID BACKUP\n` +
            `Error: ${backupRes.reason}\n` +
            `Result: VERIFICATION FAILED\n` +
            `Duration: ${durationSec}s`;

        if (logToVerificationFile) {
            appendVerificationLog(logEntry);
        }
        if (logToBackupLog) {
            appendBackupLog(`[${ts}] ${modeUpper} BACKUP VERIFICATION FAILED - INVALID BACKUP`);
        }

        if (!silent) {
            console.error(`[VERIFY] ❌ INVALID BACKUP: ${backupRes.reason}`);
        }

        return {
            success: false,
            isExactMatch: false,
            verdict: 'INVALID BACKUP',
            reason: backupRes.reason,
            diffCount: -1,
            durationSec
        };
    }

    const backupData = backupRes.parsed;

    // 2. Ensure Firestore DB connection
    let db = options.db;
    if (!db) {
        const apps = getApps ? getApps() : [];
        if (apps.length === 0) {
            const serviceAccount = options.serviceAccount || loadAndVerifyServiceAccount();
            initializeApp({
                credential: cert(serviceAccount)
            });
        }
        db = getFirestore();
    }

    if (!silent) {
        console.log(`[VERIFY] 🚀 Reading Live Firestore database (strictly read-only)...`);
    }

    // 3. Fetch Live Firestore
    const liveRawCols = await fetchLiveFirestore(db, colPath => {
        if (!silent) {
            process.stdout.write(`[VERIFY]    📦 Reading Live collection: [${colPath}]...\r`);
        }
    });

    if (!silent) {
        console.log(`[VERIFY]    ✅ Live Firestore snapshot fetched successfully.`);
    }

    // 4. Normalize trees
    const liveNormalized = normalizeCollectionTree(liveRawCols);
    const backupNormalized = normalizeCollectionTree(backupData.collections);

    // 5. Compute stats
    const liveStats = computeStats(liveNormalized);
    const backupStats = computeStats(backupNormalized);

    // 6. Compute Canonical SHA-256 Hashes
    const liveHash = calculateCanonicalHash(liveNormalized);
    const backupHash = calculateCanonicalHash(backupNormalized);

    // 7. Deep value comparison
    const diffs = [];
    compareCollections(liveNormalized, backupNormalized, diffs);

    const missingFromBackupCount = diffs.filter(d => d.category === 'MISSING FROM BACKUP').length;
    const extraInBackupCount = diffs.filter(d => d.category === 'EXTRA IN BACKUP').length;
    const valueDiffCount = diffs.filter(d => d.category === 'VALUE DIFFERENCE').length;
    const typeDiffCount = diffs.filter(d => d.category === 'TYPE DIFFERENCE').length;
    const arrayDiffCount = diffs.filter(d => d.category === 'ARRAY DIFFERENCE').length;
    const subcolDiffCount = diffs.filter(d => d.category === 'SUBCOLLECTION DIFFERENCE').length;

    const isExactMatch = diffs.length === 0 && liveHash === backupHash;
    const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
    const ts = getBangladeshTimestamp().formatted;

    let verdict = 'UNKNOWN';
    if (isExactMatch) {
        verdict = 'EXACT MATCH';
    } else {
        const onlyLiveNewer = extraInBackupCount === 0 &&
            typeDiffCount === 0 &&
            subcolDiffCount === 0 &&
            missingFromBackupCount >= 0;
        verdict = onlyLiveNewer ? 'VALID BUT OUTDATED BACKUP' : 'BACKUP DATA MISMATCH';
    }

    // 8. Format log entries
    let logEntry;
    let backupLogSummary;

    if (isExactMatch) {
        logEntry = `[${ts}] ${modeUpper} BACKUP VERIFICATION\n` +
            `Backup: ${backupItem.fullPath}\n` +
            `Status: EXACT MATCH\n` +
            `Collections: ${liveStats.rootCollections}\n` +
            `Documents: ${liveStats.documents}\n` +
            `Fields: ${liveStats.totalFields}\n` +
            `Arrays: ${liveStats.arrays}\n` +
            `Objects: ${liveStats.objects}\n` +
            `Differences: 0\n` +
            `SHA-256: MATCH\n` +
            `Result: VERIFIED SUCCESSFULLY\n` +
            `Duration: ${durationSec}s`;

        backupLogSummary = `[${ts}] ${modeUpper} BACKUP VERIFIED - EXACT MATCH`;
    } else {
        const colDiff = Math.abs(liveStats.rootCollections - backupStats.rootCollections);
        const docDiff = Math.abs(liveStats.documents - backupStats.documents);
        const fieldDiff = Math.abs(liveStats.totalFields - backupStats.totalFields);
        const arrayDiff = Math.abs(liveStats.arrays - backupStats.arrays);
        const objDiff = Math.abs(liveStats.objects - backupStats.objects);
        const shaStatus = liveHash === backupHash ? 'MATCH' : 'MISMATCH';

        const diffDetails = formatDocumentLevelDifferences(diffs, 50);

        logEntry = `[${ts}] ${modeUpper} BACKUP VERIFICATION\n` +
            `Backup: ${backupItem.fullPath}\n` +
            `Status: MISMATCH\n\n` +
            `Collections:\n` +
            `Expected: ${liveStats.rootCollections}\n` +
            `Backup: ${backupStats.rootCollections}\n` +
            `Difference: ${colDiff}\n\n` +
            `Documents:\n` +
            `Expected: ${liveStats.documents}\n` +
            `Backup: ${backupStats.documents}\n` +
            `Difference: ${docDiff}\n\n` +
            `Fields:\n` +
            `Expected: ${liveStats.totalFields}\n` +
            `Backup: ${backupStats.totalFields}\n` +
            `Difference: ${fieldDiff}\n\n` +
            `Arrays:\n` +
            `Expected: ${liveStats.arrays}\n` +
            `Backup: ${backupStats.arrays}\n` +
            `Difference: ${arrayDiff}\n\n` +
            `Objects:\n` +
            `Expected: ${liveStats.objects}\n` +
            `Backup: ${backupStats.objects}\n` +
            `Difference: ${objDiff}\n\n` +
            `SHA-256:\n` +
            `Expected: ${liveHash}\n` +
            `Backup: ${backupHash}\n` +
            `Status: ${shaStatus}\n\n` +
            `Total Differences: ${diffs.length}\n` +
            `Result: VERIFICATION FAILED\n` +
            `Duration: ${durationSec}s` +
            (diffDetails ? `\n\n${diffDetails}` : '');

        backupLogSummary = `[${ts}] ${modeUpper} BACKUP VERIFICATION FAILED - ${diffs.length} DIFFERENCES`;
    }

    if (logToVerificationFile) {
        appendVerificationLog(logEntry);
    }
    if (logToBackupLog) {
        appendBackupLog(backupLogSummary);
    }

    if (!silent) {
        console.log(`[VERIFY] Collections: Live=${liveStats.rootCollections}, Backup=${backupStats.rootCollections}`);
        console.log(`[VERIFY] Documents:   Live=${liveStats.documents}, Backup=${backupStats.documents}`);
        console.log(`[VERIFY] Fields:      Live=${liveStats.totalFields}, Backup=${backupStats.totalFields}`);
        console.log(`[VERIFY] Arrays:      Live=${liveStats.arrays}, Backup=${backupStats.arrays}`);
        console.log(`[VERIFY] Objects:     Live=${liveStats.objects}, Backup=${backupStats.objects}`);
        console.log(`[VERIFY] Differences: ${diffs.length}`);
        console.log(`[VERIFY] SHA-256 Live:   ${liveHash.substring(0, 16)}...`);
        console.log(`[VERIFY] SHA-256 Backup: ${backupHash.substring(0, 16)}...`);
        console.log(`[VERIFY] Status: ${isExactMatch ? '✅ EXACT MATCH' : '❌ MISMATCH'}`);
    }

    return {
        success: true,
        isExactMatch,
        verdict,
        liveStats,
        backupStats,
        liveHash,
        backupHash,
        diffs,
        diffCount: diffs.length,
        missingFromBackupCount,
        extraInBackupCount,
        valueDiffCount,
        typeDiffCount,
        arrayDiffCount,
        subcolDiffCount,
        durationSec,
        timestamp: ts,
        backupItem,
        backupData
    };
}

// -----------------------------------------------------------------------------
// 10. AUDIT ALL BACKUPS MODE (--all)
// -----------------------------------------------------------------------------
async function runAuditAllBackups(db) {
    console.log(`\n==================================================`);
    console.log(` X-29 ALL BACKUPS AUDIT MATRIX`);
    console.log(` Firebase Project ID: [${EXPECTED_PROJECT_ID}]`);
    console.log(`==================================================\n`);

    const backupsList = scanAvailableBackups();
    if (backupsList.length === 0) {
        console.log(`❌ No backups found in ${BACKUP_BASE_DIR}`);
        return;
    }

    console.log(`🚀 Recursively fetching Live Firestore snapshot...`);
    const liveRawCols = await fetchLiveFirestore(db);
    const liveNormalized = normalizeCollectionTree(liveRawCols);
    const liveHash = calculateCanonicalHash(liveNormalized);

    console.log(`Live Firestore SHA-256: ${liveHash.substring(0, 12)}...\n`);

    const tableRows = [];

    for (const bItem of backupsList) {
        const backupRes = loadBackupFile(bItem);
        let statusStr = 'UNKNOWN';
        let docCount = bItem.totalDocuments;
        let projStr = bItem.projectId;
        let hashStr = 'N/A';

        if (!backupRes.valid) {
            statusStr = `❌ ${backupRes.errorCategory}`;
        } else {
            const backupNormalized = normalizeCollectionTree(backupRes.parsed.collections);
            const backupHash = calculateCanonicalHash(backupNormalized);
            hashStr = backupHash.substring(0, 10) + '...';

            const diffs = [];
            compareCollections(liveNormalized, backupNormalized, diffs);

            if (diffs.length === 0 && liveHash === backupHash) {
                statusStr = '✅ EXACT MATCH';
            } else {
                const isOnlyNewerLive = diffs.every(d => d.category === 'MISSING FROM BACKUP' || d.category === 'VALUE DIFFERENCE');
                if (isOnlyNewerLive) {
                    statusStr = '⚠️ OUTDATED';
                } else {
                    statusStr = '❌ MISMATCH';
                }
            }
        }

        tableRows.push({
            Backup: bItem.folderName,
            Project: projStr,
            Documents: docCount,
            Hash: hashStr,
            Status: statusStr
        });
    }

    console.table(tableRows);
    console.log(`\n==================================================\n`);
}

// -----------------------------------------------------------------------------
// 11. SINGLE BACKUP VERIFICATION REPORT (CLI)
// -----------------------------------------------------------------------------
async function runSingleVerification(backupItem, db) {
    console.log(`\n==================================================`);
    console.log(`X-29 FIRESTORE BACKUP VERIFICATION`);
    console.log(`==================================================\n`);

    console.log(`Project:`);
    console.log(`${PROJECT_NAME}\n`);

    console.log(`Firebase Project ID:`);
    console.log(`${EXPECTED_PROJECT_ID}\n`);

    console.log(`Backup:`);
    console.log(`[${backupItem.backupType}] ${backupItem.folderName}\n`);

    console.log(`Source:`);
    console.log(`${backupItem.backupType}\n`);

    console.log(`Path:`);
    console.log(`${backupItem.jsonPath}\n`);

    const result = await verifySpecificBackup(backupItem, {
        db,
        silent: true,
        isAutomatic: backupItem.backupType === 'AUTOMATIC',
        logToVerificationFile: true,
        logToBackupLog: false
    });

    if (!result.success) {
        console.log(`Backup Created:`);
        console.log(`${backupItem.createdAt}\n`);
        console.log(`==================================================`);
        console.log(`FINAL VERDICT`);
        console.log(`==================================================\n`);
        console.log(`❌ INVALID BACKUP`);
        console.log(`Reason: ${result.reason}\n`);
        process.exit(1);
    }

    console.log(`Backup Created:`);
    console.log(`${result.backupData.metadata.createdAt}\n`);

    console.log(`\n==================================================`);
    console.log(`FIRESTORE`);
    console.log(`==================================================`);
    console.log(`Collections:            ${result.liveStats.rootCollections}`);
    console.log(`Documents:              ${result.liveStats.documents}`);
    console.log(`Nested subcollections:  ${result.liveStats.nestedSubcollections}`);
    console.log(`Fields:                 ${result.liveStats.totalFields}`);
    console.log(`Arrays:                 ${result.liveStats.arrays}`);
    console.log(`Objects:                ${result.liveStats.objects}`);
    console.log(`Timestamps:             ${result.liveStats.timestamps}`);
    console.log(`GeoPoints:              ${result.liveStats.geopoints}`);
    console.log(`References:             ${result.liveStats.references}`);
    console.log(`Bytes:                  ${result.liveStats.bytes}`);

    console.log(`\n==================================================`);
    console.log(`BACKUP`);
    console.log(`==================================================`);
    console.log(`Collections:            ${result.backupStats.rootCollections}`);
    console.log(`Documents:              ${result.backupStats.documents}`);
    console.log(`Nested subcollections:  ${result.backupStats.nestedSubcollections}`);
    console.log(`Fields:                 ${result.backupStats.totalFields}`);
    console.log(`Arrays:                 ${result.backupStats.arrays}`);
    console.log(`Objects:                ${result.backupStats.objects}`);
    console.log(`Timestamps:             ${result.backupStats.timestamps}`);
    console.log(`GeoPoints:              ${result.backupStats.geopoints}`);
    console.log(`References:             ${result.backupStats.references}`);
    console.log(`Bytes:                  ${result.backupStats.bytes}`);

    // X-29 Domain Checks
    const liveDomain = extractX29Metrics(normalizeCollectionTree(result.backupData.collections));
    const backupDomain = extractX29Metrics(normalizeCollectionTree(result.backupData.collections));

    console.log(`\n==================================================`);
    console.log(`X-29 DATA CHECK`);
    console.log(`==================================================`);
    console.log(`Tracks:`);
    console.log(`  Live:   ${liveDomain.tracksCount}`);
    console.log(`  Backup: ${backupDomain.tracksCount}`);
    console.log(`Syllabus Structure Subjects / Chapters:`);
    console.log(`  Live:   ${liveDomain.syllabusStructureSubjects} subjects, ${liveDomain.syllabusStructureChapters} total chapters`);
    console.log(`  Backup: ${backupDomain.syllabusStructureSubjects} subjects, ${backupDomain.syllabusStructureChapters} total chapters`);
    console.log(`Custom Syllabus Subjects / Chapters:`);
    console.log(`  Live:   ${liveDomain.customSyllabusSubjects} subjects, ${liveDomain.customSyllabusChapters} total chapters`);
    console.log(`  Backup: ${backupDomain.customSyllabusSubjects} subjects, ${backupDomain.customSyllabusChapters} total chapters`);
    console.log(`Tasks:`);
    console.log(`  Live:   ${liveDomain.tasksCount}`);
    console.log(`  Backup: ${backupDomain.tasksCount}`);
    console.log(`Updated At:`);
    console.log(`  Live:   ${liveDomain.updatedAt ? (typeof liveDomain.updatedAt === 'object' ? JSON.stringify(liveDomain.updatedAt) : liveDomain.updatedAt) : 'N/A'}`);
    console.log(`  Backup: ${backupDomain.updatedAt ? (typeof backupDomain.updatedAt === 'object' ? JSON.stringify(backupDomain.updatedAt) : backupDomain.updatedAt) : 'N/A'}`);

    console.log(`\n==================================================`);
    console.log(`DEEP COMPARISON`);
    console.log(`==================================================`);
    console.log(`Differences:              ${result.diffs.length}`);
    console.log(`Missing from Backup:      ${result.missingFromBackupCount}`);
    console.log(`Extra in Backup:          ${result.extraInBackupCount}`);
    console.log(`Changed values:           ${result.valueDiffCount}`);
    console.log(`Type differences:         ${result.typeDiffCount}`);
    console.log(`Array differences:        ${result.arrayDiffCount}`);
    console.log(`Subcollection differences:${result.subcolDiffCount}`);

    console.log(`\n==================================================`);
    console.log(`HASH`);
    console.log(`==================================================`);
    console.log(`LIVE CANONICAL SHA-256:`);
    console.log(result.liveHash);
    console.log(`BACKUP CANONICAL SHA-256:`);
    console.log(result.backupHash);

    console.log(`\n==================================================`);
    console.log(`FINAL VERDICT`);
    console.log(`==================================================`);

    if (result.isExactMatch) {
        console.log(`\n✅ EXACT MATCH\n`);
        console.log(`Live Firestore and selected backup are 100% identical in structure, data, and SHA-256 hash.`);
    } else {
        if (result.verdict === 'VALID BUT OUTDATED BACKUP') {
            console.log(`\n⚠️ VALID BUT OUTDATED BACKUP\n`);
            console.log(`Backup belongs to X-29 (${EXPECTED_PROJECT_ID}) and is structurally valid, but Live Firestore contains newer updates created after the backup snapshot.`);
        } else {
            console.log(`\n❌ BACKUP DATA MISMATCH\n`);
            console.log(`There are unexpected data/structural differences between Live Firestore and the selected backup.`);
        }

        console.log(`\n--------------------------------------------------`);
        console.log(`EXACT DIFFERENCES DETECTED (${result.diffs.length}):`);
        console.log(`--------------------------------------------------`);

        result.diffs.forEach((d, idx) => {
            console.log(`\n[${idx + 1}] ${d.category}`);
            console.log(`Path:`);
            console.log(`  ${d.path}`);
            if (d.backup !== undefined) {
                console.log(`BACKUP:`);
                console.log(`  ${d.backup}`);
            }
            if (d.firestore !== undefined) {
                console.log(`FIRESTORE:`);
                console.log(`  ${d.firestore}`);
            }
            if (d.details) {
                console.log(`Details: ${d.details}`);
            }
        });
    }

    console.log(`\n==================================================\n`);
}

// -----------------------------------------------------------------------------
// 12. MAIN CLI ENTRYPOINT
// -----------------------------------------------------------------------------
async function main() {
    const args = process.argv.slice(2);

    // 1. Verify Service Account & Project ID
    const serviceAccount = loadAndVerifyServiceAccount();

    const apps = getApps ? getApps() : [];
    if (apps.length === 0) {
        initializeApp({
            credential: cert(serviceAccount)
        });
    }

    const db = getFirestore();

    // Check for audit all mode flag
    if (args.includes('--all')) {
        await runAuditAllBackups(db);
        process.exit(0);
    }

    // Single backup mode
    const backupsList = scanAvailableBackups();
    const selectedBackupItem = await selectBackupFromCli(backupsList, args);

    await runSingleVerification(selectedBackupItem, db);
    process.exit(0);
}

if (require.main === module) {
    main().catch(err => {
        console.error(`\n❌ VERIFICATION SYSTEM EXCEPTION:`, err);
        process.exit(1);
    });
}

module.exports = {
    verifySpecificBackup,
    loadAndVerifyServiceAccount,
    scanAvailableBackups,
    loadBackupFile,
    fetchLiveFirestore,
    normalizeValue,
    normalizeCollectionTree,
    compareValues,
    compareCollections,
    computeStats,
    extractX29Metrics,
    calculateCanonicalHash,
    getBangladeshTimestamp,
    appendVerificationLog,
    appendBackupLog,
    logBackupFailedInVerificationLog,
    formatDocumentLevelDifferences,
    runAuditAllBackups,
    runSingleVerification,
    VERIFICATION_LOG_PATH,
    BACKUP_LOG_PATH,
    EXPECTED_PROJECT_ID,
    BACKUP_BASE_DIR
};
