/**
 * X-29 Authoritative Target Store (stores/useTargetStore.ts)
 * 
 * Manages:
 * - monthlyTargetsDatabase, weeklyTargetsDatabase, dailyTargetsDatabase
 * - Active month range, week range, and daily date selection
 * - Synchronized allocation additions, deletions, and completion toggles
 * - Cascade consistency: Monthly -> Weekly -> Daily
 * - Local-first IndexedDB persistence with Firestore synchronization
 */

import { create } from 'zustand';
import type {
  MonthlyTarget,
  WeeklyTarget,
  DailyTarget,
  MonthlyTargetsDatabase,
  WeeklyTargetsDatabase,
  DailyTargetsDatabase,
  AllocationResult,
} from '@/types/targets';
import { getMonthRangeKey, getWeekRangeKey } from '@/features/targets/services/targetAllocationEngine';
import { idbGet, idbSet } from '@/lib/storage/indexeddb';
import { syncCloud } from '@/lib/sync/syncService';

const KEY_MONTHLY_TARGETS = 'x29_monthly_targets';
const KEY_WEEKLY_TARGETS = 'x29_weekly_targets';
const KEY_DAILY_TARGETS = 'x29_daily_targets';

interface TargetStoreState {
  monthlyTargetsDatabase: MonthlyTargetsDatabase;
  weeklyTargetsDatabase: WeeklyTargetsDatabase;
  dailyTargetsDatabase: DailyTargetsDatabase;
  selectedMonthRange: string;
  selectedWeekRange: string;
  selectedDailyDate: string;
  isInitialized: boolean;

  initFromStorage: () => Promise<void>;
  addMonthlyTarget: (target: MonthlyTarget) => void;
  addBatchAllocation: (result: AllocationResult) => void;
  updateMonthlyTarget: (monthKey: string, id: string, updates: Partial<MonthlyTarget>) => void;
  deleteMonthlyTarget: (monthKey: string, id: string) => void;
  deleteWeeklyTarget: (weekKey: string, id: string) => void;
  deleteDailyTarget: (dateKey: string, id: string) => void;
  toggleMonthlyTargetCompleted: (monthKey: string, id: string) => void;
  toggleWeeklyTargetCompleted: (weekKey: string, id: string) => void;
  toggleDailyTargetCompleted: (dateKey: string, id: string) => void;
  setSelectedMonthRange: (range: string) => void;
  setSelectedWeekRange: (range: string) => void;
  setSelectedDailyDate: (date: string) => void;
  navigateMonth: (direction: 'past' | 'present' | 'future') => void;
  navigateWeek: (direction: 'past' | 'present' | 'future') => void;
  navigateDay: (direction: 'past' | 'present' | 'future') => void;
}

