'use client';

/**
 * X-29 Timer Mode Selector Component (features/focus/components/TimerModeSelector.tsx)
 * 
 * Segmented mode switcher for STOPWATCH, TIMER, and ALARM RANGE.
 */

import React from 'react';
import type { TimerMode } from '@/types/timer';

interface TimerModeSelectorProps {
  currentMode: TimerMode;
  onSelectMode: (mode: TimerMode) => void;
  disabled?: boolean;
}

export const TimerModeSelector: React.FC<TimerModeSelectorProps> = React.memo(function TimerModeSelector({
  currentMode,
  onSelectMode,
  disabled = false,
}) {
  const modes: Array<{ id: TimerMode; label: string; elementId: string }> = [
    { id: 'stopwatch', label: 'STOPWATCH', elementId: 'tm-mode-stopwatch' },
    { id: 'timer', label: 'TIMER', elementId: 'tm-mode-timer' },
    { id: 'alarm', label: 'ALARM RANGE', elementId: 'tm-mode-alarm' },
  ];

  return (
    <div
      id="timer-mode-switcher"
      className="flex bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800/80 shadow-inner w-full justify-between backdrop-blur-md h-[46px] items-center"
      role="tablist"
      aria-label="Timer Mode Selection"
    >
      {modes.map((m) => {
        const isActive = currentMode === m.id;
        return (
          <button
            key={m.id}
            id={m.elementId}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={disabled}
            onClick={() => onSelectMode(m.id)}
            className={`w-1/3 h-full text-[10px] sm:text-xs font-black rounded-xl transition-all touch-manipulation flex items-center justify-center select-none ${
              isActive
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            } disabled:opacity-50 disabled:pointer-events-none active:scale-95`}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
});
