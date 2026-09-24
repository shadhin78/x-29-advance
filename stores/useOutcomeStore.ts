/**
 * X-29 Authoritative Outcome Store (stores/useOutcomeStore.ts)
 * 
 * Manages:
 * - Exam results and semester GPA / CGPA logs
 * - Milestone celebration core target definitions
 * - Result filtering and sort orders
 * - Local-first IndexedDB persistence with Firestore synchronization
 */

import { create } from 'zustand';
import type { SuccessResult, CelebrationTargets } from '@/types/outcome';
import { idbGet, idbSet } from '@/lib/storage/indexeddb';
import { syncCloud } from '@/lib/sync/syncService';

const KEY_SUCCESS_RESULTS = 'x29_success_results';
const KEY_CELEBRATION_TARGETS = 'x29_celebration_targets';

interface OutcomeStoreState {
  successResults: SuccessResult[];
  celebrationTargets: CelebrationTargets;
  dateSortOrder: 'newest' | 'oldest';
  selectedProgramFilter: string;
  isInitialized: boolean;

  initFromStorage: () => Promise<void>;
  addResult: (result: Omit<SuccessResult, 'id'>) => void;
  addBatchResults: (results: Omit<SuccessResult, 'id'>[]) => void;
  updateResult: (id: string, updates: Partial<SuccessResult>) => void;
  deleteResult: (id: string) => void;
  deleteProgramGroup: (programName: string, date?: string) => void;
  setCelebrationTargets: (targets: CelebrationTargets) => void;
  toggleDateSortOrder: () => void;
  setSelectedProgramFilter: (program: string) => void;
}

export const useOutcomeStore = create<OutcomeStoreState>((set, get) => ({
  successResults: [],
  celebrationTargets: { programs: [], subjects: [] },
  dateSortOrder: 'newest',
  selectedProgramFilter: 'ALL',
  isInitialized: false,

  initFromStorage: async () => {
    if (get().isInitialized) return;

    let results: SuccessResult[] = [];
    let celebration: CelebrationTargets = { programs: [], subjects: [] };

    try {
      const [idbResults, idbCeleb] = await Promise.all([
        idbGet<SuccessResult[]>(KEY_SUCCESS_RESULTS),
        idbGet<CelebrationTargets>(KEY_CELEBRATION_TARGETS),
      ]);

      if (Array.isArray(idbResults)) results = idbResults;
      if (idbCeleb && (Array.isArray(idbCeleb.programs) || Array.isArray(idbCeleb.subjects))) {
        celebration = idbCeleb;
      }

      // Fallback to legacy localStorage if indexeddb was empty
      if (results.length === 0 && typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('local_app_state') || window.localStorage.getItem('appState');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed.successResults) && parsed.successResults.length > 0) {
              results = parsed.successResults;
              await idbSet(KEY_SUCCESS_RESULTS, results);
            }
            if (parsed.celebrationTargets) {
              celebration = parsed.celebrationTargets;
              await idbSet(KEY_CELEBRATION_TARGETS, celebration);
            }
          } catch {}
        }
      }
    } catch (err) {
      console.warn('[useOutcomeStore] Storage load error:', err);
    }

    set({
      successResults: results,
      celebrationTargets: celebration,
      isInitialized: true,
    });
  },

  addResult: (resultData) => {
    const { successResults } = get();
    const newResult: SuccessResult = {
      ...resultData,
      id: `res_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    };

    const updated = [...successResults, newResult];
    set({ successResults: updated });
    idbSet(KEY_SUCCESS_RESULTS, updated);

    syncCloud({ successResults: updated });
  },

  addBatchResults: (resultsList) => {
    const { successResults } = get();
    const newItems: SuccessResult[] = resultsList.map((r) => ({
      ...r,
      id: `res_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
    }));

    const updated = [...successResults, ...newItems];
    set({ successResults: updated });
    idbSet(KEY_SUCCESS_RESULTS, updated);

    syncCloud({ successResults: updated });
  },

  updateResult: (id, updates) => {
    const { successResults } = get();
    const updated = successResults.map((r) => (r.id === id ? { ...r, ...updates } : r));

    set({ successResults: updated });
    idbSet(KEY_SUCCESS_RESULTS, updated);

    syncCloud({ successResults: updated });
  },

  deleteResult: (id) => {
    const { successResults } = get();
    const updated = successResults.filter((r) => r.id !== id);

    set({ successResults: updated });
    idbSet(KEY_SUCCESS_RESULTS, updated);

    syncCloud({ successResults: updated });
  },

  deleteProgramGroup: (programName, date) => {
    const { successResults } = get();
    const updated = successResults.filter((r) => {
      if (r.title === programName) {
        if (!date || r.date === date) return false;
      }
      return true;
    });

    set({ successResults: updated });
    idbSet(KEY_SUCCESS_RESULTS, updated);

    syncCloud({ successResults: updated });
  },

  setCelebrationTargets: (targets) => {
    set({ celebrationTargets: targets });
    idbSet(KEY_CELEBRATION_TARGETS, targets);

    syncCloud({ celebrationTargets: targets });
  },

  toggleDateSortOrder: () => {
    set((state) => ({
      dateSortOrder: state.dateSortOrder === 'newest' ? 'oldest' : 'newest',
    }));
  },

  setSelectedProgramFilter: (program) => {
    set({ selectedProgramFilter: program });
  },
}));