export const useTargetStore = create<TargetStoreState>((set, get) => ({
  monthlyTargetsDatabase: {},
  weeklyTargetsDatabase: {},
  dailyTargetsDatabase: {},
  selectedMonthRange: getMonthRangeKey(),
  selectedWeekRange: getWeekRangeKey(),
  selectedDailyDate: new Date().toISOString().slice(0, 10),
  isInitialized: false,

  initFromStorage: async () => {
    if (get().isInitialized) return;

    let monthly: MonthlyTargetsDatabase = {};
    let weekly: WeeklyTargetsDatabase = {};
    let daily: DailyTargetsDatabase = {};

    try {
      const [idbM, idbW, idbD] = await Promise.all([
        idbGet<MonthlyTargetsDatabase>(KEY_MONTHLY_TARGETS),
        idbGet<WeeklyTargetsDatabase>(KEY_WEEKLY_TARGETS),
        idbGet<DailyTargetsDatabase>(KEY_DAILY_TARGETS),
      ]);

      if (idbM && typeof idbM === 'object') monthly = idbM;
      if (idbW && typeof idbW === 'object') weekly = idbW;
      if (idbD && typeof idbD === 'object') daily = idbD;

      // Fallback to legacy localStorage if indexeddb was empty
      if (Object.keys(monthly).length === 0 && typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('local_app_state') || window.localStorage.getItem('appState');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed.monthlyTargetsDatabase && typeof parsed.monthlyTargetsDatabase === 'object') {
              monthly = parsed.monthlyTargetsDatabase;
              await idbSet(KEY_MONTHLY_TARGETS, monthly);
            }
            if (parsed.weeklyTargetsDatabase && typeof parsed.weeklyTargetsDatabase === 'object') {
              weekly = parsed.weeklyTargetsDatabase;
              await idbSet(KEY_WEEKLY_TARGETS, weekly);
            }
            if (parsed.dailyTargetsDatabase && typeof parsed.dailyTargetsDatabase === 'object') {
              daily = parsed.dailyTargetsDatabase;
              await idbSet(KEY_DAILY_TARGETS, daily);
            }
          } catch {}
        }
      }
    } catch (err) {
      console.warn('[useTargetStore] Storage load error:', err);
    }

    set({
      monthlyTargetsDatabase: monthly,
      weeklyTargetsDatabase: weekly,
      dailyTargetsDatabase: daily,
      isInitialized: true,
    });
  },

  addMonthlyTarget: (target) => {
    const { monthlyTargetsDatabase } = get();
    const monthKey = target.targetMonth || getMonthRangeKey();
    const current = monthlyTargetsDatabase[monthKey] || [];
    const updated = {
      ...monthlyTargetsDatabase,
      [monthKey]: [...current, target],
    };

    set({ monthlyTargetsDatabase: updated });
    idbSet(KEY_MONTHLY_TARGETS, updated);
    syncCloud({ monthlyTargetsDatabase: updated });
  },

  addBatchAllocation: (result) => {
    const { monthlyTargetsDatabase, weeklyTargetsDatabase, dailyTargetsDatabase } = get();

    const updatedMonthly = { ...monthlyTargetsDatabase };
    result.monthlyTargets.forEach((mt) => {
      const k = mt.targetMonth;
      updatedMonthly[k] = [...(updatedMonthly[k] || []), mt];
    });

    const updatedWeekly = { ...weeklyTargetsDatabase };
    result.weeklyTargets.forEach((wt) => {
      const k = wt.targetWeek;
      updatedWeekly[k] = [...(updatedWeekly[k] || []), wt];
    });

    const updatedDaily = { ...dailyTargetsDatabase };
    result.dailyTargets.forEach((dt) => {
      const k = dt.date;
      updatedDaily[k] = [...(updatedDaily[k] || []), dt];
    });

    set({
      monthlyTargetsDatabase: updatedMonthly,
      weeklyTargetsDatabase: updatedWeekly,
      dailyTargetsDatabase: updatedDaily,
    });

    idbSet(KEY_MONTHLY_TARGETS, updatedMonthly);
    idbSet(KEY_WEEKLY_TARGETS, updatedWeekly);
    idbSet(KEY_DAILY_TARGETS, updatedDaily);

    syncCloud({
      monthlyTargetsDatabase: updatedMonthly,
      weeklyTargetsDatabase: updatedWeekly,
      dailyTargetsDatabase: updatedDaily,
    });
  },

  updateMonthlyTarget: (monthKey, id, updates) => {
    const { monthlyTargetsDatabase } = get();
    const list = monthlyTargetsDatabase[monthKey] || [];
    const updatedList = list.map((item) => (item.id === id ? { ...item, ...updates } : item));
    const updated = { ...monthlyTargetsDatabase, [monthKey]: updatedList };

    set({ monthlyTargetsDatabase: updated });
    idbSet(KEY_MONTHLY_TARGETS, updated);
    syncCloud({ monthlyTargetsDatabase: updated });
  },

  deleteMonthlyTarget: (monthKey, id) => {
    const { monthlyTargetsDatabase, weeklyTargetsDatabase, dailyTargetsDatabase } = get();
    const list = monthlyTargetsDatabase[monthKey] || [];
    const updatedList = list.filter((item) => item.id !== id);
    const updatedMonthly = { ...monthlyTargetsDatabase, [monthKey]: updatedList };

    // Cascade delete associated weekly and daily targets
    const updatedWeekly: WeeklyTargetsDatabase = {};
    for (const wKey in weeklyTargetsDatabase) {
      updatedWeekly[wKey] = weeklyTargetsDatabase[wKey].filter((wt) => wt.monthlyTargetId !== id);
    }

    const updatedDaily: DailyTargetsDatabase = {};
    for (const dKey in dailyTargetsDatabase) {
      updatedDaily[dKey] = dailyTargetsDatabase[dKey].filter((dt) => dt.monthlyTargetId !== id);
    }

    set({
      monthlyTargetsDatabase: updatedMonthly,
      weeklyTargetsDatabase: updatedWeekly,
      dailyTargetsDatabase: updatedDaily,
    });

    idbSet(KEY_MONTHLY_TARGETS, updatedMonthly);
    idbSet(KEY_WEEKLY_TARGETS, updatedWeekly);
    idbSet(KEY_DAILY_TARGETS, updatedDaily);

    syncCloud({
      monthlyTargetsDatabase: updatedMonthly,
      weeklyTargetsDatabase: updatedWeekly,
      dailyTargetsDatabase: updatedDaily,
    });
  },

  deleteWeeklyTarget: (weekKey, id) => {
    const { weeklyTargetsDatabase } = get();
    const list = weeklyTargetsDatabase[weekKey] || [];
    const updatedList = list.filter((item) => item.id !== id);
    const updatedWeekly = { ...weeklyTargetsDatabase, [weekKey]: updatedList };

    set({ weeklyTargetsDatabase: updatedWeekly });
    idbSet(KEY_WEEKLY_TARGETS, updatedWeekly);
    syncCloud({ weeklyTargetsDatabase: updatedWeekly });
  },

  deleteDailyTarget: (dateKey, id) => {
    const { dailyTargetsDatabase } = get();
    const list = dailyTargetsDatabase[dateKey] || [];
    const updatedList = list.filter((item) => item.id !== id);
    const updatedDaily = { ...dailyTargetsDatabase, [dateKey]: updatedList };

    set({ dailyTargetsDatabase: updatedDaily });
    idbSet(KEY_DAILY_TARGETS, updatedDaily);
    syncCloud({ dailyTargetsDatabase: updatedDaily });
  },

  toggleMonthlyTargetCompleted: (monthKey, id) => {
    const { monthlyTargetsDatabase } = get();
    const list = monthlyTargetsDatabase[monthKey] || [];
    const updatedList = list.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    const updated = { ...monthlyTargetsDatabase, [monthKey]: updatedList };

    set({ monthlyTargetsDatabase: updated });
    idbSet(KEY_MONTHLY_TARGETS, updated);
    syncCloud({ monthlyTargetsDatabase: updated });
  },

  toggleWeeklyTargetCompleted: (weekKey, id) => {
    const { weeklyTargetsDatabase } = get();
    const list = weeklyTargetsDatabase[weekKey] || [];
    const updatedList = list.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    const updated = { ...weeklyTargetsDatabase, [weekKey]: updatedList };

    set({ weeklyTargetsDatabase: updated });
    idbSet(KEY_WEEKLY_TARGETS, updated);
    syncCloud({ weeklyTargetsDatabase: updated });
  },

  toggleDailyTargetCompleted: (dateKey, id) => {
    const { dailyTargetsDatabase, monthlyTargetsDatabase } = get();
    const list = dailyTargetsDatabase[dateKey] || [];
    let toggledItem: DailyTarget | undefined;

    const updatedList = list.map((item) => {
      if (item.id === id) {
        const nextState = !item.completed;
        toggledItem = { ...item, completed: nextState };
        return toggledItem;
      }
      return item;
    });

    const updatedDaily = { ...dailyTargetsDatabase, [dateKey]: updatedList };

    // Cascade: check if this completes the associated MonthlyTarget
    let updatedMonthly = monthlyTargetsDatabase;
    if (toggledItem?.monthlyTargetId) {
      const mId = toggledItem.monthlyTargetId;
      // Gather all daily targets for this monthlyTargetId across all dates
      let allDone = true;
      let targetFound = false;

      for (const dKey in updatedDaily) {
        for (const dt of updatedDaily[dKey]) {
          if (dt.monthlyTargetId === mId) {
            targetFound = true;
            if (!dt.completed) {
              allDone = false;
              break;
            }
          }
        }
        if (!allDone) break;
      }

      if (targetFound) {
        updatedMonthly = { ...monthlyTargetsDatabase };
        for (const mKey in updatedMonthly) {
          updatedMonthly[mKey] = updatedMonthly[mKey].map((mt) =>
            mt.id === mId ? { ...mt, completed: allDone } : mt
          );
        }
      }
    }

    set({
      dailyTargetsDatabase: updatedDaily,
      monthlyTargetsDatabase: updatedMonthly,
    });

    idbSet(KEY_DAILY_TARGETS, updatedDaily);
    if (updatedMonthly !== monthlyTargetsDatabase) {
      idbSet(KEY_MONTHLY_TARGETS, updatedMonthly);
    }

    syncCloud({
      dailyTargetsDatabase: updatedDaily,
      monthlyTargetsDatabase: updatedMonthly,
    });
  },

  setSelectedMonthRange: (range) => {
    set({ selectedMonthRange: range });
  },

  setSelectedWeekRange: (range) => {
    set({ selectedWeekRange: range });
  },

  setSelectedDailyDate: (date) => {
    set({ selectedDailyDate: date });
  },

  navigateMonth: (direction) => {
    const { selectedMonthRange } = get();
    // Parse current range start date
    const parts = selectedMonthRange.split(' - ');
    const startDate = parts[0] ? new Date(parts[0]) : new Date();
    const d = isNaN(startDate.getTime()) ? new Date() : startDate;

    if (direction === 'present') {
      set({ selectedMonthRange: getMonthRangeKey(new Date()) });
    } else if (direction === 'past') {
      d.setMonth(d.getMonth() - 1);
      set({ selectedMonthRange: getMonthRangeKey(d) });
    } else if (direction === 'future') {
      d.setMonth(d.getMonth() + 1);
      set({ selectedMonthRange: getMonthRangeKey(d) });
    }
  },

  navigateWeek: (direction) => {
    const { selectedWeekRange } = get();
    const parts = selectedWeekRange.split(' - ');
    const startDate = parts[0] ? new Date(parts[0]) : new Date();
    const d = isNaN(startDate.getTime()) ? new Date() : startDate;

    if (direction === 'present') {
      set({ selectedWeekRange: getWeekRangeKey(new Date()) });
    } else if (direction === 'past') {
      d.setDate(d.getDate() - 7);
      set({ selectedWeekRange: getWeekRangeKey(d) });
    } else if (direction === 'future') {
      d.setDate(d.getDate() + 7);
      set({ selectedWeekRange: getWeekRangeKey(d) });
    }
  },

  navigateDay: (direction) => {
    const { selectedDailyDate } = get();
    const d = new Date(selectedDailyDate);
    const validD = isNaN(d.getTime()) ? new Date() : d;

    if (direction === 'present') {
      set({ selectedDailyDate: new Date().toISOString().slice(0, 10) });
    } else if (direction === 'past') {
      validD.setDate(validD.getDate() - 1);
      set({ selectedDailyDate: validD.toISOString().slice(0, 10) });
    } else if (direction === 'future') {
      validD.setDate(validD.getDate() + 1);
      set({ selectedDailyDate: validD.toISOString().slice(0, 10) });
    }
  },
}));
