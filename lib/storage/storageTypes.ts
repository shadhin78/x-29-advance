/**
 * X-29 Storage Types & Schemas
 */

export interface StorageAdapter {
  getItem: (name: string) => Promise<string | null>;
  setItem: (name: string, value: string) => Promise<void>;
  removeItem: (name: string) => Promise<void>;
}

export const DB_NAME = 'x29_advance_db';
export const DB_VERSION = 1;
export const STORE_KEYVAL = 'keyval';
