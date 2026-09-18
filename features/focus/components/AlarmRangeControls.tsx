'use client';

/**
 * X-29 Alarm Range Controls Component (features/focus/components/AlarmRangeControls.tsx)
 * 
 * Configures start and end times for Alarm Range mode.
 */

import React, { useEffect, useState } from 'react';

interface AlarmRangeControlsProps {
  alarmStart: string;
  alarmEnd: string;
  useCurrent: boolean;
  onConfigChange: (start: string, end: string, useCurrent: boolean) => void;
  disabled?: boolean;
}

export const AlarmRangeControls: React.FC<AlarmRangeControlsProps> = React.memo(function AlarmRangeControls({
  alarmStart,
  alarmEnd,
  useCurrent,
  onConfigChange,
  disabled = false,
}) {
  const [localStart, setLocalStart] = useState<string>(alarmStart || '');
  const [localEnd, setLocalEnd] = useState<string>(alarmEnd || '');
  const [localUseCurrent, setLocalUseCurrent] = useState<boolean>(useCurrent !== false);

  // Sync current time if useCurrent is enabled
  useEffect(() => {
    if (localUseCurrent) {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const curTime = `${hh}:${mm}`;
      setLocalStart(curTime);
      onConfigChange(curTime, localEnd, true);
    }
  }, [localUseCurrent]);

  const handleUseCurrentToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setLocalUseCurrent(checked);
    if (checked) {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const curTime = `${hh}:${mm}`;
      setLocalStart(curTime);
      onConfigChange(curTime, localEnd, true);
    } else {
      onConfigChange(localStart, localEnd, false);
    }
  };

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalStart(val);
    onConfigChange(val, localEnd, localUseCurrent);
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalEnd(val);
    onConfigChange(localStart, val, localUseCurrent);
  };

  return (
    <div
      id="timer-alarm-container"
      className="flex flex-col gap-3 w-full text-left bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 my-1 max-w-xl"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Alarm Range Configuration
        </span>
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            id="timer-alarm-use-current"
            checked={localUseCurrent}
            onChange={handleUseCurrentToggle}
            disabled={disabled}
            className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 bg-slate-900"
          />
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
            Use Current Time
          </span>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="timer-alarm-start"
            className="text-[9px] font-black uppercase tracking-wider text-slate-400"
          >
            Start Time
          </label>
          <input
            type="time"
            id="timer-alarm-start"
            value={localStart}
            onChange={handleStartChange}
            disabled={disabled || localUseCurrent}
            className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold outline-none w-full shadow-sm touch-manipulation disabled:opacity-50"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="timer-alarm-end"
            className="text-[9px] font-black uppercase tracking-wider text-slate-400"
          >
            End Time
          </label>
          <input
            type="time"
            id="timer-alarm-end"
            value={localEnd}
            onChange={handleEndChange}
            disabled={disabled}
            className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold outline-none w-full shadow-sm touch-manipulation focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
});
