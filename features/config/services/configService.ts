/**
 * X-29 Master Configuration & Priority Service (features/config/services/configService.ts)
 * 
 * Pure functions for priority ranking, sequential order rebalancing,
 * and workspace JSON backup export/import validation.
 */

import type { Track, Program, SyllabusItem, SyllabusStructure, CustomProgramsMap } from '@/types/taxonomy';
import type { DailyHabit } from '@/types/habits';

export interface FlatProgramItem {
  trackId: string;
  trackName: string;
  prog: Program;
}

export interface WorkspaceBackupPayload {
  _metadata?: {
    exportedAt: string;
    source: string;
    version?: string;
  };
  tracks?: Track[];
  customPrograms?: CustomProgramsMap;
  customSyllabus?: SyllabusStructure;
  syllabusStructure?: SyllabusStructure;
  customActions?: DailyHabit[];
  habits?: DailyHabit[];
  passedItems?: {
    programs: string[];
    subjects: string[];
  };
  dashboardConfig?: {
    topTag: string;
    mainTitle: string;
    subTitle: string;
  };
  [key: string]: unknown;
}

/**
 * Moves an item at `index` in `list` by `direction` (-1 for up, 1 for down),
 * swapping their positions and assigning sequential priority (1..N) and order (0..N-1).
 */
export function reorderListWithPriority<T extends { priority?: number; order?: number }>(
  list: T[],
  index: number,
  direction: -1 | 1
): T[] {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= list.length) {
    return list;
  }

  const copy = [...list];
  const itemA = { ...copy[index] };
  const itemB = { ...copy[targetIndex] };

  // Swap positions in array
  copy[index] = itemB;
  copy[targetIndex] = itemA;

  // Re-assign 1-indexed sequential priority and 0-indexed order
  return copy.map((item, idx) => ({
    ...item,
    priority: idx + 1,
    order: idx,
  }));
}

/**
 * Reorders list based on a direct priority select dropdown change,
 * shifting items and preserving sequential 1..N priorities.
 */
export function changePriorityInList<T extends { id?: string; name?: string; subject?: string; priority?: number; order?: number }>(
  list: T[],
  identifierKey: 'id' | 'name' | 'subject',
  identifierValue: string,
  newPriority: number
): T[] {
  const currentIndex = list.findIndex((item) => (item[identifierKey] as unknown as string) === identifierValue);
  if (currentIndex === -1) return list;

  const targetPriority = Math.max(1, Math.min(newPriority, list.length));
  const targetIndex = targetPriority - 1;

  if (currentIndex === targetIndex) return list;

  const copy = [...list];
  const [removed] = copy.splice(currentIndex, 1);
  copy.splice(targetIndex, 0, removed);

  return copy.map((item, idx) => ({
    ...item,
    priority: idx + 1,
    order: idx,
  }));
}

/**
 * Generates an indented JSON string payload for workspace backup export.
 */
export function createBackupPayload(data: {
  tracks: Track[];
  customPrograms: CustomProgramsMap;
  syllabusStructure: SyllabusStructure;
  habits: DailyHabit[];
  passedItems?: { programs: string[]; subjects: string[] };
  dashboardConfig?: { topTag: string; mainTitle: string; subTitle: string };
}): string {
  const payload: WorkspaceBackupPayload = {
    _metadata: {
      exportedAt: new Date().toISOString(),
      source: 'X-29 Next.js Workspace Backup',
      version: '2.0.0',
    },
    tracks: data.tracks,
    customPrograms: data.customPrograms,
    syllabusStructure: data.syllabusStructure,
    customSyllabus: data.syllabusStructure,
    customActions: data.habits,
    habits: data.habits,
    passedItems: data.passedItems || { programs: [], subjects: [] },
    dashboardConfig: data.dashboardConfig || {
      topTag: 'X-29',
      mainTitle: 'X-29 Dashboard',
      subTitle: 'Study Tracker Dashboard',
    },
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Validates a parsed JSON payload to verify it contains valid X-29 state.
 */
export function validateBackupPayload(parsed: unknown): { isValid: boolean; error?: string; data?: WorkspaceBackupPayload } {
  if (!parsed || typeof parsed !== 'object') {
    return { isValid: false, error: 'File content is not a valid JSON object.' };
  }

  const payload = parsed as Record<string, unknown>;

  // Check if at least one characteristic X-29 property exists
  const hasValidProperty =
    Array.isArray(payload.tracks) ||
    typeof payload.syllabusStructure === 'object' ||
    typeof payload.customSyllabus === 'object' ||
    typeof payload.customPrograms === 'object' ||
    Array.isArray(payload.customActions) ||
    Array.isArray(payload.habits) ||
    Array.isArray(payload.tasks);

  if (!hasValidProperty) {
    return {
      isValid: false,
      error: 'Invalid backup file. The uploaded JSON does not contain recognized X-29 workspace data.',
    };
  }

  return { isValid: true, data: payload as WorkspaceBackupPayload };
}
