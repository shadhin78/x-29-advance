'use client';

/**
 * X-29 Preset Buttons Component (features/focus/components/PresetButtons.tsx)
 * 
 * Duration presets: Free, 15m, 25m, 45m, 60m, Custom.
 * Built with accessible dialog for custom minutes input.
 */

import React, { useState } from 'react';
import type { TimerMode } from '@/types/timer';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Clock } from 'lucide-react';

interface PresetButtonsProps {
  mode: TimerMode;
  targetDurationSec: number;
  onSelectPreset: (minutes: number) => void;
  disabled?: boolean;
}

const PRESET_MINUTES = [15, 25, 45, 60];

export const PresetButtons: React.FC<PresetButtonsProps> = React.memo(function PresetButtons({
  mode,
  targetDurationSec,
  onSelectPreset,
  disabled = false,
}) {
  const [customDialogOpen, setCustomDialogOpen] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>('30');

  const currentMinutes = Math.round(targetDurationSec / 60);
  const isFreeActive = mode === 'stopwatch' && targetDurationSec === 0;
  const isStandardPreset = PRESET_MINUTES.includes(currentMinutes);
  const isCustomActive = !isFreeActive && !isStandardPreset && targetDurationSec > 0;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(customInput, 10);
    if (!isNaN(mins) && mins > 0) {
      onSelectPreset(mins);
      setCustomDialogOpen(false);
    }
  };

  const activeClass =
    'flex-1 min-w-[65px] sm:min-w-[70px] py-2 sm:py-2.5 px-2.5 sm:px-3 bg-blue-600 text-white rounded-xl text-[11px] sm:text-xs font-black uppercase transition-all border border-blue-400 active:scale-95 touch-manipulation shadow-md select-none';
  const inactiveClass =
    'flex-1 min-w-[65px] sm:min-w-[70px] py-2 sm:py-2.5 px-2.5 sm:px-3 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-xl text-[11px] sm:text-xs font-black uppercase transition-all border border-slate-700/60 active:scale-95 touch-manipulation shadow-sm select-none';

  return (
    <>
      <div
        id="timer-presets-container"
        className="flex flex-wrap justify-center gap-1.5 sm:gap-2 w-full max-w-xl my-1"
        role="group"
        aria-label="Timer Duration Presets"
      >
        {/* Free / Open-ended Stopwatch mode */}
        {mode === 'stopwatch' && (
          <button
            id="timer-preset-btn-0"
            type="button"
            disabled={disabled}
            onClick={() => onSelectPreset(0)}
            className={isFreeActive ? activeClass : inactiveClass}
            aria-pressed={isFreeActive}
          >
            Free
          </button>
        )}

        {/* Standard Presets: 15, 25, 45, 60 */}
        {PRESET_MINUTES.map((mins) => {
          const isActive = targetDurationSec === mins * 60;
          return (
            <button
              key={mins}
              id={`timer-preset-btn-${mins}`}
              type="button"
              disabled={disabled}
              onClick={() => onSelectPreset(mins)}
              className={isActive ? activeClass : inactiveClass}
              aria-pressed={isActive}
            >
              {mins} Min
            </button>
          );
        })}

        {/* Custom Preset Button */}
        <button
          id="timer-preset-btn-custom"
          type="button"
          disabled={disabled}
          onClick={() => {
            setCustomInput(isCustomActive ? String(currentMinutes) : '30');
            setCustomDialogOpen(true);
          }}
          className={isCustomActive ? activeClass : inactiveClass}
          aria-pressed={isCustomActive}
        >
          {isCustomActive ? `${currentMinutes} Min` : 'Custom'}
        </button>
      </div>

      {/* Accessible Custom Duration Dialog */}
      <Dialog.Root open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl z-50 text-white focus:outline-none animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <Dialog.Title className="text-base font-black uppercase tracking-wider">
                  Set Custom Duration
                </Dialog.Title>
              </div>
              <Dialog.Close className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>

            <form onSubmit={handleCustomSubmit} className="mt-5 space-y-4">
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="custom-timer-minutes-input"
                  className="text-xs font-black uppercase tracking-widest text-slate-400"
                >
                  Duration (Minutes)
                </label>
                <input
                  id="custom-timer-minutes-input"
                  type="number"
                  min="1"
                  max="720"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-lg font-mono font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Enter target between 1 and 720 minutes.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCustomDialogOpen(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button
                  id="ctm-btn-submit"
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-95"
                >
                  Set Duration
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
});
