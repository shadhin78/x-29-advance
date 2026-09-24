/**
 * X-29 Authoritative Exam Store (stores/useExamStore.ts)
 * 
 * Manages Exam Sessions, Exam Routine items, active countdown exam target selection,
 * and multi-tier synchronization with IndexedDB and Firestore.
 */

import { create } from 'zustand';
import type { ExamRoutineItem, ExamSession } from '@/types/exam';
import {
  DEFAULT_EXAM_SESSIONS,
  DEFAULT_EXAM_ROUTINE,
} from '@/features/exam/services/examService';
import { idbGet, idbSet } from '@/lib/storage/indexeddb';
import { syncCloud } from '@/lib/sync/syncService';

const KEY_EXAM_SESSIONS = 'x29_exam_sessions';
const KEY_EXAM_ROUTINE = 'x29_exam_routine';
const KEY_COUNTDOWN_TARGET = 'x29_exam_countdown_id';
const KEY_ACTIVE_SET = 'x29_exam_active_set';

interface ExamStoreState {
  examSessions: ExamSession[];
  examRoutine: ExamRoutineItem[];
  selectedCountdownExamId: string;
  activeRoutineSet: number;
  isInitialized: boolean;

  initFromStorage: () => Promise<void>;

  // Session Actions
  addSession: (session: Omit<ExamSession, 'id'>) => string;
  updateSession: (id: string, updates: Partial<ExamSession>) => void;
  deleteSession: (id: string) => void;

  // Exam Actions
  addExam: (exam: Omit<ExamRoutineItem, 'id'>) => string;
  updateExam: (id: string, updates: Partial<ExamRoutineItem>) => void;
  deleteExam: (id: string) => void;
  toggleExamStatus: (id: string) => void;
  toggleExamCompleted: (id: string) => void;

  // Countdown & Set Actions
  setSelectedCountdownExamId: (id: string) => void;
  setActiveRoutineSet: (setNum: number) => void;
}

function syncToWindowAppState(sessions: ExamSession[], routine: ExamRoutineItem[], targetId?: string) {
  if (typeof window !== 'undefined' && (window as unknown as { AppState?: Record<string, unknown> }).AppState) {
    const appState = (window as unknown as { AppState: Record<string, unknown> }).AppState;
    appState.examSessions = sessions;
    appState.examRoutine = routine;
    if (targetId) appState.selectedCountdownExamId = targetId;
  }
}

