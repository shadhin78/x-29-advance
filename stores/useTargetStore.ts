/**
 * X-29 Authoritative Target Store (stores/useTargetStore.ts)
 * 
 * Manages:
 * - monthlyTargetsDatabase, weeklyTargetsDatabase, dailyTargetsDatabase
 * - Active month range selection
 * - Synchronized allocation additions, deletions, and completion toggles
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
import { getMonthRangeKey } from '@/features/targets/services/targetAllocationEngine';
import { idbGet, idbSet } from '@/lib/storage/indexeddb';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';

const KEY_MONTHLY_TARGETS = 'x29_monthly_targets';
const KEY_WEEKLY_TARGETS = 'x29_weekly_targets';
const KEY_DAILY_TARGETS = 'x29_daily_targets';

interface TargetStoreState {
  monthlyTargetsDatabase: MonthlyTargetsDatabase;
  weeklyTargetsDatabase: WeeklyTargetsDatabase;
  dailyTargetsDatabase: DailyTargetsDatabase;
  selectedMonthRange: string;
  isInitialized: boolean;

  initFromStorage: () => Promise<void>;
  addMonthlyTarget: (target: MonthlyTarget) => void;
  addBatchAllocation: (result: AllocationResult) => void;
  updateMonthlyTarget: (monthKey: string, id: string, updates: Partial<MonthlyTarget>) => void;
  deleteMonthlyTarget: (monthKey: string, id: string) => void;
  toggleMonthlyTargetCompleted: (monthKey: string, id: string) => void;
  toggleWeeklyTargetCompleted: (weekKey: string, id: string) => void;
  toggleDailyTargetCompleted: (dateKey: string, id: string) => void;
  setSelectedMonthRange: (range: string) => void;
}

export const useTargetStore = create<TargetStoreState>((set, get) => ({
  monthlyTargetsDatabase: {},
  weeklyTargetsDatabase: {},
  dailyTargetsDatabase: {},
  selectedMonthRange: getMonthRangeKey(),
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

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { monthlyTargetsDatabase: updated, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
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

    const user = auth.currentUser;
    if (user) {
      setDoc(
        doc(db, 'users', user.uid),
        {
          monthlyTargetsDatabase: updatedMonthly,
          weeklyTargetsDatabase: updatedWeekly,
          dailyTargetsDatabase: updatedDaily,
          updatedAt: Date.now(),
        },
        { merge: true }
      ).catch(() => {});
    }
  },

  updateMonthlyTarget: (monthKey, id, updates) => {
    const { monthlyTargetsDatabase } = get();
    const list = monthlyTargetsDatabase[monthKey] || [];
    const updatedList = list.map((item) => (item.id === id ? { ...item, ...updates } : item));
    const updated = { ...monthlyTargetsDatabase, [monthKey]: updatedList };

    set({ monthlyTargetsDatabase: updated });
    idbSet(KEY_MONTHLY_TARGETS, updated);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { monthlyTargetsDatabase: updated, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
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

    const user = auth.currentUser;
    if (user) {
      setDoc(
        doc(db, 'users', user.uid),
        {
          monthlyTargetsDatabase: updatedMonthly,
          weeklyTargetsDatabase: updatedWeekly,
          dailyTargetsDatabase: updatedDaily,
          updatedAt: Date.now(),
        },
        { merge: true }
      ).catch(() => {});
    }
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

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { monthlyTargetsDatabase: updated, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
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

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { weeklyTargetsDatabase: updated, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },

  toggleDailyTargetCompleted: (dateKey, id) => {
    const { dailyTargetsDatabase } = get();
    const list = dailyTargetsDatabase[dateKey] || [];
    const updatedList = list.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    const updated = { ...dailyTargetsDatabase, [dateKey]: updatedList };

    set({ dailyTargetsDatabase: updated });
    idbSet(KEY_DAILY_TARGETS, updated);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { dailyTargetsDatabase: updated, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },

  setSelectedMonthRange: (range) => {
    set({ selectedMonthRange: range });
  },
}));
