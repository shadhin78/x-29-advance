/**
 * X-29 Authoritative Pace Store (stores/usePaceStore.ts)
 * 
 * Manages:
 * - Pace goals, bundle goals, and timelines
 * - Active timeline goal selection
 * - Local-first IndexedDB persistence with Firestore synchronization
 */

import { create } from 'zustand';
import type { PaceGoal } from '@/types/pace';
import { DEFAULT_PACE_GOALS } from '@/features/pace/services/paceEngine';
import { idbGet, idbSet } from '@/lib/storage/indexeddb';
import { syncCloud } from '@/lib/sync/syncService';

const KEY_PACE_GOALS = 'x29_pace_goals';
const KEY_ACTIVE_GOAL_ID = 'x29_pace_active_goal_id';

interface PaceStoreState {
  paceGoals: PaceGoal[];
  activeGoalId: string;
  isInitialized: boolean;

  initFromStorage: () => Promise<void>;
  addGoal: (goalData: Omit<PaceGoal, 'id'>) => void;
  updateGoal: (id: string, updates: Partial<PaceGoal>) => void;
  deleteGoal: (id: string) => void;
  setActiveGoalId: (id: string) => void;
}

export const usePaceStore = create<PaceStoreState>((set, get) => ({
  paceGoals: DEFAULT_PACE_GOALS,
  activeGoalId: 'pace-global-default',
  isInitialized: false,

  initFromStorage: async () => {
    if (get().isInitialized) return;

    let goals = DEFAULT_PACE_GOALS;
    let activeId = 'pace-global-default';

    try {
      const [idbGoals, idbActiveId] = await Promise.all([
        idbGet<PaceGoal[]>(KEY_PACE_GOALS),
        idbGet<string>(KEY_ACTIVE_GOAL_ID),
      ]);

      if (Array.isArray(idbGoals) && idbGoals.length > 0) goals = idbGoals;
      if (idbActiveId) activeId = idbActiveId;

      // Fallback to legacy localStorage if indexeddb was empty
      if (!idbGoals && typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('local_app_state') || window.localStorage.getItem('appState');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed.paceGoals) && parsed.paceGoals.length > 0) {
              goals = parsed.paceGoals;
              await idbSet(KEY_PACE_GOALS, goals);
            }
          } catch {}
        }
      }
    } catch (err) {
      console.warn('[usePaceStore] Storage load error:', err);
    }

    set({
      paceGoals: goals,
      activeGoalId: activeId,
      isInitialized: true,
    });
  },

  addGoal: (goalData) => {
    const { paceGoals } = get();
    const newGoal: PaceGoal = {
      ...goalData,
      id: `pace_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    };

    const updated = [...paceGoals, newGoal];
    set({ paceGoals: updated });
    idbSet(KEY_PACE_GOALS, updated);

    syncCloud({ paceGoals: updated });
  },

  updateGoal: (id, updates) => {
    const { paceGoals } = get();
    const updated = paceGoals.map((g) => (g.id === id ? { ...g, ...updates } : g));

    set({ paceGoals: updated });
    idbSet(KEY_PACE_GOALS, updated);

    syncCloud({ paceGoals: updated });
  },

  deleteGoal: (id) => {
    const { paceGoals, activeGoalId } = get();
    const updated = paceGoals.filter((g) => g.id !== id);

    let nextActive = activeGoalId;
    if (activeGoalId === id) {
      nextActive = updated[0]?.id || '';
    }

    set({ paceGoals: updated, activeGoalId: nextActive });
    idbSet(KEY_PACE_GOALS, updated);
    idbSet(KEY_ACTIVE_GOAL_ID, nextActive);

    syncCloud({ paceGoals: updated });
  },

  setActiveGoalId: (id) => {
    set({ activeGoalId: id });
    idbSet(KEY_ACTIVE_GOAL_ID, id);
  },
}));
