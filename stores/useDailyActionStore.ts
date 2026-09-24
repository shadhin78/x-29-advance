/**
 * X-29 Authoritative Daily Actions & Habits Store (stores/useDailyActionStore.ts)
 * 
 * Manages:
 * - Daily recurring actions/habits with legacy parity (title, desc, color, icon, track, startDate)
 * - Day-by-day habit completion matrix (180+ days)
 * - Streaks and calendar heatmap history
 * - Local-first IndexedDB persistence with debounced Firestore synchronization
 */

import { create } from 'zustand';
import type { DailyHabit } from '@/types/habits';
import { idbGet, idbSet } from '@/lib/storage/indexeddb';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';

const KEY_DAILY_HABITS = 'x29_daily_habits';
const KEY_DAILY_NOTES = 'x29_daily_notes';

export const DEFAULT_DAILY_ACTIONS: DailyHabit[] = [
  {
    id: 'gym',
    name: 'Physical Fitness & Gym',
    title: 'Physical Fitness & Gym',
    desc: 'Workout 45 mins & Health',
    question: 'Workout 45 mins & Health?',
    color: 'emerald',
    icon: 'gym',
    priority: 1,
    order: 1,
    history: {},
  },
  {
    id: 'code',
    name: 'Core Engineering / Code',
    title: 'Core Engineering / Code',
    desc: 'Build & ship high-impact code',
    question: 'Build & ship high-impact code?',
    color: 'indigo',
    icon: 'freelance',
    priority: 2,
    order: 2,
    history: {},
  },
  {
    id: 'study',
    name: 'Deep Syllabus Mastery',
    title: 'Deep Syllabus Mastery',
    desc: 'Theory revision & problem sets',
    question: 'Theory revision & problem sets?',
    color: 'blue',
    icon: 'book',
    priority: 3,
    order: 3,
    history: {},
  },
  {
    id: 'problem',
    name: 'Practice Problem Solving',
    title: 'Practice Problem Solving',
    desc: 'Complete minimum 5 problems',
    question: 'Complete minimum 5 problems?',
    color: 'orange',
    icon: 'generic',
    priority: 4,
    order: 4,
    history: {},
  },
  {
    id: 'review',
    name: 'Daily Target & Review',
    title: 'Daily Target & Review',
    desc: 'Track targets & journal review',
    question: 'Track targets & journal review?',
    color: 'purple',
    icon: 'briefcase',
    priority: 5,
    order: 5,
    history: {},
  },
];

interface DailyActionStoreState {
  habits: DailyHabit[];
  dailyNotes: Record<string, string>;
  isInitialized: boolean;

  initFromStorage: () => Promise<void>;
  addHabit: (nameOrConfig: string | Partial<DailyHabit>, color?: string) => void;
  updateHabit: (id: string, updates: Partial<DailyHabit>) => void;
  deleteHabit: (id: string) => void;
  setDailyState: (id: string, isYes: boolean, dateStr?: string) => void;
  toggleHabit: (id: string, dateStr: string) => void;
  setDailyNote: (dateStr: string, note: string) => void;
  reorderHabits: (habits: DailyHabit[]) => void;
  resetHabitsToCleanSlate: () => Promise<void>;
  importFullHabitsState: (habits: DailyHabit[], notes?: Record<string, string>) => Promise<void>;
}

