/**
 * X-29 Authoritative Daily Actions & Habits Store (stores/useDailyActionStore.ts)
 * 
 * Manages:
 * - Daily recurring habits and checklist items
 * - Day-by-day habit completion matrix
 * - Streaks and calendar heatmap history
 * - Local-first IndexedDB persistence with Firestore synchronization
 */

import { create } from 'zustand';
import type { DailyHabit } from '@/types/habits';
import { idbGet, idbSet } from '@/lib/storage/indexeddb';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';

const KEY_DAILY_HABITS = 'x29_daily_habits';
const KEY_DAILY_NOTES = 'x29_daily_notes';

const DEFAULT_HABITS: DailyHabit[] = [
  { id: 'h-1', name: 'Morning Exercise & Meditation', color: '#10b981', history: {} },
  { id: 'h-2', name: 'Deep Study 4+ Hours', color: '#6366f1', history: {} },
  { id: 'h-3', name: 'Solved Practice Problems', color: '#3b82f6', history: {} },
  { id: 'h-4', name: 'Daily Target Completed', color: '#f59e0b', history: {} },
  { id: 'h-5', name: 'Night Journal & Tomorrow Plan', color: '#8b5cf6', history: {} },
];

interface DailyActionStoreState {
  habits: DailyHabit[];
  dailyNotes: Record<string, string>;
  isInitialized: boolean;

  initFromStorage: () => Promise<void>;
  addHabit: (name: string, color?: string) => void;
  deleteHabit: (id: string) => void;
  toggleHabit: (id: string, dateStr: string) => void;
  setDailyNote: (dateStr: string, note: string) => void;
}

export const useDailyActionStore = create<DailyActionStoreState>((set, get) => ({
  habits: DEFAULT_HABITS,
  dailyNotes: {},
  isInitialized: false,

  initFromStorage: async () => {
    if (get().isInitialized) return;

    let habits = DEFAULT_HABITS;
    let notes: Record<string, string> = {};

    try {
      const [idbH, idbN] = await Promise.all([
        idbGet<DailyHabit[]>(KEY_DAILY_HABITS),
        idbGet<Record<string, string>>(KEY_DAILY_NOTES),
      ]);

      if (Array.isArray(idbH) && idbH.length > 0) habits = idbH;
      if (idbN && typeof idbN === 'object') notes = idbN;

      // Fallback to legacy localStorage if indexeddb was empty
      if (!idbH && typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('local_app_state') || window.localStorage.getItem('appState');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed.habits) && parsed.habits.length > 0) {
              habits = parsed.habits;
              await idbSet(KEY_DAILY_HABITS, habits);
            }
          } catch {}
        }
      }
    } catch (err) {
      console.warn('[useDailyActionStore] Storage load error:', err);
    }

    set({
      habits,
      dailyNotes: notes,
      isInitialized: true,
    });
  },

  addHabit: (name, color = '#6366f1') => {
    const { habits } = get();
    const newHabit: DailyHabit = {
      id: `h_${Date.now()}`,
      name: name.trim(),
      color,
      history: {},
    };

    const updated = [...habits, newHabit];
    set({ habits: updated });
    idbSet(KEY_DAILY_HABITS, updated);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { habits: updated, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },

  deleteHabit: (id) => {
    const { habits } = get();
    const updated = habits.filter((h) => h.id !== id);

    set({ habits: updated });
    idbSet(KEY_DAILY_HABITS, updated);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { habits: updated, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },

  toggleHabit: (id, dateStr) => {
    const { habits } = get();
    const updated = habits.map((h) => {
      if (h.id === id) {
        const history = { ...h.history };
        if (history[dateStr]) {
          delete history[dateStr];
        } else {
          history[dateStr] = true;
        }
        return { ...h, history };
      }
      return h;
    });

    set({ habits: updated });
    idbSet(KEY_DAILY_HABITS, updated);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { habits: updated, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },

  setDailyNote: (dateStr, note) => {
    const { dailyNotes } = get();
    const updated = { ...dailyNotes, [dateStr]: note };

    set({ dailyNotes: updated });
    idbSet(KEY_DAILY_NOTES, updated);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { dailyNotes: updated, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },
}));
