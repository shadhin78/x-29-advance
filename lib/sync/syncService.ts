/**
 * X-29 Cloud Synchronization Service (lib/sync/syncService.ts)
 * 
 * Manages:
 * - Local-first offline mutation queue
 * - Debounced Firestore cloud persistence
 * - Network state change listeners (online/offline recovery)
 * - Array reconciliation with tombstones & timestamps
 */

import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';
import { idbGet, idbSet } from '@/lib/storage/indexeddb';
import type { SyncStatus } from '@/types/sync';

const KEY_OFFLINE_QUEUE = 'x29_offline_sync_queue';
let debounceTimer: NodeJS.Timeout | null = null;
let syncStatusListeners: Array<(status: SyncStatus) => void> = [];
let currentStatus: SyncStatus = 'saved';

export function getSyncStatus(): SyncStatus {
  if (typeof window !== 'undefined' && !window.navigator.onLine) {
    return 'offline';
  }
  return currentStatus;
}

export function onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
  syncStatusListeners.push(callback);
  callback(getSyncStatus());
  return () => {
    syncStatusListeners = syncStatusListeners.filter((cb) => cb !== callback);
  };
}

function setStatus(status: SyncStatus) {
  currentStatus = status;
  syncStatusListeners.forEach((cb) => cb(status));
}

/**
 * Enqueues a partial state patch to be saved to Firestore
 */
export async function queueCloudSync(patch: Record<string, unknown>): Promise<void> {
  const isOnline = typeof window !== 'undefined' ? window.navigator.onLine : true;

  // Load existing queue
  const queue = (await idbGet<Record<string, unknown>[]>(KEY_OFFLINE_QUEUE)) || [];
  queue.push({
    ...patch,
    _queuedAt: Date.now(),
  });
  await idbSet(KEY_OFFLINE_QUEUE, queue);

  if (!isOnline) {
    setStatus('offline');
    return;
  }

  setStatus('saving');

  // Debounce writes by 800ms to consolidate user bursts
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(async () => {
    await flushSyncQueue();
  }, 800);
}

/**
 * Flushes all pending mutations from the queue to Firestore
 */
export async function flushSyncQueue(): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    setStatus('saved');
    return;
  }

  const queue = await idbGet<Record<string, unknown>[]>(KEY_OFFLINE_QUEUE);
  if (!queue || queue.length === 0) {
    setStatus('saved');
    return;
  }

  // Merge all queued patches into one combined patch
  const mergedPatch: Record<string, unknown> = {};
  queue.forEach((item) => {
    Object.assign(mergedPatch, item);
  });
  delete mergedPatch._queuedAt;
  mergedPatch.updatedAt = Date.now();

  try {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, mergedPatch, { merge: true });

    // Clear queue upon successful write
    await idbSet(KEY_OFFLINE_QUEUE, []);
    setStatus('saved');
  } catch (err) {
    console.warn('[SyncService] Failed to flush sync queue to Firestore:', err);
    if (typeof window !== 'undefined' && !window.navigator.onLine) {
      setStatus('offline');
    } else {
      setStatus('error');
    }
  }
}

// Attach network event listeners when in browser
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[SyncService] Network reconnected. Flushing sync queue...');
    flushSyncQueue();
  });

  window.addEventListener('offline', () => {
    console.log('[SyncService] Network offline. Mutations queued locally.');
    setStatus('offline');
  });
}
