/**
 * X-29 (x-29-advance) Automated & Interactive Real Disaster-Recovery Test Script
 * archive/to-delete/disaster-recovery-test.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, GeoPoint, DocumentReference, Bytes } = require('firebase-admin/firestore');

const CODE_DIR = path.resolve(__dirname, '..', '..');
const X29_ROOT_DIR = path.dirname(CODE_DIR);
const SERVICE_ACCOUNT_PATH = path.join(CODE_DIR, 'firebase-service-account.json');
const BACKUP_BASE_DIR = path.join(X29_ROOT_DIR, 'X-29-Backups');
const EXPECTED_PROJECT_ID = 'x-29-advance';
const PROJECT_NAME = 'X-29';
const MAX_BATCH_SIZE = 400;

// Setup dual-output logger (console + report file)
let reportFileStream = null;

function log(msg = '') {
    console.log(msg);
    if (reportFileStream) {
        reportFileStream.write(msg + '\n');
    }
}

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
// 1. SAFETY & CREDENTIAL VERIFICATION
// -----------------------------------------------------------------------------
function loadAndVerifyServiceAccount() {
    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
        log(`❌ ERROR: Service account file missing at: ${SERVICE_ACCOUNT_PATH}`);
        process.exit(1);
    }
    const content = fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8');
    const serviceAccount = JSON.parse(content);
    const projectId = serviceAccount.project_id || serviceAccount.projectId;

    if (projectId !== EXPECTED_PROJECT_ID) {
        log(`❌ ABORT IMMEDIATELY: serviceAccount project ID [${projectId}] !== expected [${EXPECTED_PROJECT_ID}]`);
        process.exit(1);
    }
    return serviceAccount;
}

function verifyBackupMetadata(backupPath) {
    if (!fs.existsSync(backupPath)) {
        log(`❌ ABORT: Backup missing at: ${backupPath}`);
        process.exit(1);
    }
    const content = fs.readFileSync(backupPath, 'utf8');
    const payload = JSON.parse(content);
    if (!payload.metadata || payload.metadata.projectId !== EXPECTED_PROJECT_ID) {
        log(`❌ ABORT: Backup metadata projectId [${payload.metadata?.projectId}] !== expected [${EXPECTED_PROJECT_ID}]`);
        process.exit(1);
    }
    return payload;
}

// -----------------------------------------------------------------------------
// 2. SERIALIZATION & DESERIALIZATION UTILS
// -----------------------------------------------------------------------------
function serializeFirestoreValue(val) {
    if (val === null || val === undefined) return val;

    if ((Timestamp && val instanceof Timestamp) || (typeof val.toDate === 'function' && typeof val.seconds === 'number')) {
        return {
            __type: 'timestamp',
            seconds: val.seconds,
            nanoseconds: val.nanoseconds || 0,
            iso: val.toDate().toISOString()
        };
    }

    if ((GeoPoint && val instanceof GeoPoint) || (typeof val.latitude === 'number' && typeof val.longitude === 'number' && val.constructor?.name === 'GeoPoint')) {
        return {
            __type: 'geopoint',
            latitude: val.latitude,
            longitude: val.longitude
        };
    }

    if ((DocumentReference && val instanceof DocumentReference) || (val.path && typeof val.collection === 'function' && typeof val.doc === 'function')) {
        return {
            __type: 'reference',
            path: val.path
        };
    }

    if (Buffer.isBuffer(val) || (val && typeof val.toBuffer === 'function') || (val && val.constructor?.name === 'Bytes')) {
        const buffer = Buffer.isBuffer(val) ? val : (typeof val.toBuffer === 'function' ? val.toBuffer() : Buffer.from(val.toUint8Array ? val.toUint8Array() : val));
        return {
            __type: 'bytes',
            base64: buffer.toString('base64')
        };
    }

    if (Array.isArray(val)) {
        return val.map(serializeFirestoreValue);
    }

    if (typeof val === 'object' && val.constructor === Object) {
        const serializedObj = {};
        for (const [k, v] of Object.entries(val)) {
            serializedObj[k] = serializeFirestoreValue(v);
        }
        return serializedObj;
    }

    return val;
}

function deserializeFirestoreValue(val, db) {
    if (val === null || val === undefined) return val;

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
        for (const [k, v] of Object.entries(val)) {
            deserializedObj[k] = deserializeFirestoreValue(v, db);
        }
        return deserializedObj;
    }

    return val;
}

// -----------------------------------------------------------------------------
// 3. RECURSIVE BACKUP FUNCTION
// -----------------------------------------------------------------------------
async function backupCollectionNode(colRef, stats) {
    stats.totalCollections++;
    const snapshot = await colRef.get();
    const docs = [];

    for (const doc of snapshot.docs) {
        stats.totalDocuments++;
        const serializedData = serializeFirestoreValue(doc.data());
        const subColRefs = await doc.ref.listCollections();
        const subcollections = [];

        for (const subColRef of subColRefs) {
            const subColData = await backupCollectionNode(subColRef, stats);
            subcollections.push(subColData);
        }

        docs.push({
            id: doc.id,
            path: doc.ref.path,
            data: serializedData,
            subcollections
        });
    }

    return {
        id: colRef.id,
        path: colRef.path,
        documents: docs
    };
}

async function createSafetyBackup(db, targetFolderName) {
    const stats = { totalCollections: 0, totalDocuments: 0 };
    const rootCols = await db.listCollections();
    const collectionsData = [];

    for (const colRef of rootCols) {
        log(` 📦 Safety Backup: collection [${colRef.id}]...`);
        const colData = await backupCollectionNode(colRef, stats);
        collectionsData.push(colData);
    }

    const now = new Date();
    const targetDir = path.join(BACKUP_BASE_DIR, targetFolderName);
    const targetFilePath = path.join(targetDir, 'firestore-backup.json');

    fs.mkdirSync(targetDir, { recursive: true });

    const payload = {
        metadata: {
            version: 1,
            createdAt: now.toISOString(),
            projectId: EXPECTED_PROJECT_ID,
            totalCollections: stats.totalCollections,
            totalDocuments: stats.totalDocuments,
            isSafetyBackup: true
        },
        collections: collectionsData
    };

    const jsonStr = JSON.stringify(payload, null, 2);
    fs.writeFileSync(targetFilePath, jsonStr, 'utf8');

    log(`💾 Safety Backup created at: ${targetFilePath}`);
    return { targetDir, targetFilePath, stats, payload };
}

// -----------------------------------------------------------------------------
// 4. BATCHED WIPE & RESTORE LOGIC
// -----------------------------------------------------------------------------
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

async function recursiveWipeCollection(colRef, batchQueue, stats) {
    stats.deletedCollections++;
    const snapshot = await colRef.get();

    for (const doc of snapshot.docs) {
        stats.deletedDocuments++;

        const subColRefs = await doc.ref.listCollections();
        for (const subColRef of subColRefs) {
            await recursiveWipeCollection(subColRef, batchQueue, stats);
        }

        await batchQueue.delete(doc.ref);
    }
}

async function wipeFirestoreData(db) {
    const batchQueue = new BatchQueue(db);
    const wipeStats = { deletedCollections: 0, deletedDocuments: 0 };
    const rootCols = await db.listCollections();

    for (const rootColRef of rootCols) {
        log(` 🔥 Wiping Firestore collection: [${rootColRef.id}]...`);
        await recursiveWipeCollection(rootColRef, batchQueue, wipeStats);
    }

    await batchQueue.flush();
    log(`🧹 Wipe complete. Deleted ${wipeStats.deletedDocuments} documents across ${wipeStats.deletedCollections} collections.`);
    return wipeStats;
}

async function restoreCollectionNode(colData, batchQueue, db, stats) {
    stats.restoredCollections++;
    if (!Array.isArray(colData.documents)) return;

    for (const docNode of colData.documents) {
        stats.restoredDocuments++;
        const docRef = db.doc(docNode.path);
        const deserializedData = deserializeFirestoreValue(docNode.data || {}, db);

        await batchQueue.set(docRef, deserializedData);

        if (Array.isArray(docNode.subcollections)) {
            for (const subColData of docNode.subcollections) {
                await restoreCollectionNode(subColData, batchQueue, db, stats);
            }
        }
    }
}

async function fullRestoreFromPayload(payload, db) {
    const batchQueue = new BatchQueue(db);
    const restoreStats = { restoredCollections: 0, restoredDocuments: 0 };

    if (Array.isArray(payload.collections)) {
        for (const colData of payload.collections) {
            log(` 📦 Restoring collection: [${colData.id}]...`);
            await restoreCollectionNode(colData, batchQueue, db, restoreStats);
        }
    }

    await batchQueue.flush();
    log(`✅ Restore complete. Restored ${restoreStats.restoredDocuments} documents across ${restoreStats.restoredCollections} collections.`);
    return restoreStats;
}

// -----------------------------------------------------------------------------
// 5. DEEP VERIFICATION ENGINE
// -----------------------------------------------------------------------------
function getTypeOf(val) {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (Array.isArray(val)) return 'array';

    if (typeof val === 'object') {
        if ((Timestamp && val instanceof Timestamp) || (typeof val.toDate === 'function' && typeof val.seconds === 'number')) return 'timestamp';
        if ((GeoPoint && val instanceof GeoPoint) || (typeof val.latitude === 'number' && typeof val.longitude === 'number' && (val.constructor?.name === 'GeoPoint' || val.__type === 'geopoint'))) return 'geopoint';
        if ((DocumentReference && val instanceof DocumentReference) || (val.path && (typeof val.collection === 'function' || val.__type === 'reference'))) return 'reference';
        if (Buffer.isBuffer(val) || val.__type === 'bytes' || (val && val.constructor?.name === 'Bytes')) return 'bytes';
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

    if (type === 'timestamp') return { __type: 'timestamp', seconds: Number(val.seconds || 0), nanoseconds: Number(val.nanoseconds || 0) };
    if (type === 'geopoint') return { __type: 'geopoint', latitude: Number(val.latitude || 0), longitude: Number(val.longitude || 0) };
    if (type === 'reference') return { __type: 'reference', path: String(val.path || '') };
    if (type === 'bytes') {
        let base64 = '';
        if (Buffer.isBuffer(val)) base64 = val.toString('base64');
        else if (typeof val.base64 === 'string') base64 = val.base64;
        else if (typeof val.toBuffer === 'function') base64 = val.toBuffer().toString('base64');
        else if (val.toUint8Array) base64 = Buffer.from(val.toUint8Array()).toString('base64');
        return { __type: 'bytes', base64 };
    }
    if (type === 'array') return val.map(normalizeValue);
    if (type === 'object') {
        const normalizedObj = {};
        for (const [k, v] of Object.entries(val)) {
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

async function fetchLiveCollection(colRef) {
    const snapshot = await colRef.get();
    const docs = [];

    for (const doc of snapshot.docs) {
        const subColRefs = await doc.ref.listCollections();
        const subcollections = [];
        for (const subColRef of subColRefs) {
            const subColData = await fetchLiveCollection(subColRef);
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

async function fetchLiveFirestore(db) {
    const rootCols = await db.listCollections();
    const collections = [];
    for (const colRef of rootCols) {
        const colData = await fetchLiveCollection(colRef);
        collections.push(colData);
    }
    return collections;
}

function compareValues(liveVal, backupVal, pathStr, diffs) {
    const typeLive = getTypeOf(liveVal);
    const typeBackup = getTypeOf(backupVal);

    if (typeLive !== typeBackup) {
        diffs.push({ category: 'TYPE DIFFERENCE', path: pathStr, backup: typeBackup, firestore: typeLive, details: `Type mismatch [${typeLive}] vs [${typeBackup}]` });
        return;
    }

    if (typeLive === 'timestamp') {
        if (liveVal.seconds !== backupVal.seconds || liveVal.nanoseconds !== backupVal.nanoseconds) {
            diffs.push({ category: 'VALUE DIFFERENCE', path: pathStr, backup: `Timestamp (${backupVal.seconds}.${backupVal.nanoseconds})`, firestore: `Timestamp (${liveVal.seconds}.${liveVal.nanoseconds})` });
        }
        return;
    }
    if (typeLive === 'geopoint') {
        if (liveVal.latitude !== backupVal.latitude || liveVal.longitude !== backupVal.longitude) {
            diffs.push({ category: 'VALUE DIFFERENCE', path: pathStr, backup: `GeoPoint (${backupVal.latitude}, ${backupVal.longitude})`, firestore: `GeoPoint (${liveVal.latitude}, ${liveVal.longitude})` });
        }
        return;
    }
    if (typeLive === 'reference') {
        if (liveVal.path !== backupVal.path) {
            diffs.push({ category: 'VALUE DIFFERENCE', path: pathStr, backup: `Reference [${backupVal.path}]`, firestore: `Reference [${liveVal.path}]` });
        }
        return;
    }
    if (typeLive === 'bytes') {
        if (liveVal.base64 !== backupVal.base64) {
            diffs.push({ category: 'VALUE DIFFERENCE', path: pathStr, backup: `Bytes (${backupVal.base64 ? backupVal.base64.substring(0, 10) : ''})`, firestore: `Bytes (${liveVal.base64 ? liveVal.base64.substring(0, 10) : ''})` });
        }
        return;
    }

    if (typeLive === 'array') {
        if (liveVal.length !== backupVal.length) {
            diffs.push({ category: 'ARRAY DIFFERENCE', path: pathStr, backup: `Length ${backupVal.length}`, firestore: `Length ${liveVal.length}` });
        }
        const maxLen = Math.max(liveVal.length, backupVal.length);
        for (let i = 0; i < maxLen; i++) {
            const itemPath = `${pathStr}[${i}]`;
            if (i >= liveVal.length) {
                diffs.push({ category: 'EXTRA IN BACKUP', path: itemPath, backup: JSON.stringify(backupVal[i]), firestore: '[MISSING]' });
            } else if (i >= backupVal.length) {
                diffs.push({ category: 'MISSING FROM BACKUP', path: itemPath, backup: '[MISSING]', firestore: JSON.stringify(liveVal[i]) });
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
                diffs.push({ category: 'MISSING FROM BACKUP', path: fieldPath, backup: '[MISSING]', firestore: JSON.stringify(liveVal[k]) });
            } else {
                compareValues(liveVal[k], backupVal[k], fieldPath, diffs);
            }
        }
        for (const k of backupKeys) {
            const fieldPath = `${pathStr}/${k}`;
            if (!(k in liveVal)) {
                diffs.push({ category: 'EXTRA IN BACKUP', path: fieldPath, backup: JSON.stringify(backupVal[k]), firestore: '[MISSING]' });
            }
        }
        return;
    }

    if (liveVal !== backupVal) {
        diffs.push({ category: 'VALUE DIFFERENCE', path: pathStr, backup: JSON.stringify(backupVal), firestore: JSON.stringify(liveVal) });
    }
}

function compareCollections(liveCols, backupCols, diffs) {
    const liveMap = new Map(liveCols.map(c => [c.path, c]));
    const backupMap = new Map(backupCols.map(c => [c.path, c]));

    for (const [colPath, liveCol] of liveMap.entries()) {
        if (!backupMap.has(colPath)) {
            diffs.push({ category: 'MISSING FROM BACKUP', path: colPath, backup: '[MISSING COLLECTION]', firestore: '[PRESENT]' });
            continue;
        }
        const backupCol = backupMap.get(colPath);
        const liveDocMap = new Map(liveCol.documents.map(d => [d.id, d]));
        const backupDocMap = new Map(backupCol.documents.map(d => [d.id, d]));

        for (const [docId, liveDoc] of liveDocMap.entries()) {
            if (!backupDocMap.has(docId)) {
                diffs.push({ category: 'MISSING FROM BACKUP', path: liveDoc.path, backup: '[MISSING DOCUMENT]', firestore: '[PRESENT]' });
            } else {
                const backupDoc = backupDocMap.get(docId);
                compareValues(liveDoc.data, backupDoc.data, liveDoc.path, diffs);
                compareCollections(liveDoc.subcollections || [], backupDoc.subcollections || [], diffs);
            }
        }
        for (const [docId, backupDoc] of backupDocMap.entries()) {
            if (!liveDocMap.has(docId)) {
                diffs.push({ category: 'EXTRA IN BACKUP', path: backupDoc.path, backup: '[PRESENT]', firestore: '[MISSING DOCUMENT]' });
            }
        }
    }

    for (const [colPath, backupCol] of backupMap.entries()) {
        if (!liveMap.has(colPath)) {
            diffs.push({ category: 'EXTRA IN BACKUP', path: colPath, backup: '[PRESENT COLLECTION]', firestore: '[MISSING COLLECTION]' });
        }
    }
}

function canonicalizeVal(val) {
    if (val === null || val === undefined) return val;
    const type = getTypeOf(val);

    if (type === 'timestamp') return { __type: 'timestamp', nanoseconds: Number(val.nanoseconds || 0), seconds: Number(val.seconds || 0) };
    if (type === 'geopoint') return { __type: 'geopoint', latitude: Number(val.latitude || 0), longitude: Number(val.longitude || 0) };
    if (type === 'reference') return { __type: 'reference', path: String(val.path || '') };
    if (type === 'bytes') return { __type: 'bytes', base64: String(val.base64 || '') };
    if (type === 'array') return val.map(canonicalizeVal);
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
        documents: [...(col.documents || [])].sort((a, b) => a.id.localeCompare(b.id)).map(doc => ({
            id: doc.id,
            path: doc.path,
            data: canonicalizeVal(doc.data),
            subcollections: buildCanonicalTree(doc.subcollections || [])
        }))
    }));
}

function calculateCanonicalHash(collectionsTree) {
    const canonicalTree = buildCanonicalTree(collectionsTree);
    return crypto.createHash('sha256').update(JSON.stringify(canonicalTree)).digest('hex');
}

function extractX29Metrics(collectionsTree) {
    const metrics = {
        tracksCount: 0,
        tracks: [],
        syllabusStructureSubjects: 0,
        syllabusStructureChapters: 0,
        customSyllabusSubjects: 0,
        customSyllabusChapters: 0,
        tasksCount: 0,
        timerLogsCount: 0,
        examSessionsCount: 0,
        examRoutineCount: 0,
        scheduleBlocksCount: 0,
        scheduleBlocks2Count: 0,
        scheduleGroupsCount: 0,
        dailyTargetsCount: 0,
        weeklyTargetsCount: 0,
        fiscalLedgerCount: 0,
        passedItemsCount: 0,
        revisionDataCount: 0,
        customProgramsCount: 0,
        dashboardConfig: false,
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
                        if (typeof item.chapters === 'number') chapters += item.chapters;
                        else if (Array.isArray(item.chapters)) chapters += item.chapters.length;
                    }
                }
            }
        }
        return { subjects, chapters };
    }

    function inspectDocData(data) {
        if (!data || typeof data !== 'object') return;

        if (Array.isArray(data.tracks)) {
            metrics.tracksCount += data.tracks.length;
            metrics.tracks = data.tracks.map(t => t.name || t.id || t);
        }

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
        if (Array.isArray(data.timerLogs)) metrics.timerLogsCount += data.timerLogs.length;
        if (Array.isArray(data.examSessions)) metrics.examSessionsCount += data.examSessions.length;
        if (Array.isArray(data.examRoutine)) metrics.examRoutineCount += data.examRoutine.length;
        if (Array.isArray(data.scheduleBlocks)) metrics.scheduleBlocksCount += data.scheduleBlocks.length;
        if (Array.isArray(data.scheduleBlocks2)) metrics.scheduleBlocks2Count += data.scheduleBlocks2.length;
        if (Array.isArray(data.scheduleGroups)) metrics.scheduleGroupsCount += data.scheduleGroups.length;

        if (data.dailyTargetsDatabase && typeof data.dailyTargetsDatabase === 'object') metrics.dailyTargetsCount += Object.keys(data.dailyTargetsDatabase).length;
        if (data.weeklyTargetsDatabase && typeof data.weeklyTargetsDatabase === 'object') metrics.weeklyTargetsCount += Object.keys(data.weeklyTargetsDatabase).length;
        if (data.passedItems) metrics.passedItemsCount += Array.isArray(data.passedItems) ? data.passedItems.length : Object.keys(data.passedItems).length;

        if (data.revisionData && Array.isArray(data.revisionData.active)) metrics.revisionDataCount += data.revisionData.active.length;
        if (data.customPrograms && typeof data.customPrograms === 'object') {
            for (const progArr of Object.values(data.customPrograms)) {
                if (Array.isArray(progArr)) metrics.customProgramsCount += progArr.length;
            }
        }

        if (data.dashboardConfig) metrics.dashboardConfig = true;
        if (data.updatedAt) metrics.updatedAt = data.updatedAt;
    }

    for (const col of collectionsTree) {
        for (const doc of col.documents || []) {
            inspectDocData(doc.data);
        }
    }

    return metrics;
}

async function verifyLiveAgainstBackup(db, backupPayload, labelStr) {
    log(`\n==================================================`);
    log(`DEEP VERIFICATION REPORT: [${labelStr}]`);
    log(`==================================================`);

    const liveRawCols = await fetchLiveFirestore(db);
    const liveNormalized = normalizeCollectionTree(liveRawCols);
    const backupNormalized = normalizeCollectionTree(backupPayload.collections);

    const liveHash = calculateCanonicalHash(liveNormalized);
    const backupHash = calculateCanonicalHash(backupNormalized);

    const diffs = [];
    compareCollections(liveNormalized, backupNormalized, diffs);

    const liveDomain = extractX29Metrics(liveNormalized);
    const backupDomain = extractX29Metrics(backupNormalized);

    log(`Tracks:                 Live: ${liveDomain.tracksCount} (${liveDomain.tracks.join(', ')}) | Backup: ${backupDomain.tracksCount} (${backupDomain.tracks.join(', ')})`);
    log(`Syllabus Chapters:      Live: ${liveDomain.syllabusStructureChapters} | Backup: ${backupDomain.syllabusStructureChapters}`);
    log(`Custom Syllabus Ch:     Live: ${liveDomain.customSyllabusChapters} | Backup: ${backupDomain.customSyllabusChapters}`);
    log(`Tasks Count:            Live: ${liveDomain.tasksCount} | Backup: ${backupDomain.tasksCount}`);
    log(`Timer Logs Count:       Live: ${liveDomain.timerLogsCount} | Backup: ${backupDomain.timerLogsCount}`);
    log(`Updated At:             Live: ${JSON.stringify(liveDomain.updatedAt)} | Backup: ${JSON.stringify(backupDomain.updatedAt)}`);

    log(`\nLIVE SHA-256:   ${liveHash}`);
    log(`BACKUP SHA-256: ${backupHash}`);
    log(`Total Differences Detected: ${diffs.length}`);

    let isExact = (diffs.length === 0 && liveHash === backupHash);

    if (isExact) {
        log(`\nVERDICT: ✅ EXACT MATCH`);
    } else {
        log(`\nVERDICT: ❌ MISMATCH / OUTDATED (${diffs.length} differences)`);
        diffs.slice(0, 10).forEach((d, idx) => {
            log(` [${idx + 1}] ${d.category} at ${d.path}`);
        });
        if (diffs.length > 10) log(` ... and ${diffs.length - 10} more differences.`);
    }

    log(`==================================================\n`);

    return {
        isExact,
        diffs,
        liveHash,
        backupHash,
        liveDomain,
        backupDomain
    };
}

// -----------------------------------------------------------------------------
// MAIN EXECUTION CONTROLLER
// -----------------------------------------------------------------------------
async function runDisasterRecoveryTest() {
    const pad = (n) => String(n).padStart(2, '0');
    const now = new Date();
    const tsStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

    const reportPath = path.join(BACKUP_BASE_DIR, `disaster-recovery-test-${tsStr}.txt`);
    reportFileStream = fs.createWriteStream(reportPath, { flags: 'a' });

    log(`==================================================`);
    log(` X-29 REAL DISASTER RECOVERY VERIFICATION TEST`);
    log(` Time: ${now.toISOString()}`);
    log(`==================================================\n`);

    // 1. Verify Service Account & Project ID
    const serviceAccount = loadAndVerifyServiceAccount();
    log(`✅ Firebase Service Account Verified: [${EXPECTED_PROJECT_ID}]`);

    // 2. Discover Available Backups
    const entries = fs.readdirSync(BACKUP_BASE_DIR, { withFileTypes: true });
    const backupDirs = entries
        .filter(entry => entry.isDirectory() && fs.existsSync(path.join(BACKUP_BASE_DIR, entry.name, 'firestore-backup.json')))
        .map(entry => entry.name)
        .sort();

    if (backupDirs.length < 2) {
        log(`❌ ABORT: Disaster recovery test requires at least 2 existing backups (Old and Latest). Found ${backupDirs.length}.`);
        process.exit(1);
    }

    const oldBackupFolderName = backupDirs[0]; // Oldest
    const latestBackupFolderName = backupDirs[backupDirs.length - 1]; // Newest

    const oldBackupPath = path.join(BACKUP_BASE_DIR, oldBackupFolderName, 'firestore-backup.json');
    const latestBackupPath = path.join(BACKUP_BASE_DIR, latestBackupFolderName, 'firestore-backup.json');

    const oldBackupPayload = verifyBackupMetadata(oldBackupPath);
    const latestBackupPayload = verifyBackupMetadata(latestBackupPath);

    log(`📂 Selected OLD Backup:    [${oldBackupFolderName}] (${oldBackupPayload.metadata.createdAt})`);
    log(`📂 Selected LATEST Backup: [${latestBackupFolderName}] (${latestBackupPayload.metadata.createdAt})`);

    // Initialize Firestore DB
    initializeApp({ credential: cert(serviceAccount) });
    const db = getFirestore();

    // 3. Display Safety Pre-Checks Required by Requirement M
    const liveRootCols = await db.listCollections();
    const colNames = liveRootCols.map(c => c.id);
    let initialDocCount = 0;
    for (const cRef of liveRootCols) {
        const snap = await cRef.get();
        initialDocCount += snap.size;
    }

    const safetyFolderName = `${tsStr}_SAFETY`;
    const safetyFolderPath = path.join(BACKUP_BASE_DIR, safetyFolderName);

    log(`\n==================================================`);
    log(` SAFETY PRE-CHECKS & PROPOSED EXECUTION PLAN`);
    log(`==================================================`);
    log(` 1. Firebase Project ID:     ${EXPECTED_PROJECT_ID}`);
    log(` 2. Target Collection(s):     [${colNames.join(', ')}]`);
    log(` 3. Live Document Count:     ${initialDocCount}`);
    log(` 4. Safety Backup Target:    X-29-Backups/${safetyFolderName}`);
    log(` 5. Old Backup Target:       X-29-Backups/${oldBackupFolderName}`);
    log(` 6. Latest Backup Target:    X-29-Backups/${latestBackupFolderName}`);
    log(` 7. Proposed Test Sequence:`);
    log(`    Step 1: Create SAFETY BACKUP of current Live Firestore.`);
    log(`    Step 2: Deeply verify SAFETY BACKUP vs Live Firestore (must yield EXACT MATCH).`);
    log(`    Step 3: Prompt user for explicit text confirmation: "DELETE X-29 AND RUN DISASTER RECOVERY TEST".`);
    log(`    Step 4: FULL WIPE of Firestore collection(s) [${colNames.join(', ')}].`);
    log(`    Step 5: Verify Firestore document count is 0.`);
    log(`    Step 6: FULL RESTORE of OLD BACKUP [${oldBackupFolderName}].`);
    log(`    Step 7: Deeply verify Live Firestore vs OLD BACKUP (must match OLD snapshot).`);
    log(`    Step 8: Prompt user for explicit text confirmation: "CONTINUE TO LATEST".`);
    log(`    Step 9: FULL WIPE of Firestore.`);
    log(`    Step 10: FULL RESTORE of LATEST BACKUP [${latestBackupFolderName}].`);
    log(`    Step 11: Deeply verify Live Firestore vs LATEST BACKUP (must yield EXACT MATCH).`);
    log(`    Step 12: Output final PASS/FAIL summary audit report.`);
    log(`==================================================\n`);

    // Check if CLI flag --exec was passed to run the interactive prompts
    if (!process.argv.includes('--exec')) {
        log(`ℹ️ Plan inspection complete. Run with '--exec' flag after user confirmation to execute the test sequence.`);
        process.exit(0);
    }

    // -------------------------------------------------------------------------
    // STEP 1: CREATE SAFETY BACKUP
    // -------------------------------------------------------------------------
    log(`🚀 STEP 1: Creating Safety Backup of current Live Firestore...`);
    const safetyRes = await createSafetyBackup(db, safetyFolderName);

    // -------------------------------------------------------------------------
    // STEP 2: VERIFY SAFETY BACKUP VS LIVE FIRESTORE
    // -------------------------------------------------------------------------
    log(`\n🔍 STEP 2: Verifying Safety Backup against Live Firestore...`);
    const safetyVerif = await verifyLiveAgainstBackup(db, safetyRes.payload, `SAFETY BACKUP [${safetyFolderName}]`);

    if (!safetyVerif.isExact) {
        log(`❌ ABORTING TEST: Safety backup does not exactly match live Firestore database.`);
        process.exit(1);
    }
    log(`✅ Safety backup verified successfully with 100% exact match.`);

    // -------------------------------------------------------------------------
    // STEP 3: EXPLICIT CONFIRMATION PROMPT 1
    // -------------------------------------------------------------------------
    log(`\n==================================================`);
    log(`⚠️ ATTENTION: DESTRUCTIVE OPERATION AHEAD!`);
    log(`To proceed with full Firestore wipe, type the exact text:`);
    log(`   DELETE X-29 AND RUN DISASTER RECOVERY TEST`);
    log(`==================================================\n`);

    const confirm1 = await askQuestion(`Enter confirmation text: `);
    if (confirm1 !== 'DELETE X-29 AND RUN DISASTER RECOVERY TEST') {
        log(`\n❌ Confirmation text mismatch ("${confirm1}" !== "DELETE X-29 AND RUN DISASTER RECOVERY TEST"). Test CANCELLED.`);
        log(`No Firestore data was modified or deleted.`);
        process.exit(0);
    }

    // -------------------------------------------------------------------------
    // STEP 4 & 5: FULL WIPE & ZERO DOC VERIFICATION
    // -------------------------------------------------------------------------
    log(`\n🔥 STEP 4: Executing FULL WIPE of Firestore collection(s) [${colNames.join(', ')}]...`);
    await wipeFirestoreData(db);

    log(`\n🔍 STEP 5: Verifying Firestore document count after wipe...`);
    let postWipeCount = 0;
    const postWipeCols = await db.listCollections();
    for (const colRef of postWipeCols) {
        const snap = await colRef.get();
        postWipeCount += snap.size;
    }

    log(`Firestore post-wipe document count: ${postWipeCount}`);
    if (postWipeCount !== 0) {
        log(`❌ ABORTING: Firestore wipe failed to clear all documents.`);
        process.exit(1);
    }
    log(`✅ Firestore successfully verified as completely empty (0 documents).`);

    // -------------------------------------------------------------------------
    // STEP 6: RESTORE OLD BACKUP
    // -------------------------------------------------------------------------
    log(`\n📦 STEP 6: Performing FULL RESTORE of OLD BACKUP [${oldBackupFolderName}]...`);
    await fullRestoreFromPayload(oldBackupPayload, db);

    // -------------------------------------------------------------------------
    // STEP 7: VERIFY OLD BACKUP VS LIVE FIRESTORE
    // -------------------------------------------------------------------------
    log(`\n🔍 STEP 7: Deeply verifying restored database against OLD BACKUP...`);
    const oldVerif = await verifyLiveAgainstBackup(db, oldBackupPayload, `OLD BACKUP [${oldBackupFolderName}]`);

    if (!oldVerif.isExact) {
        log(`❌ DISASTER RECOVERY TEST FAILED ON OLD RESTORE: Restored database does not match old backup.`);
        process.exit(1);
    }
    log(`✅ OLD BACKUP RESTORED AND VERIFIED SUCCESSFULLY.`);

    // -------------------------------------------------------------------------
    // STEP 8: EXPLICIT CONFIRMATION PROMPT 2
    // -------------------------------------------------------------------------
    log(`\n==================================================`);
    log(`OLD BACKUP RESTORED AND VERIFIED.`);
    log(`To proceed with restoring the LATEST backup, type exact text:`);
    log(`   CONTINUE TO LATEST`);
    log(`==================================================\n`);

    const confirm2 = await askQuestion(`Enter confirmation text: `);
    if (confirm2 !== 'CONTINUE TO LATEST') {
        log(`\n❌ Confirmation text mismatch ("${confirm2}" !== "CONTINUE TO LATEST"). Test stopped safely.`);
        log(`Firestore remains restored to OLD BACKUP state [${oldBackupFolderName}].`);
        process.exit(0);
    }

    // -------------------------------------------------------------------------
    // STEP 9 & 10: FULL WIPE & RESTORE LATEST BACKUP
    // -------------------------------------------------------------------------
    log(`\n🔥 STEP 9: Executing FULL WIPE before latest restore...`);
    await wipeFirestoreData(db);

    log(`\n📦 STEP 10: Performing FULL RESTORE of LATEST BACKUP [${latestBackupFolderName}]...`);
    await fullRestoreFromPayload(latestBackupPayload, db);

    // -------------------------------------------------------------------------
    // STEP 11: VERIFY LATEST BACKUP VS LIVE FIRESTORE
    // -------------------------------------------------------------------------
    log(`\n🔍 STEP 11: Deeply verifying restored database against LATEST BACKUP...`);
    const latestVerif = await verifyLiveAgainstBackup(db, latestBackupPayload, `LATEST BACKUP [${latestBackupFolderName}]`);

    // -------------------------------------------------------------------------
    // STEP 12: FINAL SUMMARY & VERDICT
    // -------------------------------------------------------------------------
    log(`\n==================================================`);
    log(` X-29 DISASTER RECOVERY TEST FINAL RESULT`);
    log(`==================================================`);
    log(` Project ID:              ${EXPECTED_PROJECT_ID}`);
    log(` Safety Backup Created:   ${safetyFolderName}`);
    log(` Old Backup Restored:     ${oldBackupFolderName} (Result: ${oldVerif.isExact ? 'EXACT MATCH' : 'FAILED'})`);
    log(` Latest Backup Restored:  ${latestBackupFolderName} (Result: ${latestVerif.isExact ? 'EXACT MATCH' : 'FAILED'})`);
    log(` Final Differences:       ${latestVerif.diffs.length}`);
    log(` Final Hash Match:        ${latestVerif.isExact ? 'YES' : 'NO'}`);
    log(` Detailed Audit Report:   ${reportPath}`);
    log(`--------------------------------------------------`);

    if (safetyVerif.isExact && oldVerif.isExact && latestVerif.isExact) {
        log(`🎉 FINAL VERDICT: ✅ DISASTER RECOVERY TEST PASSED!`);
        log(`   Full database wipe, old backup recovery, and latest snapshot restoration were 100% successful.`);
    } else {
        log(`❌ FINAL VERDICT: DISASTER RECOVERY TEST FAILED.`);
    }
    log(`==================================================\n`);

    process.exit(0);
}

runDisasterRecoveryTest().catch(err => {
    log(`\n❌ DISASTER RECOVERY TEST EXCEPTION: ${err.stack || err.message}`);
    process.exit(1);
});
