/**
 * X-29 Timer Storage Service (features/focus/services/timerStorage.ts)
 * 
 * Manages IndexedDB persistence for active timer state, session logs,
 * daily focus goals, and subject targets.
 * 
 * Provides graceful fallback to local cache for seamless compatibility.
 * Writes ONLY on state transitions (Start, Pause, Reset, Mode Change, Save Session),
 * NEVER on high-frequency visual ticks.
 */

import { idbGet, idbSet } from '@/lib/storage/indexeddb';
import type { ActiveTimerState, TimerLogSession, SubjectFocusTarget } from '@/types/timer';

const KEY_ACTIVE_TIMER = 'x29_activeTimerState';
const KEY_TIMER_LOGS = 'x29_timerLogs';
const KEY_DAILY_TARGET = 'x29_dailyFocusHoursTarget';
const KEY_SUBJECT_TARGETS = 'x29_subjectFocusTargets';

export interface PersistedTimerData {
  activeTimer: ActiveTimerState | null;
  timerLogs: TimerLogSession[];
  dailyFocusHoursTarget: number;
  subjectFocusTargets: Record<string, SubjectFocusTarget>;
}

/**
 * Loads all timer-related state from IndexedDB, falling back to localStorage cache if empty.
 */
export async function loadTimerDataFromStorage(): Promise<PersistedTimerData> {
  const defaultResult: PersistedTimerData = {
    activeTimer: null,
    timerLogs: [],
    dailyFocusHoursTarget: 0,
    subjectFocusTargets: {},
  };

  if (typeof window === 'undefined') {
    return defaultResult;
  }

  try {
    const [activeTimer, timerLogs, dailyTarget, subjectTargets] = await Promise.all([
      idbGet<ActiveTimerState>(KEY_ACTIVE_TIMER),
      idbGet<TimerLogSession[]>(KEY_TIMER_LOGS),
      idbGet<number>(KEY_DAILY_TARGET),
      idbGet<Record<string, SubjectFocusTarget>>(KEY_SUBJECT_TARGETS),
    ]);

    // Check if IndexedDB had data
    const hasIdbData = activeTimer || (Array.isArray(timerLogs) && timerLogs.length > 0);

    if (hasIdbData) {
      return {
        activeTimer: activeTimer || null,
        timerLogs: Array.isArray(timerLogs) ? timerLogs : [],
        dailyFocusHoursTarget: Number(dailyTarget) || 0,
        subjectFocusTargets: subjectTargets || {},
      };
    }

    // Fallback check to legacy localStorage if IndexedDB is freshly created
    try {
      const legacyRaw = window.localStorage.getItem('local_app_state') || window.localStorage.getItem('appState');
      if (legacyRaw) {
        const parsed = JSON.parse(legacyRaw) as {
          activeTimerState?: ActiveTimerState;
          timerLogs?: Array<{ id?: string; subject: string; duration?: number; durationSeconds?: number; date?: string; mode?: string }>;
          dailyFocusHoursTarget?: number;
          subjectFocusTargets?: Record<string, SubjectFocusTarget>;
        };

        const migratedLogs: TimerLogSession[] = (parsed.timerLogs || []).map((l, idx) => ({
          id: l.id || `timer-log-${Date.now()}-${idx}`,
          subject: l.subject || 'General Study',
          duration: Number(l.duration || l.durationSeconds || 0),
          date: l.date || new Date().toISOString(),
          mode: (l.mode === 'alarm' || l.mode === 'timer') ? l.mode : 'stopwatch',
        }));

        // Cache into IndexedDB for future instant loads
        if (migratedLogs.length > 0) {
          await idbSet(KEY_TIMER_LOGS, migratedLogs);
        }
        if (parsed.activeTimerState) {
          await idbSet(KEY_ACTIVE_TIMER, parsed.activeTimerState);
        }

        return {
          activeTimer: parsed.activeTimerState || null,
          timerLogs: migratedLogs,
          dailyFocusHoursTarget: Number(parsed.dailyFocusHoursTarget) || 0,
          subjectFocusTargets: parsed.subjectFocusTargets || {},
        };
      }
    } catch {
      // Ignore legacy parse errors
    }

    return defaultResult;
  } catch (err) {
    console.warn('[TimerStorage] Failed to load timer data from storage:', err);
    return defaultResult;
  }
}

/**
 * Persists the active timer state into IndexedDB.
 */
export async function saveActiveTimerToStorage(activeTimer: ActiveTimerState): Promise<void> {
  try {
    await idbSet(KEY_ACTIVE_TIMER, activeTimer);
    // Also sync to legacy local_app_state to keep legacy view updated
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem('local_app_state');
        if (raw) {
          const parsed = JSON.parse(raw);
          parsed.activeTimerState = activeTimer;
          window.localStorage.setItem('local_app_state', JSON.stringify(parsed));
        }
      } catch {}
    }
  } catch (err) {
    console.warn('[TimerStorage] Failed to persist active timer:', err);
  }
}

/**
 * Persists timer logs into IndexedDB.
 */
export async function saveTimerLogsToStorage(logs: TimerLogSession[]): Promise<void> {
  try {
    await idbSet(KEY_TIMER_LOGS, logs);
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem('local_app_state');
        if (raw) {
          const parsed = JSON.parse(raw);
          parsed.timerLogs = logs;
          window.localStorage.setItem('local_app_state', JSON.stringify(parsed));
        }
      } catch {}
    }
  } catch (err) {
    console.warn('[TimerStorage] Failed to persist timer logs:', err);
  }
}

/**
 * Persists daily focus target into IndexedDB.
 */
export async function saveDailyFocusTargetToStorage(targetHours: number): Promise<void> {
  try {
    await idbSet(KEY_DAILY_TARGET, targetHours);
  } catch (err) {
    console.warn('[TimerStorage] Failed to persist daily focus target:', err);
  }
}

/**
 * Persists subject targets into IndexedDB.
 */
export async function saveSubjectTargetsToStorage(targets: Record<string, SubjectFocusTarget>): Promise<void> {
  try {
    await idbSet(KEY_SUBJECT_TARGETS, targets);
  } catch (err) {
    console.warn('[TimerStorage] Failed to persist subject targets:', err);
  }
}
