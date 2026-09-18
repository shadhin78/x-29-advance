/**
 * X-29 Common TypeScript Domain Definitions
 */

export interface IdentifiableItem {
  id?: string | number;
  _id?: string;
  uid?: string;
  taskId?: string;
  trackId?: string;
  actionId?: string;
  goalId?: string;
  sessionId?: string;
  blockId?: string;
  groupId?: string;
  key?: string;
  [key: string]: unknown;
}

export type DateString = string; // YYYY-MM-DD format
export type TimeString = string; // HH:mm format

export interface TombstoneMap {
  [identifier: string]: number | boolean;
}
