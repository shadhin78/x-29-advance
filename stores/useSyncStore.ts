/**
 * X-29 Sync Store (stores/useSyncStore.ts)
 */

import { create } from 'zustand';
import type { SyncStatus } from '@/types/sync';
import { getSyncStatus, onSyncStatusChange, flushSyncQueue } from '@/lib/sync/syncService';

interface SyncStoreState {
  status: SyncStatus;
  isOnline: boolean;
  initSyncObserver: () => () => void;
  syncNow: () => Promise<void>;
}

export const useSyncStore = create<SyncStoreState>((set) => ({
  status: 'saved',
  isOnline: typeof window !== 'undefined' ? window.navigator.onLine : true,

  initSyncObserver: () => {
    return onSyncStatusChange((status) => {
      set({
        status,
        isOnline: typeof window !== 'undefined' ? window.navigator.onLine : true,
      });
    });
  },

  syncNow: async () => {
    await flushSyncQueue();
  },
}));
