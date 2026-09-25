/**
 * X-29 Focus Timer Engine (features/focus/services/timerEngine.ts)
 * 
 * Pure domain calculations for timer elapsed/remaining time,
 * chronograph dial geometry, time formatting, and completion checks.
 * 
 * ZERO DOM, ZERO React, ZERO Zustand, ZERO Storage dependencies.
 * Deterministic and 100% unit-testable.
 */

import type { TimerMode, TimerDigits, DialAngles } from '@/types/timer';

/**
 * Safely parses any start time format (Timestamp, Date, ISO string, or ms number) into millisecond epoch.
 */
export function parseStartTimeSafe(startTime: unknown): number {
  if (!startTime) return 0;
  if (typeof (startTime as { toDate?: () => Date }).toDate === 'function') {
    return (startTime as { toDate: () => Date }).toDate().getTime();
  }
  if (startTime instanceof Date) {
    return startTime.getTime();
  }
  if (typeof startTime === 'string') {
    const parsed = new Date(startTime).getTime();
    return isNaN(parsed) ? 0 : parsed;
  }
  const num = Number(startTime);
  return isNaN(num) ? 0 : num;
}

/**
 * Computes exact elapsed milliseconds using timestamp differences.
 * Prevents timer drift caused by background tab throttling or interval lag.
 */
export function calculateElapsedMs(
  startTime: unknown,
  elapsedBeforeStart: number,
  nowMs: number,
  isRunning: boolean
): number {
  const baseElapsed = Math.max(0, Number(elapsedBeforeStart) || 0);
  if (!isRunning) {
    return baseElapsed;
  }
  const parsedStart = parseStartTimeSafe(startTime);
  if (parsedStart <= 0) {
    return baseElapsed;
  }
  const delta = Math.max(0, nowMs - parsedStart);
  return baseElapsed + delta;
}

/**
 * Computes remaining milliseconds for a countdown timer or alarm.
 */
export function calculateRemainingMs(targetDurationSec: number, elapsedMs: number): number {
  const targetMs = Math.max(0, Number(targetDurationSec) || 0) * 1000;
  return Math.max(0, targetMs - Math.max(0, elapsedMs));
}

/**
 * Computes completion progress percentage (0 - 100).
 */
export function calculateProgressPercentage(elapsedMs: number, targetDurationSec: number): number {
  const targetMs = Math.max(0, Number(targetDurationSec) || 0) * 1000;
  if (targetMs <= 0) return 0;
  const ratio = Math.max(0, elapsedMs) / targetMs;
  return Math.min(100, Math.max(0, Math.round(ratio * 100)));
}

/**
 * Computes rotation angles for the chronograph sweep needle and 30-minute accumulator subdial.
 */
export function calculateNeedleAngles(elapsedMs: number): DialAngles {
  const totalSecsWithFraction = Math.max(0, elapsedMs) / 1000;
  const mainHandDeg = (totalSecsWithFraction % 60) * 6;
  const subdialDeg = ((totalSecsWithFraction % 1800) / 1800) * 360;
  return {
    mainHandDeg: Number(mainHandDeg.toFixed(2)),
    subdialDeg: Number(subdialDeg.toFixed(2)),
  };
}

// Pre-computed 2-digit string lookup table (00-99) for zero-allocation formatting
const PAD_2: readonly string[] = Array.from({ length: 100 }, (_, i) => String(i).padStart(2, '0'));

/**
 * High-speed 2-digit string pad with zero allocations for values 0-99.
 */
export function pad2Fast(num: number): string {
  if (num >= 0 && num < 100) {
    return PAD_2[num] || '00';
  }
  return String(Math.max(0, Math.floor(num))).padStart(2, '0');
}

/**
 * Formats a duration in milliseconds into digital clock components.
 */
