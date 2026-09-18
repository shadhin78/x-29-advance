/**
 * X-29 Cloud Synchronization Types
 */

export type SyncStatus =
  | 'saved'
  | 'saving'
  | 'local'
  | 'offline'
  | 'error'
  | 'uninitialized'
  | 'conflict';

export interface SyncState {
  status: SyncStatus;
  lastCommittedRevision: number;
  lastCommittedWriteId: string;
  isDirty: boolean;
  lastAppliedCloudTimestamp: number;
  lastLocalPersistTime: number;
  syncGeneration: number;
  syncSessionId: string;
}