export const useDailyActionStore = create<DailyActionStoreState>((set, get) => ({
  habits: DEFAULT_DAILY_ACTIONS,
  dailyNotes: {},
  isInitialized: false,

  initFromStorage: async () => {
    if (get().isInitialized) return;

    let habits = DEFAULT_DAILY_ACTIONS;
    let notes: Record<string, string> = {};

    try {
      const [idbH, idbN] = await Promise.all([
        idbGet<DailyHabit[]>(KEY_DAILY_HABITS),
        idbGet<Record<string, string>>(KEY_DAILY_NOTES),
      ]);

      if (Array.isArray(idbH) && idbH.length > 0) {
        habits = idbH.map((h, i) => ({
          ...h,
          name: h.name || h.title || `Habit ${i + 1}`,
          title: h.title || h.name || `Habit ${i + 1}`,
          color: h.color || 'blue',
          history: h.history || {},
        }));
      }
      if (idbN && typeof idbN === 'object') notes = idbN;

      // Fallback to legacy localStorage if indexeddb was empty
      if (!idbH && typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('local_app_state') || window.localStorage.getItem('appState');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            const legacyActions = parsed.customActions || parsed.habits;
            if (Array.isArray(legacyActions) && legacyActions.length > 0) {
              const legacyTasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];

              habits = legacyActions.map((a: any, idx: number) => {
                const history: Record<string, boolean> = {};
                legacyTasks.forEach((t: any) => {
                  if (t.date && t[a.id]) {
                    history[t.date] = true;
                  }
                });

                return {
                  id: a.id || `act_${Date.now()}_${idx}`,
                  name: a.title || a.name || `Action ${idx + 1}`,
                  title: a.title || a.name || `Action ${idx + 1}`,
                  desc: a.desc || a.question || '',
                  question: a.question || a.desc || '',
                  startDate: a.startDate || '',
                  track: a.track || '',
                  color: a.color || 'blue',
                  icon: a.icon || 'generic',
                  priority: a.priority ?? (idx + 1),
                  order: a.order ?? (idx + 1),
                  history,
                };
              });

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

  addHabit: (nameOrConfig, color = 'indigo') => {
    const { habits } = get();
    let newHabit: DailyHabit;

    if (typeof nameOrConfig === 'string') {
      newHabit = {
        id: `act_${Date.now()}`,
        name: nameOrConfig.trim(),
        title: nameOrConfig.trim(),
        color,
        icon: 'generic',
        priority: habits.length + 1,
        order: habits.length + 1,
        history: {},
      };
    } else {
      const title = (nameOrConfig.title || nameOrConfig.name || 'New Action').trim();
      newHabit = {
        id: nameOrConfig.id || `act_${Date.now()}`,
        name: title,
        title: title,
        desc: nameOrConfig.desc || '',
        question: nameOrConfig.question || '',
        startDate: nameOrConfig.startDate || '',
        track: nameOrConfig.track || '',
        color: nameOrConfig.color || color,
        icon: nameOrConfig.icon || 'generic',
        priority: nameOrConfig.priority ?? (habits.length + 1),
        order: nameOrConfig.order ?? (habits.length + 1),
        history: nameOrConfig.history || {},
      };
    }

    const updated = [...habits, newHabit];
    set({ habits: updated });
    idbSet(KEY_DAILY_HABITS, updated);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { habits: updated, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },

  updateHabit: (id, updates) => {
    const { habits } = get();
    const updated = habits.map((h) => {
      if (h.id === id) {
        return {
          ...h,
          ...updates,
          name: updates.title || updates.name || h.name,
          title: updates.title || updates.name || h.title,
        };
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

  setDailyState: (id, isYes, dateStr) => {
    const activeDate = dateStr || new Date().toISOString().slice(0, 10);
    const { habits } = get();

    const updated = habits.map((h) => {
      if (h.id === id) {
        const history = { ...h.history };
        history[activeDate] = isYes;
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

  toggleHabit: (id, dateStr) => {
    const { habits } = get();
    const updated = habits.map((h) => {
      if (h.id === id) {
        const history = { ...h.history };
        const current = history[dateStr];
        history[dateStr] = !current;
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

  toggleModalDay: (dateStr: string, id: string) => {
    get().toggleHabit(id, dateStr);
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

  reorderHabits: (updatedHabits) => {
    set({ habits: updatedHabits });
    idbSet(KEY_DAILY_HABITS, updatedHabits);

    const user = auth.currentUser;
    if (user) {
      setDoc(
        doc(db, 'users', user.uid),
        { habits: updatedHabits, updatedAt: Date.now() },
        { merge: true }
      ).catch(() => {});
    }
  },

  resetHabitsToCleanSlate: async () => {
    const { idbDel } = await import('@/lib/storage/indexeddb');
    await Promise.all([idbDel(KEY_DAILY_HABITS), idbDel(KEY_DAILY_NOTES)]);

    set({ habits: [], dailyNotes: {} });

    const user = auth.currentUser;
    if (user) {
      setDoc(
        doc(db, 'users', user.uid),
        { habits: [], dailyNotes: {}, updatedAt: Date.now() },
        { merge: true }
      ).catch(() => {});
    }
  },

  importFullHabitsState: async (habits, notes = {}) => {
    await Promise.all([
      idbSet(KEY_DAILY_HABITS, habits),
      idbSet(KEY_DAILY_NOTES, notes),
    ]);

    set({ habits, dailyNotes: notes });

    const user = auth.currentUser;
    if (user) {
      setDoc(
        doc(db, 'users', user.uid),
        { habits, dailyNotes: notes, updatedAt: Date.now() },
        { merge: true }
      ).catch(() => {});
    }
  },
}));
