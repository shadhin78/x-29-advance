/**
 * X-29 Timer Store (stores/useTimerStore.ts)
 * 
 * Authoritative Zustand store for the X-29 Focus & Timer Studio.
 * Separates stable session state from high-frequency tick calculations.
 * Persists to IndexedDB and Firebase on state transitions ONLY.
 */

import { create } from 'zustand';
import type {
  TimerMode,
  ActiveTimerState,
  TimerLogSession,
  SessionHistoryFilter,
  SubjectFocusTarget,
  ModeTimerState,
} from '@/types/timer';
import {
  loadTimerDataFromStorage,
  saveActiveTimerToStorage,
  saveTimerLogsToStorage,
  saveDailyFocusTargetToStorage,
  saveSubjectTargetsToStorage,
} from '@/features/focus/services/timerStorage';
import { saveTimerToCloud } from '@/features/focus/services/timerFirebaseService';
import { calculateAlarmDuration } from '@/features/focus/services/timerEngine';

interface TimerStoreState {
  activeTimer: ActiveTimerState;
  timerLogs: TimerLogSession[];
  dailyFocusHoursTarget: number;
  sessionHistoryFilter: SessionHistoryFilter;
  subjectFocusTargets: Record<string, SubjectFocusTarget>;
  isInitialized: boolean;

  // Actions
  initFromStorage: () => Promise<void>;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  setMode: (mode: TimerMode) => void;
  setPreset: (minutes: number) => void;
  setCustomDuration: (minutes: number) => void;
  setAlarmConfig: (start: string, end: string, useCurrent: boolean) => void;
  setSelectedSubject: (subject: string) => void;
  saveCurrentSession: () => TimerLogSession | null;
  addManualSession: (data: { subject: string; durationSeconds: number; mode: TimerMode; dateStr?: string }) => TimerLogSession;
  deleteSession: (id: string) => void;
  setSessionHistoryFilter: (filter: SessionHistoryFilter) => void;
  setDailyFocusHoursTarget: (targetHours: number) => void;
  setSubjectTarget: (subject: string, hours: number, minutes: number) => void;
  deleteSubjectTarget: (subject: string) => void;
}

const DEFAULT_ACTIVE_TIMER: ActiveTimerState = {
  isRunning: false,
  mode: 'stopwatch',
  startTime: null,
  elapsedBeforeStart: 0,
  targetDuration: 0,
  selectedSubject: 'General Study',
  alarmStart: '',
  alarmEnd: '',
  alarmUseCurrent: true,
  updatedAt: Date.now(),
  timerStates: {
    stopwatch: {
      isRunning: false,
      startTime: null,
      elapsedBeforeStart: 0,
      targetDuration: 0,
      updatedAt: Date.now(),
    },
    timer: {
      isRunning: false,
      startTime: null,
      elapsedBeforeStart: 0,
      targetDuration: 25 * 60,
      updatedAt: Date.now(),
    },
    alarm: {
      isRunning: false,
      startTime: null,
      elapsedBeforeStart: 0,
      targetDuration: 0,
      updatedAt: Date.now(),
      alarmStart: '',
      alarmEnd: '',
      alarmUseCurrent: true,
    },
  },
};

