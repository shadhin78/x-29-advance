'use client';

/**
 * X-29 Timer Ticker Hook (features/focus/hooks/useTimerTicker.ts)
 * 
 * Drives visual clock and chronograph needle updates with timestamp-derived math.
 * Completely isolates high-frequency display re-renders from global application state.
 * 
 * STEP 027 Mobile & Android Low-Power Optimization:
 * - Zero timer drift: derived purely from OS hardware epoch timestamp (Date.now() - startTime).
 * - Adaptive interval: 50ms for 60fps chronograph needle in foreground; 1000ms low-power in background.
 * - Instant synchronization on Android wake / app switch / tab restore: listens to visibilitychange,
 *   pageshow, window focus, and online events.
 * - Minimal memory allocations: caches formatted digit objects across sub-second frames.
 * - Zero CPU waste: completely idle when timer is paused or stopped.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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

  // Visual refresh loop with adaptive foreground (50ms) / background (1000ms) frequency
  useEffect(() => {
    if (!isRunning) {
      return;
    }

    // Initial immediate sync
    setNowMs(Date.now());

    let intervalId: NodeJS.Timeout | null = null;

    const setupInterval = () => {
      if (intervalId) clearInterval(intervalId);
      // If tab is hidden (backgrounded / phone locked), throttle to 1s to conserve Android battery
      const intervalDelay = typeof document !== 'undefined' && document.hidden ? 1000 : 50;
      intervalId = setInterval(() => {
        setNowMs(Date.now());
      }, intervalDelay);
    };

    setupInterval();

    // Instant recovery when user unlocks phone, switches back to app, or restores from bfcache
    const handleWakeSync = () => {
      setNowMs(Date.now());
      setupInterval();
    };

    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', handleWakeSync);
      window.addEventListener('focus', handleWakeSync);
      window.addEventListener('pageshow', handleWakeSync);
      window.addEventListener('online', handleWakeSync);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (typeof window !== 'undefined') {
        document.removeEventListener('visibilitychange', handleWakeSync);
        window.removeEventListener('focus', handleWakeSync);
        window.removeEventListener('pageshow', handleWakeSync);
        window.removeEventListener('online', handleWakeSync);
      }
    };
  }, [isRunning]);

  // Derive all display values purely from timestamps (zero drift)
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

  // Cache digits across sub-second ticks when display second is unchanged
  const prevDisplaySecRef = useRef<number>(-1);
  const cachedDigitsRef = useRef<TimerDigits | null>(null);

  const digits = useMemo(() => {
    const currentSec = Math.floor(displayMs / 1000);
    // Format digits once per second (or on first run) to eliminate 95% of string allocations during 50ms loop
    if (currentSec !== prevDisplaySecRef.current || !cachedDigitsRef.current) {
      prevDisplaySecRef.current = currentSec;
      cachedDigitsRef.current = formatTimerDigits(displayMs);
    }
    return cachedDigitsRef.current;
  }, [displayMs]);

  const angles = useMemo(() => {
    return calculateNeedleAngles(elapsedMs);
  }, [elapsedMs]);

  const isCompleted = useMemo(() => {
    return resolveTimerCompletion(mode, elapsedMs, targetDuration, isRunning);
  }, [mode, elapsedMs, targetDuration, isRunning]);

  // Trigger completion sound and auto-save callback once upon reaching target
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
