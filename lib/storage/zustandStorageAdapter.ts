/**
 * X-29 Zustand IndexedDB Persistence Adapter (lib/storage/zustandStorageAdapter.ts)
 * 
 * Asynchronous StateStorage adapter enabling clean Zustand persist middleware via IndexedDB.
 */

import type { StateStorage } from 'zustand/middleware';
import { idbGet, idbSet, idbDel } from './indexeddb';

export const indexedDBStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await idbGet<string>(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await idbSet(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await idbDel(name);
  },
};

export default indexedDBStorage;