export const useTimerStore = create<TimerStoreState>((set, get) => ({
  activeTimer: DEFAULT_ACTIVE_TIMER,
  timerLogs: [],
  dailyFocusHoursTarget: 0,
  sessionHistoryFilter: 'all',
  subjectFocusTargets: {},
  isInitialized: false,

  initFromStorage: async () => {
    if (get().isInitialized) return;
    try {
      const persisted = await loadTimerDataFromStorage();
      const currentActive = get().activeTimer;

      const mergedActive: ActiveTimerState = persisted.activeTimer
        ? {
            ...currentActive,
            ...persisted.activeTimer,
            timerStates: {
              ...currentActive.timerStates,
              ...(persisted.activeTimer.timerStates || {}),
            },
          }
        : currentActive;

      set({
        activeTimer: mergedActive,
        timerLogs: persisted.timerLogs || [],
        dailyFocusHoursTarget: persisted.dailyFocusHoursTarget || 0,
        subjectFocusTargets: persisted.subjectFocusTargets || {},
        isInitialized: true,
      });
    } catch (err) {
      console.warn('[useTimerStore] Initialization error:', err);
      set({ isInitialized: true });
    }
  },

  startTimer: () => {
    const { activeTimer } = get();
    if (activeTimer.isRunning) return;

    const now = Date.now();
    const currentMode = activeTimer.mode;

    // Pause any other running mode stored in sub-states
    const updatedTimerStates = { ...(activeTimer.timerStates || {}) };
    Object.keys(updatedTimerStates).forEach((m) => {
      const key = m as TimerMode;
      const sub = updatedTimerStates[key];
      if (sub && sub.isRunning && key !== currentMode) {
        sub.isRunning = false;
        if (sub.startTime) {
          sub.elapsedBeforeStart += Math.max(0, now - sub.startTime);
        }
        sub.startTime = null;
        sub.updatedAt = now;
      }
    });

    // If alarm mode, recalculate duration if needed
    let targetDuration = activeTimer.targetDuration;
    if (currentMode === 'alarm') {
      const startStr = activeTimer.alarmStart || '';
      const endStr = activeTimer.alarmEnd || '';
      if (startStr && endStr) {
        targetDuration = calculateAlarmDuration(startStr, endStr);
      }
    }

    const updatedActive: ActiveTimerState = {
      ...activeTimer,
      isRunning: true,
      startTime: now,
      targetDuration,
      updatedAt: now,
      timerStates: {
        ...updatedTimerStates,
        [currentMode]: {
          ...(updatedTimerStates[currentMode] || {}),
          isRunning: true,
          startTime: now,
          elapsedBeforeStart: activeTimer.elapsedBeforeStart,
          targetDuration,
          updatedAt: now,
        },
      },
    };

    set({ activeTimer: updatedActive });
    saveActiveTimerToStorage(updatedActive);
    saveTimerToCloud({ activeTimerState: updatedActive });
  },

  pauseTimer: () => {
    const { activeTimer } = get();
    const now = Date.now();
    const currentMode = activeTimer.mode;

    let additionalElapsed = 0;
    if (activeTimer.isRunning && activeTimer.startTime) {
      additionalElapsed = Math.max(0, now - activeTimer.startTime);
    }

    const newElapsed = activeTimer.elapsedBeforeStart + additionalElapsed;

    const updatedTimerStates = { ...(activeTimer.timerStates || {}) };
    Object.keys(updatedTimerStates).forEach((m) => {
      const key = m as TimerMode;
      const sub = updatedTimerStates[key];
      if (sub && sub.isRunning) {
        sub.isRunning = false;
        if (sub.startTime) {
          sub.elapsedBeforeStart += Math.max(0, now - sub.startTime);
        }
        sub.startTime = null;
        sub.updatedAt = now;
      }
    });

    const updatedActive: ActiveTimerState = {
      ...activeTimer,
      isRunning: false,
      startTime: null,
      elapsedBeforeStart: newElapsed,
      updatedAt: now,
      timerStates: {
        ...updatedTimerStates,
        [currentMode]: {
          ...(updatedTimerStates[currentMode] || {}),
          isRunning: false,
          startTime: null,
          elapsedBeforeStart: newElapsed,
          targetDuration: activeTimer.targetDuration,
          updatedAt: now,
        },
      },
    };

    set({ activeTimer: updatedActive });
    saveActiveTimerToStorage(updatedActive);
    saveTimerToCloud({ activeTimerState: updatedActive });
  },

  resumeTimer: () => {
    get().startTimer();
  },

  resetTimer: () => {
    const { activeTimer } = get();
    const now = Date.now();
    const currentMode = activeTimer.mode;

    let defaultTarget = 0;
    if (currentMode === 'timer') {
      defaultTarget = 25 * 60;
    }

    const updatedTimerStates = { ...(activeTimer.timerStates || {}) };
    if (updatedTimerStates[currentMode]) {
      updatedTimerStates[currentMode] = {
        ...updatedTimerStates[currentMode]!,
        isRunning: false,
        startTime: null,
        elapsedBeforeStart: 0,
        targetDuration: defaultTarget,
        updatedAt: now,
      };
    }

    const updatedActive: ActiveTimerState = {
      ...activeTimer,
      isRunning: false,
      startTime: null,
      elapsedBeforeStart: 0,
      targetDuration: defaultTarget,
      updatedAt: now,
      timerStates: updatedTimerStates,
    };

    set({ activeTimer: updatedActive });
    saveActiveTimerToStorage(updatedActive);
    saveTimerToCloud({ activeTimerState: updatedActive });
  },

  setMode: (newMode: TimerMode) => {
    const { activeTimer } = get();
    if (activeTimer.mode === newMode) return;

    const now = Date.now();
    const oldMode = activeTimer.mode;

    // Snapshot old mode's active state
    let oldElapsed = activeTimer.elapsedBeforeStart;
    if (activeTimer.isRunning && activeTimer.startTime) {
      oldElapsed += Math.max(0, now - activeTimer.startTime);
    }

    const updatedTimerStates = { ...(activeTimer.timerStates || {}) };
    updatedTimerStates[oldMode] = {
      isRunning: false,
      startTime: null,
      elapsedBeforeStart: oldElapsed,
      targetDuration: activeTimer.targetDuration,
      updatedAt: now,
      alarmStart: activeTimer.alarmStart,
      alarmEnd: activeTimer.alarmEnd,
      alarmUseCurrent: activeTimer.alarmUseCurrent,
    };

    // Restore new mode's existing state or initialize defaults
    const targetState: ModeTimerState = updatedTimerStates[newMode] || {
      isRunning: false,
      startTime: null,
      elapsedBeforeStart: 0,
      targetDuration: newMode === 'timer' ? 25 * 60 : 0,
      updatedAt: now,
    };

    const updatedActive: ActiveTimerState = {
      ...activeTimer,
      mode: newMode,
      isRunning: targetState.isRunning,
      startTime: targetState.startTime,
      elapsedBeforeStart: targetState.elapsedBeforeStart,
      targetDuration: targetState.targetDuration,
      alarmStart: targetState.alarmStart || activeTimer.alarmStart || '',
      alarmEnd: targetState.alarmEnd || activeTimer.alarmEnd || '',
      alarmUseCurrent: targetState.alarmUseCurrent !== undefined ? targetState.alarmUseCurrent : true,
      updatedAt: now,
      timerStates: updatedTimerStates,
    };

    set({ activeTimer: updatedActive });
    saveActiveTimerToStorage(updatedActive);
    saveTimerToCloud({ activeTimerState: updatedActive });
  },

  setPreset: (minutes: number) => {
    const { activeTimer } = get();
    const targetSec = Math.max(0, minutes * 60);
    const now = Date.now();

    // If current elapsed exceeds new target in timer mode, reset elapsed
    let elapsed = activeTimer.elapsedBeforeStart;
    if (activeTimer.mode === 'timer' && elapsed >= targetSec * 1000) {
      elapsed = 0;
    }

    const updatedActive: ActiveTimerState = {
      ...activeTimer,
      targetDuration: targetSec,
      elapsedBeforeStart: elapsed,
      updatedAt: now,
    };

    if (updatedActive.timerStates && updatedActive.timerStates[activeTimer.mode]) {
      updatedActive.timerStates[activeTimer.mode]!.targetDuration = targetSec;
      updatedActive.timerStates[activeTimer.mode]!.elapsedBeforeStart = elapsed;
    }

    set({ activeTimer: updatedActive });
    saveActiveTimerToStorage(updatedActive);
    saveTimerToCloud({ activeTimerState: updatedActive });
  },

  setCustomDuration: (minutes: number) => {
    get().setPreset(minutes);
  },

  setAlarmConfig: (start: string, end: string, useCurrent: boolean) => {
    const { activeTimer } = get();
    const duration = calculateAlarmDuration(start, end);
    const now = Date.now();

    const updatedActive: ActiveTimerState = {
      ...activeTimer,
      alarmStart: start,
      alarmEnd: end,
      alarmUseCurrent: useCurrent,
      targetDuration: duration,
      updatedAt: now,
    };

    if (updatedActive.timerStates && updatedActive.timerStates.alarm) {
      updatedActive.timerStates.alarm.alarmStart = start;
      updatedActive.timerStates.alarm.alarmEnd = end;
      updatedActive.timerStates.alarm.alarmUseCurrent = useCurrent;
      updatedActive.timerStates.alarm.targetDuration = duration;
    }

    set({ activeTimer: updatedActive });
    saveActiveTimerToStorage(updatedActive);
    saveTimerToCloud({ activeTimerState: updatedActive });
  },

  setSelectedSubject: (subject: string) => {
    const { activeTimer } = get();
    if (activeTimer.selectedSubject === subject) return;

    const updatedActive: ActiveTimerState = {
      ...activeTimer,
      selectedSubject: subject,
      updatedAt: Date.now(),
    };

    set({ activeTimer: updatedActive });
    saveActiveTimerToStorage(updatedActive);
    saveTimerToCloud({ activeTimerState: updatedActive });
  },

  saveCurrentSession: () => {
    const { activeTimer, timerLogs } = get();
    const now = Date.now();

    let totalMs = activeTimer.elapsedBeforeStart;
    if (activeTimer.isRunning && activeTimer.startTime) {
      totalMs += Math.max(0, now - activeTimer.startTime);
    }

    const elapsedSeconds = Math.floor(totalMs / 1000);
    if (elapsedSeconds <= 0) {
      return null;
    }

    const subject = activeTimer.selectedSubject || 'General Study';
    const currentMode = activeTimer.mode;

    const newLog: TimerLogSession = {
      id: `timer-log-${now}-${Math.floor(Math.random() * 10000)}`,
      subject,
      duration: elapsedSeconds,
      durationSeconds: elapsedSeconds,
      date: new Date(now).toISOString(),
      mode: currentMode,
      createdAt: new Date(now).toISOString(),
      updatedAt: now,
    };

    const updatedLogs = [newLog, ...timerLogs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Reset active timer elapsed time
    const updatedTimerStates = { ...(activeTimer.timerStates || {}) };
    if (updatedTimerStates[currentMode]) {
      updatedTimerStates[currentMode] = {
        ...updatedTimerStates[currentMode]!,
        isRunning: false,
        startTime: null,
        elapsedBeforeStart: 0,
        updatedAt: now,
      };
      if (currentMode === 'alarm') {
        updatedTimerStates[currentMode]!.targetDuration = 0;
      }
    }

    const updatedActive: ActiveTimerState = {
      ...activeTimer,
      isRunning: false,
      startTime: null,
      elapsedBeforeStart: 0,
      updatedAt: now,
      timerStates: updatedTimerStates,
    };
    if (currentMode === 'alarm') {
      updatedActive.targetDuration = 0;
    }

    set({
      activeTimer: updatedActive,
      timerLogs: updatedLogs,
    });

    saveActiveTimerToStorage(updatedActive);
    saveTimerLogsToStorage(updatedLogs);
    saveTimerToCloud({
      activeTimerState: updatedActive,
      timerLogs: updatedLogs,
    }, true);

    return newLog;
  },

  addManualSession: ({ subject, durationSeconds, mode, dateStr }) => {
    const { timerLogs } = get();
    const now = Date.now();
    const sessionDate = dateStr ? new Date(dateStr).toISOString() : new Date(now).toISOString();

    const newLog: TimerLogSession = {
      id: `timer-log-${now}-${Math.floor(Math.random() * 10000)}`,
      subject: subject || 'General Study',
      duration: Math.max(1, Math.floor(durationSeconds)),
      durationSeconds: Math.max(1, Math.floor(durationSeconds)),
      date: sessionDate,
      mode: mode || 'timer',
      createdAt: new Date(now).toISOString(),
      updatedAt: now,
    };

    const updatedLogs = [newLog, ...timerLogs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    set({ timerLogs: updatedLogs });
    saveTimerLogsToStorage(updatedLogs);
    saveTimerToCloud({ timerLogs: updatedLogs }, true);

    return newLog;
  },

  deleteSession: (id: string) => {
    const { timerLogs } = get();
    const updatedLogs = timerLogs.filter((log) => log.id !== id);
    set({ timerLogs: updatedLogs });
    saveTimerLogsToStorage(updatedLogs);
    saveTimerToCloud({ timerLogs: updatedLogs }, true);
  },

  setSessionHistoryFilter: (filter: SessionHistoryFilter) => {
    set({ sessionHistoryFilter: filter });
  },

  setDailyFocusHoursTarget: (targetHours: number) => {
    const safeTarget = Math.max(0, Number(targetHours) || 0);
    set({ dailyFocusHoursTarget: safeTarget });
    saveDailyFocusTargetToStorage(safeTarget);
    saveTimerToCloud({ dailyFocusHoursTarget: safeTarget });
  },

  setSubjectTarget: (subject: string, hours: number, minutes: number) => {
    const { subjectFocusTargets } = get();
    const updated = {
      ...subjectFocusTargets,
      [subject]: {
        hours: Math.max(0, Number(hours) || 0),
        minutes: Math.max(0, Number(minutes) || 0),
        createdAt: new Date().toISOString(),
      },
    };
    set({ subjectFocusTargets: updated });
    saveSubjectTargetsToStorage(updated);
    saveTimerToCloud({ subjectFocusTargets: updated });
  },

  deleteSubjectTarget: (subject: string) => {
    const { subjectFocusTargets } = get();
    const updated = { ...subjectFocusTargets };
    delete updated[subject];
    set({ subjectFocusTargets: updated });
    saveSubjectTargetsToStorage(updated);
    saveTimerToCloud({ subjectFocusTargets: updated });
  },
}));
