/**
 * X-29 Authoritative Exam Store (stores/useExamStore.ts)
 * 
 * Manages Exam Routine schedules, active routine set switcher (Set 1 vs Set 2),
 * and countdown exam target selection.
 */

import { create } from 'zustand';
import type { ExamRoutineItem } from '@/types/exam';
import { DEFAULT_EXAM_ROUTINE } from '@/features/exam/services/examService';
import { idbGet, idbSet } from '@/lib/storage/indexeddb';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';

const KEY_EXAM_ROUTINE = 'x29_exam_routine';
const KEY_ACTIVE_SET = 'x29_exam_active_set';
const KEY_COUNTDOWN_TARGET = 'x29_exam_countdown_id';

interface ExamStoreState {
  examRoutine: ExamRoutineItem[];
  activeRoutineSet: number;
  selectedCountdownExamId: string;
  isInitialized: boolean;

  initFromStorage: () => Promise<void>;
  addExam: (exam: Omit<ExamRoutineItem, 'id'>) => void;
  updateExam: (id: string, updates: Partial<ExamRoutineItem>) => void;
  deleteExam: (id: string) => void;
  toggleExamCompleted: (id: string) => void;
  setActiveRoutineSet: (setNum: number) => void;
  setSelectedCountdownExamId: (id: string) => void;
}

export const useExamStore = create<ExamStoreState>((set, get) => ({
  examRoutine: DEFAULT_EXAM_ROUTINE,
  activeRoutineSet: 1,
  selectedCountdownExamId: 'auto',
  isInitialized: false,

  initFromStorage: async () => {
    if (get().isInitialized) return;

    let routine = DEFAULT_EXAM_ROUTINE;
    let activeSet = 1;
    let targetId = 'auto';

    try {
      const [idbRoutine, idbSetNum, idbTarget] = await Promise.all([
        idbGet<ExamRoutineItem[]>(KEY_EXAM_ROUTINE),
        idbGet<number>(KEY_ACTIVE_SET),
        idbGet<string>(KEY_COUNTDOWN_TARGET),
      ]);

      if (Array.isArray(idbRoutine) && idbRoutine.length > 0) routine = idbRoutine;
      if (idbSetNum !== null && idbSetNum !== undefined) activeSet = idbSetNum;
      if (idbTarget) targetId = idbTarget;

      if (!idbRoutine && typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('local_app_state') || window.localStorage.getItem('appState');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed.examRoutine) && parsed.examRoutine.length > 0) {
              routine = parsed.examRoutine;
              await idbSet(KEY_EXAM_ROUTINE, routine);
            }
            if (parsed.activeRoutineSet !== undefined) {
              activeSet = Number(parsed.activeRoutineSet);
              await idbSet(KEY_ACTIVE_SET, activeSet);
            }
            if (parsed.selectedCountdownExamId) {
              targetId = parsed.selectedCountdownExamId;
              await idbSet(KEY_COUNTDOWN_TARGET, targetId);
            }
          } catch {}
        }
      }
    } catch (err) {
      console.warn('[useExamStore] Storage load error:', err);
    }

    set({
      examRoutine: routine,
      activeRoutineSet: activeSet,
      selectedCountdownExamId: targetId,
      isInitialized: true,
    });
  },

  addExam: (examData) => {
    const { examRoutine, activeRoutineSet } = get();
    const newExam: ExamRoutineItem = {
      ...examData,
      id: `exam_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      routineSet: examData.routineSet || activeRoutineSet,
    };
    const updated = [...examRoutine, newExam];

    set({ examRoutine: updated });
    idbSet(KEY_EXAM_ROUTINE, updated);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { examRoutine: updated, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },

  updateExam: (id, updates) => {
    const { examRoutine } = get();
    const updated = examRoutine.map((item) => {
      if (item.id === id) {
        return { ...item, ...updates };
      }
      return item;
    });

    set({ examRoutine: updated });
    idbSet(KEY_EXAM_ROUTINE, updated);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { examRoutine: updated, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },

  deleteExam: (id) => {
    const { examRoutine } = get();
    const updated = examRoutine.filter((item) => item.id !== id);

    set({ examRoutine: updated });
    idbSet(KEY_EXAM_ROUTINE, updated);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { examRoutine: updated, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },

  toggleExamCompleted: (id) => {
    const { examRoutine } = get();
    const updated = examRoutine.map((item) => {
      if (item.id === id) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });

    set({ examRoutine: updated });
    idbSet(KEY_EXAM_ROUTINE, updated);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { examRoutine: updated, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },

  setActiveRoutineSet: (setNum) => {
    set({ activeRoutineSet: setNum });
    idbSet(KEY_ACTIVE_SET, setNum);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { activeRoutineSet: setNum, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },

  setSelectedCountdownExamId: (id) => {
    set({ selectedCountdownExamId: id });
    idbSet(KEY_COUNTDOWN_TARGET, id);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { selectedCountdownExamId: id, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },
}));
