/**
 * X-29 Authoritative Task Store (stores/useTaskStore.ts)
 * 
 * Manages study tasks, chapter completion states, and revision schedules.
 */

import { create } from 'zustand';
import type { StudyTask } from '@/types/task';
import { toggleChapterTask } from '@/features/tasks/services/taskService';
import { idbGet, idbSet } from '@/lib/storage/indexeddb';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';

const KEY_TASKS = 'x29_study_tasks';

interface TaskStoreState {
  tasks: StudyTask[];
  isInitialized: boolean;

  initFromStorage: () => Promise<void>;
  toggleTask: (id: string | number) => void;
  toggleChapter: (subject: string, chapter: number, trackId?: string) => void;
  addTask: (task: Omit<StudyTask, 'id'>) => void;
  deleteTask: (id: string | number) => void;
}

export const useTaskStore = create<TaskStoreState>((set, get) => ({
  tasks: [],
  isInitialized: false,

  initFromStorage: async () => {
    if (get().isInitialized) return;

    let tasks: StudyTask[] = [];
    try {
      const idbTasks = await idbGet<StudyTask[]>(KEY_TASKS);
      if (Array.isArray(idbTasks) && idbTasks.length > 0) {
        tasks = idbTasks;
      } else if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('local_app_state') || window.localStorage.getItem('appState');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed.tasks) && parsed.tasks.length > 0) {
              tasks = parsed.tasks;
              await idbSet(KEY_TASKS, tasks);
            }
          } catch {}
        }
      }
    } catch (err) {
      console.warn('[useTaskStore] Storage load error:', err);
    }

    set({ tasks, isInitialized: true });
  },

  toggleTask: (id: string | number) => {
    const { tasks } = get();
    const now = new Date().toISOString();
    const updated = tasks.map((t) => {
      if (String(t.id) === String(id)) {
        const nextCompleted = !t.completed;
        return {
          ...t,
          completed: nextCompleted,
          actualDateCompleted: nextCompleted ? now : null,
          updatedAt: Date.now(),
        };
      }
      return t;
    });

    set({ tasks: updated });
    idbSet(KEY_TASKS, updated);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { tasks: updated, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },

  toggleChapter: (subject: string, chapter: number, trackId?: string) => {
    const { tasks } = get();
    const updated = toggleChapterTask(tasks, subject, chapter, trackId);

    set({ tasks: updated });
    idbSet(KEY_TASKS, updated);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { tasks: updated, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },

  addTask: (taskData) => {
    const { tasks } = get();
    const newTask: StudyTask = {
      ...taskData,
      id: `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      updatedAt: Date.now(),
    };
    const updated = [newTask, ...tasks];

    set({ tasks: updated });
    idbSet(KEY_TASKS, updated);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { tasks: updated, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },

  deleteTask: (id: string | number) => {
    const { tasks } = get();
    const updated = tasks.filter((t) => String(t.id) !== String(id));

    set({ tasks: updated });
    idbSet(KEY_TASKS, updated);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { tasks: updated, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  },
}));
