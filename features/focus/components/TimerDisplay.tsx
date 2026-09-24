'use client';

/**
 * X-29 Timer Display Component (features/focus/components/TimerDisplay.tsx)
 * 
 * Monospace split-color digital clock and dynamic status badge.
 */

import React from 'react';
import type { TimerDigits, TimerMode } from '@/types/timer';

interface TimerDisplayProps {
  digits: TimerDigits;
  isRunning: boolean;
  elapsedMs: number;
  mode: TimerMode;
  targetDurationSec: number;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = React.memo(function TimerDisplay({
  digits,
  isRunning,
  elapsedMs,
  mode,
  targetDurationSec,
}) {
  let statusText = 'READY';
  let statusClass = 'text-slate-400 dark:text-slate-500';
  let dotColor = 'bg-slate-400';

  if (isRunning) {
    statusText = 'FOCUSING';
    statusClass = 'text-emerald-500 dark:text-emerald-400';
    dotColor = 'bg-emerald-500 animate-pulse';
  } else if (elapsedMs > 0) {
    statusText = 'PAUSED';
    statusClass = 'text-amber-500 dark:text-amber-400';
    dotColor = 'bg-amber-500';
  } else if (mode === 'stopwatch' && targetDurationSec > 0) {
    const targetMins = Math.round(targetDurationSec / 60);
    statusText = `TARGET: ${targetMins} MIN (FORWARD)`;
    statusClass = 'text-blue-500 dark:text-blue-400';
    dotColor = 'bg-blue-500';
  } else if (mode === 'timer') {
    statusText = 'COUNTDOWN READY';
    statusClass = 'text-slate-400 dark:text-slate-500';
  } else if (mode === 'alarm') {
    statusText = 'ALARM RANGE READY';
    statusClass = 'text-slate-400 dark:text-slate-500';
  }

  return (
    <div
      id="timer-digital-display-container"
      className="flex flex-col items-center justify-center select-none"
      aria-live="polite"
    >
      <div
        id="timer-clock-text-split"
        className="font-mono text-4xl sm:text-5xl md:text-6xl font-black tracking-tight drop-shadow-md leading-none flex items-baseline"
      >
        <span
          id="timer-clock-hhmm"
          className="text-slate-900 dark:text-white transition-colors duration-300"
        >
          {digits.hhmm}
        </span>
        <span
          id="timer-clock-ssms"
          className="text-blue-600 dark:text-blue-500 transition-colors duration-300"
        >
          {digits.ss}
        </span>
      </div>

      {/* Hidden fallback element for legacy selectors and fullscreen CSS */}
      <span id="timer-clock-text" className="hidden">
        {digits.fullClock}
      </span>

      <span
        id="timer-status-text"
        className={`text-[9px] sm:text-xs font-bold uppercase tracking-widest ${statusClass} mt-1.5 sm:mt-2 transition-colors duration-300`}
      >
        {statusText}
      </span>
    </div>
  );
});
