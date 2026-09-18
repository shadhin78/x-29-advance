'use client';

/**
 * X-29 Main Timer Coordinator Hook (features/focus/hooks/useTimer.ts)
 * 
 * Coordinates:
 * - Authoritative Zustand timer store
 * - Pure timestamp ticker engine
 * - Audio chime completion feedback
 * - Auto-saving completed sessions
 */

import { useEffect, useCallback } from 'react';
import { useTimerStore } from '@/stores/useTimerStore';
import { useTimerTicker } from './useTimerTicker';
import { playCompletionChime } from '@/features/focus/services/timerAudioService';

export function useTimer() {
  const {
    activeTimer,
    timerLogs,
    dailyFocusHoursTarget,
    sessionHistoryFilter,
    subjectFocusTargets,
    isInitialized,
    initFromStorage,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    setMode,
    setPreset,
    setCustomDuration,
    setAlarmConfig,
    setSelectedSubject,
    saveCurrentSession,
    addManualSession,
    deleteSession,
    setSessionHistoryFilter,
    setDailyFocusHoursTarget,
    setSubjectTarget,
    deleteSubjectTarget,
  } = useTimerStore();

  // Initialize once from storage on mount
  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  // Target reached callback: chime + auto-save
  const handleTargetReached = useCallback(() => {
    playCompletionChime();
    saveCurrentSession();
  }, [saveCurrentSession]);

  const ticker = useTimerTicker({
    isRunning: activeTimer.isRunning,
    startTime: activeTimer.startTime,
    elapsedBeforeStart: activeTimer.elapsedBeforeStart,
    targetDuration: activeTimer.targetDuration,
    mode: activeTimer.mode,
    onTargetReached: handleTargetReached,
  });

  return {
    // Store state
    activeTimer,
    timerLogs,
    dailyFocusHoursTarget,
    sessionHistoryFilter,
    subjectFocusTargets,
    isInitialized,

    // Ticker derived values
    elapsedMs: ticker.elapsedMs,
    remainingMs: ticker.remainingMs,
    displayMs: ticker.displayMs,
    progressPercent: ticker.progressPercent,
    digits: ticker.digits,
    angles: ticker.angles,
    isCompleted: ticker.isCompleted,

    // Actions
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    setMode,
    setPreset,
    setCustomDuration,
    setAlarmConfig,
    setSelectedSubject,
    saveCurrentSession,
    addManualSession,
    deleteSession,
    setSessionHistoryFilter,
    setDailyFocusHoursTarget,
    setSubjectTarget,
    deleteSubjectTarget,
  };
}
