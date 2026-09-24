'use client';

/**
 * X-29 Timer Controls Component (features/focus/components/TimerControls.tsx)
 * 
 * Accessible primary control buttons: Reset, Start / Pause / Resume, and Save.
 * Includes confirmation modal on reset to protect accumulated study time.
 */

import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Play, Pause, RotateCcw, BookmarkCheck, AlertTriangle } from 'lucide-react';

interface TimerControlsProps {
  isRunning: boolean;
  elapsedMs: number;
  onToggle: () => void;
  onReset: () => void;
  onSave: () => void;
}

export const TimerControls: React.FC<TimerControlsProps> = React.memo(function TimerControls({
  isRunning,
  elapsedMs,
  onToggle,
  onReset,
  onSave,
}) {
  const [resetConfirmOpen, setResetConfirmOpen] = useState<boolean>(false);

  let toggleText = 'START';
  let toggleBg = 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30';
  let ToggleIcon = Play;

  if (isRunning) {
    toggleText = 'PAUSE';
    toggleBg = 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30';
    ToggleIcon = Pause;
  } else if (elapsedMs > 0) {
    toggleText = 'RESUME';
    toggleBg = 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30';
    ToggleIcon = Play;
  }

  const canSave = elapsedMs >= 1000;

  const handleResetClick = () => {
    if (elapsedMs > 0) {
      setResetConfirmOpen(true);
    } else {
      onReset();
    }
  };

  const handleConfirmReset = () => {
    onReset();
    setResetConfirmOpen(false);
  };

  return (
    <>
      <div
        id="timer-control-buttons-bar"
        className="flex gap-2 sm:gap-4 w-full max-w-xl justify-center items-center mt-1 sm:mt-2"
        role="group"
        aria-label="Timer Controls"
      >
        {/* Reset Button */}
        <button
          id="timer-btn-reset"
          type="button"
          onClick={handleResetClick}
          className="flex-1 py-3 sm:py-3.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all text-slate-300 touch-manipulation min-h-[44px]"
        >
          RESET
        </button>

        {/* Primary Toggle (Start / Pause / Resume) */}
        <button
          id="timer-btn-toggle"
          type="button"
          onClick={onToggle}
          className={`flex-[1.5] py-3 sm:py-3.5 ${toggleBg} font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg active:scale-95 transition-all touch-manipulation min-h-[44px]`}
        >
          {toggleText}
        </button>

        {/* Save Session Button */}
        <button
          id="timer-btn-save"
          type="button"
          disabled={!canSave}
          onClick={onSave}
          className="flex-1 py-3 sm:py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:pointer-events-none text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg active:scale-95 transition-all touch-manipulation min-h-[44px]"
        >
          SAVE
        </button>
      </div>

      {/* Confirmation Modal for Reset */}
      <Dialog.Root open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl z-50 text-white focus:outline-none animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-400 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <Dialog.Title className="text-base font-black">
                Reset Timer?
              </Dialog.Title>
            </div>
            <Dialog.Description className="text-xs text-slate-400 leading-relaxed mb-6">
              Are you sure you want to reset the current timer? All accumulated focus time will be cleared.
            </Dialog.Description>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Keep Time
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
              >
                Yes, Reset
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
});
