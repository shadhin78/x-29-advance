'use client';

/**
 * X-29 Timer Ticker Hook (features/focus/hooks/useTimerTicker.ts)
 * 
 * Drives visual clock and chronograph needle updates with timestamp-derived math.
 * Completely isolates high-frequency display re-renders from global application state.
 * 
 * Zero timer drift: derived purely from `Date.now() - startTime`.
 * Zero CPU waste: idle when timer is paused or stopped.
 * Recovers seamlessly from background tab throttling via `visibilitychange`.
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import type { TimerMode, TimerDigits, DialAngles } from '@/types/timer';
import {
  calculateElapsedMs,
  calculateRemainingMs,
  calculateProgressPercentage,
  calculateNeedleAngles,
  formatTimerDigits,
  resolveTimerCompletion,
} from '@/features/focus/services/timerEngine';

interface UseTimerTickerOptions {
  isRunning: boolean;
  startTime: number | null;
  elapsedBeforeStart: number;
  targetDuration: number;
  mode: TimerMode;
  onTargetReached?: () => void;
}

export interface TimerTickerValues {
  elapsedMs: number;
  remainingMs: number;
  displayMs: number;
  progressPercent: number;
  digits: TimerDigits;
  angles: DialAngles;
  isCompleted: boolean;
}

export function useTimerTicker({
  isRunning,
  startTime,
  elapsedBeforeStart,
  targetDuration,
  mode,
  onTargetReached,
}: UseTimerTickerOptions): TimerTickerValues {
  // Local high-frequency tick trigger
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const completedFiredRef = useRef<boolean>(false);
  const onTargetReachedRef = useRef(onTargetReached);

  useEffect(() => {
    onTargetReachedRef.current = onTargetReached;
  }, [onTargetReached]);

  // Reset completion flag whenever timer starts or target changes
  useEffect(() => {
    if (!isRunning) {
      completedFiredRef.current = false;
    }
  }, [isRunning, targetDuration]);

  // Visual refresh loop (50ms interval provides fluid subdial / sweep hand motion without overloading CPU)
  useEffect(() => {
    if (!isRunning) {
      return;
    }

    setNowMs(Date.now());

    const intervalId = setInterval(() => {
      setNowMs(Date.now());
    }, 50);

    // Instant recovery when user switches back to this tab
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setNowMs(Date.now());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning]);

  // Derive all display values purely from timestamps
  const elapsedMs = useMemo(() => {
    return calculateElapsedMs(startTime, elapsedBeforeStart, nowMs, isRunning);
  }, [startTime, elapsedBeforeStart, nowMs, isRunning]);

  const remainingMs = useMemo(() => {
    return calculateRemainingMs(targetDuration, elapsedMs);
  }, [targetDuration, elapsedMs]);

  const displayMs = useMemo(() => {
    if (mode === 'stopwatch') {
      return elapsedMs;
    }
    return remainingMs;
  }, [mode, elapsedMs, remainingMs]);

  const progressPercent = useMemo(() => {
    return calculateProgressPercentage(elapsedMs, targetDuration);
  }, [elapsedMs, targetDuration]);

  const digits = useMemo(() => {
    return formatTimerDigits(displayMs);
  }, [displayMs]);

  const angles = useMemo(() => {
    return calculateNeedleAngles(elapsedMs);
  }, [elapsedMs]);

  const isCompleted = useMemo(() => {
    return resolveTimerCompletion(mode, elapsedMs, targetDuration, isRunning);
  }, [mode, elapsedMs, targetDuration, isRunning]);

  // Trigger completion sound and auto-save callback once
  useEffect(() => {
    if (isCompleted && !completedFiredRef.current) {
      completedFiredRef.current = true;
      if (onTargetReachedRef.current) {
        onTargetReachedRef.current();
      }
    }
  }, [isCompleted]);

  return {
    elapsedMs,
    remainingMs,
    displayMs,
    progressPercent,
    digits,
    angles,
    isCompleted,
  };
}
