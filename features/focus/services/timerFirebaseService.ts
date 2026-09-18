/**
 * X-29 Modular Firebase Timer Service (features/focus/services/timerFirebaseService.ts)
 * 
 * Strict modular Firebase v12 client persistence for timer data.
 * Merges timer data into `users/${uid}` without overwriting unrelated workspace fields.
 * NEVER writes on visual ticks.
 */

import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';
import type { ActiveTimerState, TimerLogSession, SubjectFocusTarget } from '@/types/timer';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export interface CloudTimerPayload {
  activeTimerState?: ActiveTimerState;
  timerLogs?: TimerLogSession[];
  dailyFocusHoursTarget?: number;
  subjectFocusTargets?: Record<string, SubjectFocusTarget>;
  updatedAt?: number;
}

/**
 * Saves timer state directly to Firestore users/${uid} with merge.
 */
export async function saveTimerToCloud(payload: CloudTimerPayload, immediate = false): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.uid) {
    // Offline or unauthenticated; changes remain safe in IndexedDB
    return;
  }

  const performWrite = async () => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const cleanPayload: Record<string, unknown> = {
        updatedAt: Date.now(),
      };

      if (payload.activeTimerState !== undefined) {
        cleanPayload.activeTimerState = payload.activeTimerState;
      }
      if (payload.timerLogs !== undefined) {
        cleanPayload.timerLogs = payload.timerLogs;
      }
      if (payload.dailyFocusHoursTarget !== undefined) {
        cleanPayload.dailyFocusHoursTarget = payload.dailyFocusHoursTarget;
      }
      if (payload.subjectFocusTargets !== undefined) {
        cleanPayload.subjectFocusTargets = payload.subjectFocusTargets;
      }

      await setDoc(userRef, cleanPayload, { merge: true });
    } catch (err) {
      console.warn('[TimerFirebase] Cloud write failed:', err);
    }
  };

  if (immediate) {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    await performWrite();
  } else {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      performWrite();
    }, 1000);
  }
}

/**
 * Loads timer state from Firestore users/${uid} if available.
 */
export async function loadTimerFromCloud(): Promise<CloudTimerPayload | null> {
  const user = auth.currentUser;
  if (!user || !user.uid) {
    return null;
  }

  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      return null;
    }

    const data = snap.data();
    return {
      activeTimerState: data.activeTimerState as ActiveTimerState | undefined,
      timerLogs: data.timerLogs as TimerLogSession[] | undefined,
      dailyFocusHoursTarget: data.dailyFocusHoursTarget as number | undefined,
      subjectFocusTargets: data.subjectFocusTargets as Record<string, SubjectFocusTarget> | undefined,
      updatedAt: data.updatedAt as number | undefined,
    };
  } catch (err) {
    console.warn('[TimerFirebase] Cloud read failed:', err);
    return null;
  }
}