export function formatTimerDigits(ms: number): TimerDigits {
  const safeMs = Math.max(0, Math.floor(ms));
  const totalSecs = Math.floor(safeMs / 1000);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  const hundredths = Math.floor((safeMs % 1000) / 10);

  const hours = pad2Fast(hrs);
  const minutes = pad2Fast(mins);
  const seconds = pad2Fast(secs);
  const hundredthsStr = pad2Fast(hundredths);

  return {
    hours,
    minutes,
    seconds,
    hundredths: hundredthsStr,
    hhmm: `${hours}:${minutes}:`,
    ss: seconds,
    fullClock: `${hours}:${minutes}:${seconds}`,
  };
}

/**
 * Legacy-compatible formatter for decimal hours (e.g. 1.5 -> "1 hr 30 min", 0.5 -> "30 min").
 */
export function formatHoursToHrMin(hoursDecimal: number): string {
  if (isNaN(hoursDecimal) || hoursDecimal <= 0) return '0 min';
  const totalMinutes = Math.round(hoursDecimal * 60);
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hrs > 0) {
    if (mins > 0) {
      return `${hrs} hr ${mins} min`;
    }
    return `${hrs} hr`;
  }
  return `${mins} min`;
}

/**
 * Formats total seconds into standard HH:MM:SS string.
 */
export function formatSecondsToClock(totalSeconds: number): string {
  const safeSecs = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safeSecs / 3600);
  const mins = Math.floor((safeSecs % 3600) / 60);
  const secs = safeSecs % 60;
  return `${pad2Fast(hrs)}:${pad2Fast(mins)}:${pad2Fast(secs)}`;
}

/**
 * Calculates duration in seconds between two "HH:MM" time strings.
 * Automatically wraps across midnight if end time is before start time.
 */
export function calculateAlarmDuration(startTimeStr: string, endTimeStr: string): number {
  if (!startTimeStr || !endTimeStr) return 0;
  const parseTimeToSeconds = (str: string): number => {
    const [h = 0, m = 0] = str.split(':').map(Number);
    return ((h || 0) * 3600) + ((m || 0) * 60);
  };
  const startSec = parseTimeToSeconds(startTimeStr);
  const endSec = parseTimeToSeconds(endTimeStr);
  let diff = endSec - startSec;
  if (diff <= 0) {
    diff += 24 * 3600; // Crosses midnight
  }
  return diff;
}

/**
 * Detects whether an active timer session has completed its target.
 */
export function resolveTimerCompletion(
  mode: TimerMode,
  elapsedMs: number,
  targetDurationSec: number,
  isRunning: boolean
): boolean {
  if (!isRunning || targetDurationSec <= 0) return false;
  const targetMs = targetDurationSec * 1000;
  return elapsedMs >= targetMs;
}

/**
 * Determines which dial ticks (0-59) should be active/highlighted vs dimmed.
 */
export function calculateDialTickHighlight(
  mode: TimerMode,
  elapsedMs: number,
  targetDurationSec: number
): { isTargeted: boolean; highlightThreshold: number; isForwardFill: boolean } {
  if (mode === 'stopwatch') {
    if (targetDurationSec > 0) {
      const targetMs = targetDurationSec * 1000;
      const progressRatio = Math.min(1, Math.max(0, elapsedMs / targetMs));
      const elapsedTicks = Math.floor(progressRatio * 60);
      return {
        isTargeted: true,
        highlightThreshold: elapsedTicks,
        isForwardFill: true, // tick <= elapsedTicks is highlighted
      };
    }
    return {
      isTargeted: false,
      highlightThreshold: -1,
      isForwardFill: false,
    };
  }

  // Timer / Alarm mode: Countdown backwards
  const targetMs = Math.max(1000, targetDurationSec * 1000);
  const progressRatio = Math.min(1, Math.max(0, elapsedMs / targetMs));
  const elapsedTicks = Math.floor(progressRatio * 60);
  return {
    isTargeted: true,
    highlightThreshold: elapsedTicks,
    isForwardFill: false, // tick >= elapsedTicks is highlighted (remaining time)
  };
}