export const useExamStore = create<ExamStoreState>((set, get) => ({
  examSessions: DEFAULT_EXAM_SESSIONS,
  examRoutine: DEFAULT_EXAM_ROUTINE,
  selectedCountdownExamId: 'auto',
  activeRoutineSet: 1,
  isInitialized: false,

  initFromStorage: async () => {
    if (get().isInitialized) return;

    let sessions = DEFAULT_EXAM_SESSIONS;
    let routine = DEFAULT_EXAM_ROUTINE;
    let activeSet = 1;
    let targetId = 'auto';

    try {
      const [idbSessions, idbRoutine, idbSetNum, idbTarget] = await Promise.all([
        idbGet<ExamSession[]>(KEY_EXAM_SESSIONS),
        idbGet<ExamRoutineItem[]>(KEY_EXAM_ROUTINE),
        idbGet<number>(KEY_ACTIVE_SET),
        idbGet<string>(KEY_COUNTDOWN_TARGET),
      ]);

      if (Array.isArray(idbSessions) && idbSessions.length > 0) sessions = idbSessions;
      if (Array.isArray(idbRoutine) && idbRoutine.length > 0) routine = idbRoutine;
      if (idbSetNum !== null && idbSetNum !== undefined) activeSet = idbSetNum;
      if (idbTarget) targetId = idbTarget;

      // Fallback check against localStorage legacy AppState
      if ((!idbSessions || !idbRoutine) && typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('local_app_state') || window.localStorage.getItem('appState');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed.examSessions) && parsed.examSessions.length > 0) {
              sessions = parsed.examSessions;
              await idbSet(KEY_EXAM_SESSIONS, sessions);
            }
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

    syncToWindowAppState(sessions, routine, targetId);

    set({
      examSessions: sessions,
      examRoutine: routine,
      activeRoutineSet: activeSet,
      selectedCountdownExamId: targetId,
      isInitialized: true,
    });
  },

  addSession: (sessionData) => {
    const { examSessions } = get();
    const newId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newSession: ExamSession = {
      ...sessionData,
      id: newId,
      createdAt: Date.now(),
    };
    const updated = [...examSessions, newSession];

    set({ examSessions: updated });
    idbSet(KEY_EXAM_SESSIONS, updated);
    syncToWindowAppState(updated, get().examRoutine);

    syncCloud({ examSessions: updated });

    return newId;
  },

  updateSession: (id, updates) => {
    const { examSessions } = get();
    const updated = examSessions.map((s) => {
      if (s.id === id) {
        return { ...s, ...updates, updatedAt: Date.now() };
      }
      return s;
    });

    set({ examSessions: updated });
    idbSet(KEY_EXAM_SESSIONS, updated);
    syncToWindowAppState(updated, get().examRoutine);

    syncCloud({ examSessions: updated });
  },

  deleteSession: (id) => {
    const { examSessions, examRoutine } = get();
    const updatedSessions = examSessions.filter((s) => s.id !== id);
    const updatedRoutine = examRoutine.filter((e) => e.sessionId !== id);

    set({ examSessions: updatedSessions, examRoutine: updatedRoutine });
    idbSet(KEY_EXAM_SESSIONS, updatedSessions);
    idbSet(KEY_EXAM_ROUTINE, updatedRoutine);
    syncToWindowAppState(updatedSessions, updatedRoutine);

    syncCloud({ examSessions: updatedSessions, examRoutine: updatedRoutine });
  },

  addExam: (examData) => {
    const { examRoutine, activeRoutineSet } = get();
    const newId = `exam_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const isCompleted = examData.completed || examData.status === 'completed';
    const newExam: ExamRoutineItem = {
      ...examData,
      id: newId,
      status: isCompleted ? 'completed' : 'upcoming',
      completed: isCompleted,
      routineSet: examData.routineSet || activeRoutineSet,
      createdAt: Date.now(),
    };
    const updated = [...examRoutine, newExam];

    set({ examRoutine: updated });
    idbSet(KEY_EXAM_ROUTINE, updated);
    syncToWindowAppState(get().examSessions, updated);

    syncCloud({ examRoutine: updated });

    return newId;
  },

  updateExam: (id, updates) => {
    const { examRoutine } = get();
    const updated = examRoutine.map((item) => {
      if (item.id === id) {
        const merged = { ...item, ...updates, updatedAt: Date.now() };
        if (updates.status) {
          merged.completed = updates.status === 'completed';
        } else if (updates.completed !== undefined) {
          merged.status = updates.completed ? 'completed' : 'upcoming';
        }
        return merged;
      }
      return item;
    });

    set({ examRoutine: updated });
    idbSet(KEY_EXAM_ROUTINE, updated);
    syncToWindowAppState(get().examSessions, updated);

    syncCloud({ examRoutine: updated });
  },

  deleteExam: (id) => {
    const { examRoutine, selectedCountdownExamId } = get();
    const updated = examRoutine.filter((item) => item.id !== id);
    const newTargetId = selectedCountdownExamId === id ? 'auto' : selectedCountdownExamId;

    set({ examRoutine: updated, selectedCountdownExamId: newTargetId });
    idbSet(KEY_EXAM_ROUTINE, updated);
    if (newTargetId !== selectedCountdownExamId) {
      idbSet(KEY_COUNTDOWN_TARGET, newTargetId);
    }
    syncToWindowAppState(get().examSessions, updated, newTargetId);

    syncCloud({ examRoutine: updated, selectedCountdownExamId: newTargetId });
  },

  toggleExamStatus: (id) => {
    const { examRoutine } = get();
    const updated = examRoutine.map((item) => {
      if (item.id === id) {
        const isCompleted = item.status === 'completed' || item.completed;
        const nextCompleted = !isCompleted;
        return {
          ...item,
          status: nextCompleted ? ('completed' as const) : ('upcoming' as const),
          completed: nextCompleted,
          updatedAt: Date.now(),
        };
      }
      return item;
    });

    set({ examRoutine: updated });
    idbSet(KEY_EXAM_ROUTINE, updated);
    syncToWindowAppState(get().examSessions, updated);

    syncCloud({ examRoutine: updated });
  },

  toggleExamCompleted: (id) => {
    get().toggleExamStatus(id);
  },

  setActiveRoutineSet: (setNum) => {
    set({ activeRoutineSet: setNum });
    idbSet(KEY_ACTIVE_SET, setNum);

    syncCloud({ activeRoutineSet: setNum });
  },

  setSelectedCountdownExamId: (id) => {
    set({ selectedCountdownExamId: id });
    idbSet(KEY_COUNTDOWN_TARGET, id);
    syncToWindowAppState(get().examSessions, get().examRoutine, id);

    syncCloud({ selectedCountdownExamId: id });
  },
}));
