/**
 * X-29 IndexedDB Storage Layer (lib/storage/indexeddb.ts)
 * 
 * Safe, asynchronous IndexedDB abstraction using idb.
 * Guaranteed safe for SSR / Node environments.
 */

import { openDB, type IDBPDatabase } from 'idb';
import { DB_NAME, DB_VERSION, STORE_KEYVAL } from './storageTypes';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> | null {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return null;
  }

  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_KEYVAL)) {
          db.createObjectStore(STORE_KEYVAL);
        }
      },
    });
  }

  return dbPromise;
}

export async function idbGet<T = unknown>(key: string): Promise<T | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const res = await (await db).get(STORE_KEYVAL, key);
    return res !== undefined ? res : null;
  } catch (err) {
    console.warn('[IndexedDB] Get error for key:', key, err);
    return null;
  }
}

export async function idbSet<T = unknown>(key: string, value: T): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await (await db).put(STORE_KEYVAL, value, key);
  } catch (err) {
    console.warn('[IndexedDB] Set error for key:', key, err);
  }
}

export async function idbDel(key: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await (await db).delete(STORE_KEYVAL, key);
  } catch (err) {
    console.warn('[IndexedDB] Delete error for key:', key, err);
  }
}

export async function idbClear(): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await (await db).clear(STORE_KEYVAL);
  } catch (err) {
    console.warn('[IndexedDB] Clear error:', err);
  }
}
